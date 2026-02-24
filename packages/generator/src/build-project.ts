import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import type { AppConfig, BuildResult } from '@ui8kit/sdk';
import { transformJsx } from './transformer/transform';
import { ReactPlugin } from './plugins/template/built-in/ReactPlugin';
import { getFallbackCoreComponents } from './core/scanner/core-component-scanner';
import { generateRegistry } from './scripts/generate-registry';

type SourceKind = 'blocks' | 'layouts' | 'partials' | 'components';

interface SourceDef {
  kind: SourceKind;
  sourceDir: string;
  srcOutTarget: string;
  registryType?: 'registry:block' | 'registry:layout' | 'registry:partial';
  cleanBeforeWrite?: boolean;
}

function isTsxFile(fileName: string): boolean {
  if (!fileName.endsWith('.tsx')) return false;
  if (fileName.endsWith('.test.tsx')) return false;
  if (fileName.endsWith('.spec.tsx')) return false;
  if (fileName === 'index.tsx') return false;
  return true;
}

async function collectTsxFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) return collectTsxFiles(fullPath);
      if (entry.isFile() && isTsxFile(entry.name)) return [fullPath];
      return [] as string[];
    })
  );
  return nested.flat().sort();
}

async function ensureCleanDir(dirPath: string): Promise<void> {
  await rm(dirPath, { recursive: true, force: true });
  await mkdir(dirPath, { recursive: true });
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await readdir(path, { withFileTypes: true });
    return true;
  } catch {
    return false;
  }
}

async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const from = join(sourceDir, entry.name);
    const to = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(from, to);
    } else if (entry.isFile()) {
      await mkdir(dirname(to), { recursive: true });
      await copyFile(from, to);
    }
  }
}

function localSdkTypes(): string {
  return `import type { DashboardSidebarLink, NavItem, SidebarLink } from '../../types/navigation';

export type SiteInfo = {
  title: string;
  subtitle?: string;
  [key: string]: unknown;
};

export type PageFixture = {
  page: {
    website?: unknown[];
    admin?: unknown[];
    [key: string]: unknown;
  };
};
`;
}

function stripDslIfElse(source: string): string {
  const withoutDslImport = source.replace(
    /import\s+\{\s*If\s*,\s*Else\s*\}\s+from\s+['"]@ui8kit\/dsl['"];\n?/g,
    ''
  );

  const withElseReplaced = withoutDslImport.replace(
    /<If[^>]*value=\{([^}]+)\}[^>]*>([\s\S]*?)<Else>([\s\S]*?)<\/Else>\s*<\/If>/g,
    (_full, condition, truthy, falsy) => `{(${condition.trim()}) ? (${truthy.trim()}) : (${falsy.trim()})}`
  );

  return withElseReplaced.replace(
    /<If[^>]*value=\{([^}]+)\}[^>]*>([\s\S]*?)<\/If>/g,
    (_full, condition, truthy) => `{(${condition.trim()}) ? (${truthy.trim()}) : null}`
  );
}

