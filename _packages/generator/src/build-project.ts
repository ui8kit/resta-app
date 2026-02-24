import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import type { AppConfig, BuildResult } from '@ui8kit/sdk';
import { transformJsx } from './transformer/transform';
import { ReactPlugin } from './plugins/template/built-in/ReactPlugin';
import { getFallbackCoreComponents } from './core/scanner/core-component-scanner';
import { generateRegistry } from './scripts/generate-registry';

type SourceKind = 'blocks' | 'layouts' | 'partials';

interface SourceDef {
  kind: SourceKind;
  sourceDir: string;
  srcOutTarget: string;
  registryType: 'registry:block' | 'registry:layout' | 'registry:partial';
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
      },
      {
        kind: 'layouts',
        sourceDir: resolve(cwd, rawConfig.layoutsDir ?? 'src/layouts'),
        srcOutTarget: join('src', 'layouts'),
        registryType: 'registry:layout',
      },
      {
        kind: 'partials',
        sourceDir: resolve(cwd, rawConfig.partialsDir ?? 'src/partials'),
        srcOutTarget: join('src', 'partials'),
        registryType: 'registry:partial',
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
      await ensureCleanDir(join(outputDir, sourceDef.srcOutTarget));
    }
    await ensureCleanDir(join(outputDir, '_temp'));

    const passthroughComponents = getFallbackCoreComponents();
    const plugin = new ReactPlugin();

    for (const sourceDef of sourceDefs) {
      let files: string[] = [];
      try {
        files = await collectTsxFiles(sourceDef.sourceDir);
      } catch {
        warnings.push(
          `Source directory not found for ${sourceDef.kind}: ${relative(cwd, sourceDef.sourceDir).replace(/\\/g, '/')}`
        );
        continue;
      }

      for (const filePath of files) {
        const source = await readFile(filePath, 'utf-8');
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
        const relativePath = relative(sourceDef.sourceDir, filePath);
        const srcOutputPath = join(outputDir, sourceDef.srcOutTarget, relativePath);

        await mkdir(dirname(srcOutputPath), { recursive: true });
        await writeFile(srcOutputPath, output.content, 'utf-8');
        generated += 1;
      }
    }

    await generateRegistry({
      sourceDirs: sourceDefs.map((def) => ({
        path: def.sourceDir,
        type: def.registryType,
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