function transformSheetDslSource(source: string): string {
  let output = source.replace(/import\s+\{\s*If\s*,\s*Else\s*\}\s+from\s+["']@ui8kit\/dsl["'];\n?/, '');
  output = output.replace(
    /<If\s+test="showTrigger"\s+value=\{showTrigger\}>\s*([\s\S]*?)\s*<\/If>/m,
    `{showTrigger ? (\n$1\n        ) : null}`
  );
  output = output.replace(
    /<If\s+test="title"\s+value=\{!!title\}>\s*([\s\S]*?)\s*<Else>\s*([\s\S]*?)\s*<\/Else>\s*<\/If>/m,
    `{title ? (\n$1\n              ) : (\n$2\n              )}`
  );
  return output;
}

function transformIconDslSource(source: string): string {
  let output = source.replace(/import\s+\{\s*If\s*,\s*Else\s*\}\s+from\s+["']@ui8kit\/dsl["'];\n?/, '');
  output = output.replace(
    /<If\s+test="LucideIcon"\s+value=\{!!LucideIcon\}>\s*([\s\S]*?)\s*<Else>\s*([\s\S]*?)\s*<\/Else>\s*<\/If>/m,
    `{LucideIcon ? (\n$1\n        ) : (\n$2\n        )}`
  );
  return output;
}

function generateExportsIndex(filePaths: string[]): string {
  const unique = [...new Set(filePaths)].sort();
  return unique.map((path) => `export * from './${path}';`).join('\n') + '\n';
}

async function collectExportableFiles(dirPath: string, baseDir = dirPath): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const collected: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collected.push(...(await collectExportableFiles(fullPath, baseDir)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!(entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) continue;
    if (entry.name === 'index.ts' || entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;
    const rel = relative(baseDir, fullPath).replace(/\\/g, '/').replace(/\.(tsx|ts)$/, '');
    collected.push(rel);
  }
  return collected;
}

function transformDataTypesSource(source: string): string {
  const withoutSdkImport = source.replace(
    /import type\s+\{[^}]+\}\s+from\s+['"]@ui8kit\/sdk\/source\/data['"];\n?/m,
    ''
  );
  return `${localSdkTypes()}\n${withoutSdkImport}`.replace(/\n{3,}/g, '\n\n');
}

function transformFixturesAdapterSource(source: string): string {
  return source.replace(
    /import type \{ PageFixture, SiteInfo \} from ['"]@ui8kit\/sdk\/source\/data['"];/,
    "import type { PageFixture, SiteInfo } from './types';"
  );
}

function transformContextSource(source: string): string {
  const withoutSdkRuntimeImport = source.replace(
    /import\s+\{\s*createContext,\s*EMPTY_ARRAY\s*\}\s+from\s+['"]@ui8kit\/sdk\/source\/data['"];\n?/m,
    ''
  );
  const withoutSdkTypeImport = withoutSdkRuntimeImport.replace(
    /import type\s+\{[\s\S]*?\}\s+from\s+['"]@ui8kit\/sdk\/source\/data['"];\n?/m,
    "import type { DashboardSidebarLink, NavItem, SidebarLink } from '../types/navigation';\n"
  );
  const renamedFactory = withoutSdkTypeImport
    .replace(/createContext</g, 'createAppContext<')
    .replace(/\?\?\s*EMPTY_ARRAY/g, '?? []');
  const factory = `function createAppContext<TFixtures extends Record<string, unknown>>(input: {
  site: CanonicalContextInput['site'];
  page: CanonicalContextInput['page'];
  navItems: NavItem[];
  sidebarLinks: SidebarLink[];
  adminSidebarLinks: DashboardSidebarLink[];
  adminSidebarLabel: string;
  dynamicRoutePatterns: string[];
  fixtures: TFixtures;
}) {
  return Object.freeze({
    ...input,
    getAdminSidebarLinks: (currentPath?: string) =>
      input.adminSidebarLinks.map((link) => ({
        ...link,
        active: currentPath ? link.href === currentPath : link.active,
      })),
  });
}

`;
  return renamedFactory.replace(
    /import type \{ CanonicalContextInput \} from '\.\/adapters\/types';\n\n/,
    "import type { CanonicalContextInput } from './adapters/types';\n\n" + factory
  );
}

export async function buildProject(rawConfig: AppConfig, cwd = process.cwd()): Promise<BuildResult> {
  const outputDir = resolve(cwd, rawConfig.outDir ?? `dist/${rawConfig.target}`);
  const warnings: string[] = [];
  const errors: string[] = [];
  let generated = 0;

  try {
    if (rawConfig.target !== 'react') {
      return {
        ok: false,
        generated: 0,
        outputDir,
        engine: rawConfig.target,
        errors: [`Unsupported target "${rawConfig.target}". Only "react" target is supported.`],
        warnings,
      };
    }

    const resolvedComponentsDir = resolve(cwd, rawConfig.componentsDir);
    const sourceDefs: SourceDef[] = [
      {
        kind: 'blocks',
        sourceDir: resolve(cwd, rawConfig.blocksDir ?? 'src/blocks'),
        srcOutTarget: join('src', 'blocks'),
        registryType: 'registry:block',
        cleanBeforeWrite: true,
      },
      {
        kind: 'layouts',
        sourceDir: resolve(cwd, rawConfig.layoutsDir ?? 'src/layouts'),
        srcOutTarget: join('src', 'layouts'),
        registryType: 'registry:layout',
        cleanBeforeWrite: true,
      },
      {
        kind: 'partials',
        sourceDir: resolve(cwd, rawConfig.partialsDir ?? 'src/partials'),
        srcOutTarget: join('src', 'partials'),
        registryType: 'registry:partial',
        cleanBeforeWrite: true,
      },
      {
        kind: 'components',
        sourceDir: resolvedComponentsDir,
        srcOutTarget: join('src', 'components'),
        cleanBeforeWrite: false,
      },
    ];

    try {
      await readdir(resolvedComponentsDir, { withFileTypes: true });
    } catch {
      warnings.push(
        `componentsDir not found: ${relative(cwd, resolvedComponentsDir).replace(/\\/g, '/')}`
      );
    }

    await mkdir(outputDir, { recursive: true });
    await rm(join(outputDir, 'node_modules'), { recursive: true, force: true });
    await rm(join(outputDir, 'blocks'), { recursive: true, force: true });
    await rm(join(outputDir, 'layouts'), { recursive: true, force: true });
    await rm(join(outputDir, 'partials'), { recursive: true, force: true });

    for (const sourceDef of sourceDefs) {
      if (sourceDef.cleanBeforeWrite) {
        await ensureCleanDir(join(outputDir, sourceDef.srcOutTarget));
      } else {
        await mkdir(join(outputDir, sourceDef.srcOutTarget), { recursive: true });
      }
    }
    await ensureCleanDir(join(outputDir, '_temp'));

    const passthroughComponents = getFallbackCoreComponents();
    const plugin = new ReactPlugin();

    for (const sourceDef of sourceDefs) {
      let files: string[] = [];
      try {
        if (sourceDef.kind === 'components') {
          await copyDirectory(sourceDef.sourceDir, join(outputDir, sourceDef.srcOutTarget));
        }
        files = await collectTsxFiles(sourceDef.sourceDir);
      } catch {
        warnings.push(
          `Source directory not found for ${sourceDef.kind}: ${relative(cwd, sourceDef.sourceDir).replace(/\\/g, '/')}`
        );
        continue;
      }

      for (const filePath of files) {
        const source = await readFile(filePath, 'utf-8');
        if (sourceDef.kind === 'components' && !source.includes('@ui8kit/dsl')) {
          continue;
        }
        if (sourceDef.kind === 'components' && source.includes('@ui8kit/dsl')) {
          const relativePath = relative(sourceDef.sourceDir, filePath).replace(/\\/g, '/');
          const srcOutputPath = join(outputDir, sourceDef.srcOutTarget, relativePath);
          let fallbackContent: string;
          if (relativePath === 'Sheet.tsx') {
            fallbackContent = transformSheetDslSource(source);
          } else if (relativePath === 'ui/Icon.tsx') {
            fallbackContent = transformIconDslSource(source);
          } else {
            fallbackContent = stripDslIfElse(source);
          }
          await mkdir(dirname(srcOutputPath), { recursive: true });
          await writeFile(srcOutputPath, fallbackContent, 'utf-8');
          generated += 1;
          continue;
        }
        const transformResult = transformJsx(source, {
          sourceFile: filePath,
          passthroughComponents,
        });

        if (transformResult.errors.length > 0 || transformResult.tree.children.length === 0) {
          warnings.push(
            `Skipped ${relative(cwd, filePath).replace(/\\/g, '/')} (${transformResult.errors.join('; ') || 'empty tree'})`
          );
          continue;
        }

        if (transformResult.tree.meta?.imports) {
          transformResult.tree.meta.imports = transformResult.tree.meta.imports.filter(
            (imp) => imp.source !== '@ui8kit/dsl'
          );
        }

        const output = await plugin.transform(transformResult.tree);
        const normalizedContent = output.content.replace(/from '@ui8kit\/core'/g, "from '@/components'");
        const relativePath = relative(sourceDef.sourceDir, filePath);
        const srcOutputPath = join(outputDir, sourceDef.srcOutTarget, relativePath);

        await mkdir(dirname(srcOutputPath), { recursive: true });
        await writeFile(srcOutputPath, normalizedContent, 'utf-8');
        generated += 1;
      }
    }

    for (const indexTarget of [join(outputDir, 'src', 'blocks'), join(outputDir, 'src', 'layouts'), join(outputDir, 'src', 'partials')]) {
      if (!(await pathExists(indexTarget))) continue;
      const exports = await collectExportableFiles(indexTarget);
      await writeFile(join(indexTarget, 'index.ts'), generateExportsIndex(exports), 'utf-8');
    }

    const sourceDataDir = resolve(cwd, 'src/data');
    const targetDataDir = resolve(outputDir, 'src/data');
    if (await pathExists(sourceDataDir)) {
      await copyDirectory(sourceDataDir, targetDataDir);
      const adaptersTypesPath = join(targetDataDir, 'adapters', 'types.ts');
      const fixturesAdapterPath = join(targetDataDir, 'adapters', 'fixtures.adapter.ts');
      const contextPath = join(targetDataDir, 'context.ts');

      try {
        const adaptersTypes = await readFile(adaptersTypesPath, 'utf-8');
        await writeFile(adaptersTypesPath, transformDataTypesSource(adaptersTypes), 'utf-8');
      } catch {
        warnings.push('Could not transform src/data/adapters/types.ts');
      }

      try {
        const fixturesAdapter = await readFile(fixturesAdapterPath, 'utf-8');
        await writeFile(fixturesAdapterPath, transformFixturesAdapterSource(fixturesAdapter), 'utf-8');
      } catch {
        warnings.push('Could not transform src/data/adapters/fixtures.adapter.ts');
      }

      try {
        const contextSource = await readFile(contextPath, 'utf-8');
        await writeFile(contextPath, transformContextSource(contextSource), 'utf-8');
      } catch {
        warnings.push('Could not transform src/data/context.ts');
      }
    }

    const fixturesDir = resolve(cwd, 'fixtures');
    if (await pathExists(fixturesDir)) {
      const fixturesOutDir = resolve(outputDir, 'fixtures');
      await rm(fixturesOutDir, { recursive: true, force: true });
      await copyDirectory(fixturesDir, fixturesOutDir);
    }

    await generateRegistry({
      sourceDirs: sourceDefs.filter((def) => Boolean(def.registryType)).map((def) => ({
        path: def.sourceDir,
        type: def.registryType!,
        target: def.srcOutTarget.replace(/\\/g, '/'),
      })),
      outputPath: join(outputDir, '_temp', 'registry.json'),
      registryName: rawConfig.registry ?? 'ui8kit',
      version: '1.0.0',
      write: true,
      excludeDependencies: ['@ui8kit/dsl'],
    });

    return {
      ok: true,
      generated,
      outputDir,
      engine: rawConfig.target,
      errors,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    return {
      ok: false,
      generated,
      outputDir,
      engine: rawConfig.target,
      errors,
      warnings,
    };
  }
}
