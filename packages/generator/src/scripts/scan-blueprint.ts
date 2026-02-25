import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  type BlueprintDocument,
  type BlueprintEntity,
  type Ui8kitConfigLike,
  extractQuotedStrings,
  getBlueprintPath,
  listFilesRecursive,
  loadUi8kitConfig,
  parseAppRoutes,
  parseExportedTypeNames,
  parseNamedImports,
  pascalCase,
  readJson,
  readText,
  relPath,
  singularize,
  toPosixPath,
  writeJsonFile,
} from './blueprint-shared';

type RuntimeUi8kitConfig = Ui8kitConfigLike & {
  platformDomain?: string;
  tokens?: string;
};

interface FixtureAdapterScanResult {
  fixturePathByKey: Map<string, string>;
}

interface ContextScanResult {
  dynamicRoutePatterns: string[];
  fixtureKeys: string[];
}

interface AppRouteScanResult {
  paths: string[];
  routeFileByPath: Map<string, string>;
}

interface TypeScanResult {
  fixtureTypeByKey: Map<string, string>;
}

export interface ScanBlueprintOptions {
  cwd: string;
  outputFile?: string;
  silent?: boolean;
}

export interface ScanBlueprintResult {
  blueprintPath: string;
  blueprint: BlueprintDocument;
}

function resolveConfiguredPath(cwd: string, configured: string | undefined, fallback: string): string {
  return resolve(cwd, configured ?? fallback);
}

function resolveImportToSourceFile(cwd: string, importerPath: string, specifier: string): string {
  if (specifier.startsWith('@/')) {
    return resolve(cwd, `src/${specifier.slice(2)}.tsx`);
  }
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return resolve(dirname(importerPath), `${specifier}.tsx`);
  }
  return resolve(cwd, specifier);
}

function parseFixtureAdapter(adapterPath: string): FixtureAdapterScanResult {
  const fixturePathByKey = new Map<string, string>();
  if (!existsSync(adapterPath)) return { fixturePathByKey };

  const source = readText(adapterPath);
  const adapterDir = dirname(adapterPath);
  const importVarToFixturePath = new Map<string, string>();
  const importRegex = /import\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]*fixtures[^'"]*\.json)['"]/g;

  let importMatch: RegExpExecArray | null;
  while ((importMatch = importRegex.exec(source)) !== null) {
    const identifier = importMatch[1]!;
    const specifier = importMatch[2]!;
    importVarToFixturePath.set(identifier, resolve(adapterDir, specifier));
  }

  const fixturesBlockMatch = source.match(/fixtures:\s*\{([\s\S]*?)\}\s*,/);
  if (!fixturesBlockMatch) return { fixturePathByKey };

  const fixturesBlock = fixturesBlockMatch[1]!;
  const fixtureBindingRegex = /([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_]+)/g;
  let bindingMatch: RegExpExecArray | null;
  while ((bindingMatch = fixtureBindingRegex.exec(fixturesBlock)) !== null) {
    const key = bindingMatch[1]!;
    const variable = bindingMatch[2]!;
    const fixturePath = importVarToFixturePath.get(variable);
    if (fixturePath) {
      fixturePathByKey.set(key, fixturePath);
    }
  }

  return { fixturePathByKey };
}

function parseCanonicalFixtureTypes(typesPath: string): TypeScanResult {
  const fixtureTypeByKey = new Map<string, string>();
  if (!existsSync(typesPath)) return { fixtureTypeByKey };

  const source = readText(typesPath);
  const canonicalBlockMatch = source.match(/export\s+type\s+CanonicalContextInput\s*=\s*\{([\s\S]*?)\n\};/);
  if (!canonicalBlockMatch) return { fixtureTypeByKey };

  const canonicalBlock = canonicalBlockMatch[1]!;
  const fixturesBlockMatch = canonicalBlock.match(/fixtures:\s*\{([\s\S]*?)\}\s*;/);
  if (!fixturesBlockMatch) return { fixtureTypeByKey };

  const fixturesBlock = fixturesBlockMatch[1]!;
  const fixtureTypeRegex = /([A-Za-z0-9_]+)\??\s*:\s*([A-Za-z0-9_]+)/g;
  let fixtureTypeMatch: RegExpExecArray | null;
  while ((fixtureTypeMatch = fixtureTypeRegex.exec(fixturesBlock)) !== null) {
    fixtureTypeByKey.set(fixtureTypeMatch[1]!, fixtureTypeMatch[2]!);
  }

  return { fixtureTypeByKey };
}

function parseContext(contextPath: string): ContextScanResult {
  if (!existsSync(contextPath)) {
    return { dynamicRoutePatterns: [], fixtureKeys: [] };
  }

  const source = readText(contextPath);
  const dynamicRoutePatternsMatch = source.match(/dynamicRoutePatterns:\s*\[([\s\S]*?)\]/);
  const dynamicRoutePatterns = dynamicRoutePatternsMatch
    ? extractQuotedStrings(dynamicRoutePatternsMatch[1]!)
    : [];

  const fixtureKeys = new Set<string>();
  const fixturesBlockMatch = source.match(/fixtures:\s*\{([\s\S]*?)\}\s*,\s*\}\);/);
  if (fixturesBlockMatch) {
    const fixturesBlock = fixturesBlockMatch[1]!;
    const fixtureKeyRegex = /([A-Za-z0-9_]+)\s*:\s*input\.fixtures\.[A-Za-z0-9_]+/g;
    let fixtureKeyMatch: RegExpExecArray | null;
    while ((fixtureKeyMatch = fixtureKeyRegex.exec(fixturesBlock)) !== null) {
      fixtureKeys.add(fixtureKeyMatch[1]!);
    }
  }

  return {
    dynamicRoutePatterns,
    fixtureKeys: Array.from(fixtureKeys).sort(),
  };
}

function parseAppRoutesWithFiles(cwd: string, appPath: string): AppRouteScanResult {
  if (!existsSync(appPath)) {
    return { paths: [], routeFileByPath: new Map<string, string>() };
  }

  const source = readText(appPath);
  const imports = parseNamedImports(source);
  const routes = parseAppRoutes(source);
  const routeFileByPath = new Map<string, string>();

  for (const route of routes) {
    const importSpecifier = imports.get(route.component);
    if (!importSpecifier) continue;
    const absSource = resolveImportToSourceFile(cwd, appPath, importSpecifier);
    if (existsSync(absSource)) {
      routeFileByPath.set(route.path, absSource);
    }
  }

  return {
    paths: routes.map((route) => route.path),
    routeFileByPath,
  };
}

function detectItemsKey(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const obj = value as Record<string, unknown>;

  if (Array.isArray(obj.items)) return 'items';
  if (Array.isArray(obj.posts)) return 'posts';

  for (const [key, item] of Object.entries(obj)) {
    if (!Array.isArray(item)) continue;
    if (item.length === 0) continue;
    if (typeof item[0] === 'object' && item[0] !== null) {
      return key;
    }
  }

  return undefined;
}

function detectSlugField(value: unknown, itemsKey: string): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'slug';
  const obj = value as Record<string, unknown>;
  const items = obj[itemsKey];
  if (!Array.isArray(items) || items.length === 0) return 'slug';
  const firstItem = items[0];
  if (!firstItem || typeof firstItem !== 'object' || Array.isArray(firstItem)) return 'slug';
  const record = firstItem as Record<string, unknown>;
  if ('slug' in record) return 'slug';
  if ('id' in record) return 'id';
  const firstStringKey = Object.keys(record).find((key) => typeof record[key] === 'string');
  return firstStringKey ?? 'slug';
}

function scanEntityViews(cwd: string, blocksDir: string): Map<string, string[]> {
  const views = new Map<string, string[]>();
  for (const file of listFilesRecursive(blocksDir, ['.tsx'])) {
    const rel = relPath(cwd, file);
    const name = basename(file);
    if (!name.endsWith('View.tsx')) continue;

    const fromBlocks = rel.replace(/^src\/blocks\//, '');
    const segments = fromBlocks.split('/');
    if (segments.length < 2) continue;
    const entity = segments[0]!;
    const current = views.get(entity) ?? [];
    current.push(rel);
    views.set(entity, current);
  }

  for (const [entity, files] of views) {
    views.set(entity, files.sort());
  }
  return views;
}

function pickSingularType(typeFilePath: string, entityName: string): string {
  if (!existsSync(typeFilePath)) {
    return pascalCase(singularize(entityName));
  }

  const exportedTypes = parseExportedTypeNames(readText(typeFilePath));
  if (exportedTypes.length === 0) {
    return pascalCase(singularize(entityName));
  }

  const singularBase = pascalCase(singularize(entityName));
  const pluralBase = pascalCase(entityName);
  const preferred = [
    `${pluralBase}Item`,
    `${singularBase}Item`,
    `${singularBase}Post`,
    `${singularBase}`,
    `${pluralBase}`,
  ];

  for (const candidate of preferred) {
    if (exportedTypes.includes(candidate)) return candidate;
  }

  const semanticType = exportedTypes.find((name) => /(Item|Post|Entry)$/.test(name));
  return semanticType ?? exportedTypes[0]!;
}

function extractDomainsFromPageFixture(pageFixturePath: string): string[] {
  if (!existsSync(pageFixturePath)) return [];
  try {
    const fixture = readJson<{ page?: Record<string, unknown> }>(pageFixturePath);
    if (!fixture.page || typeof fixture.page !== 'object') return [];
    return Object.keys(fixture.page).sort();
  } catch {
    return [];
  }
}

function extractBrandTokens(tokensPath: string): { primary: string; accent: string; font: string } {
  if (!existsSync(tokensPath)) {
    return {
      primary: 'hsl(var(--primary))',
      accent: 'hsl(var(--accent))',
      font: 'sans-serif',
    };
  }

  const css = readText(tokensPath);
  const primary = css.match(/--primary:\s*([^;]+);/)?.[1]?.trim() ?? 'hsl(var(--primary))';
  const accent = css.match(/--accent:\s*([^;]+);/)?.[1]?.trim() ?? 'hsl(var(--accent))';
  const font = css.match(/--font-(?:sans|base):\s*([^;]+);/)?.[1]?.trim() ?? 'sans-serif';
  return { primary, accent, font };
}

function scanLayouts(cwd: string, layoutsDir: string): BlueprintDocument['layouts'] {
  const layoutFiles = listFilesRecursive(layoutsDir, ['.tsx'])
    .filter((file) => !toPosixPath(file).includes('/views/'))
    .map((file) => relPath(cwd, file))
    .sort();

  return layoutFiles.map((file) => {
    const name = basename(file, '.tsx');
    const viewPath = `src/layouts/views/${name}View.tsx`;
    return {
      name,
      file,
      view: existsSync(resolve(cwd, viewPath)) ? viewPath : undefined,
    };
  });
}

function scanPartials(cwd: string, partialsDir: string): BlueprintDocument['partials'] {
  return listFilesRecursive(partialsDir, ['.tsx'])
    .map((file) => relPath(cwd, file))
    .sort()
    .map((file) => ({
      name: basename(file, '.tsx'),
      file,
    }));
}

function buildEntity(
  cwd: string,
  entityName: string,
  fixturePathByKey: Map<string, string>,
  fixtureTypeByKey: Map<string, string>,
  entityViews: Map<string, string[]>,
  routeScan: AppRouteScanResult
): BlueprintEntity | undefined {
  const fixturePath = fixturePathByKey.get(entityName);
  if (!fixturePath || !existsSync(fixturePath)) return undefined;

  let fixtureJson: unknown;
  try {
    fixtureJson = readJson<unknown>(fixturePath);
  } catch {
    return undefined;
  }

  const itemsKey = detectItemsKey(fixtureJson);
  if (!itemsKey) return undefined;

  const listRoute = `/${entityName}`;
  const entityRoutes = routeScan.paths
    .filter((route) => route === listRoute || route.startsWith(`${listRoute}/`))
    .sort((a, b) => a.localeCompare(b));
  if (entityRoutes.length === 0) return undefined;

  const routeFiles = entityRoutes
    .map((route) => routeScan.routeFileByPath.get(route))
    .filter((value): value is string => Boolean(value))
    .map((file) => relPath(cwd, file))
    .sort();

  const typeFilePath = resolve(cwd, `src/types/${entityName}.ts`);
  const typeFile = existsSync(typeFilePath) ? relPath(cwd, typeFilePath) : `src/types/${entityName}.ts`;
  const singular = pickSingularType(typeFilePath, entityName);
  const slugField = detectSlugField(fixtureJson, itemsKey);
  const views = entityViews.get(entityName) ?? [];

  return {
    name: entityName,
    singular,
    fixture: relPath(cwd, fixturePath),
    fixtureType: fixtureTypeByKey.get(entityName),
    itemsKey,
    slugField,
    types: typeFile,
    routes: entityRoutes,
    views,
    routeFiles,
  };
}

function extractNavigationSource(cwd: string, fixturesDir: string): string {
  const navigationPath = resolve(fixturesDir, 'shared/navigation.json');
  return existsSync(navigationPath) ? relPath(cwd, navigationPath) : 'fixtures/shared/navigation.json';
}

function extractAppName(cwd: string, config: RuntimeUi8kitConfig, fixturesDir: string): string {
  const siteFixturePath = resolve(fixturesDir, 'shared/site.json');
  if (existsSync(siteFixturePath)) {
    try {
      const site = readJson<{ title?: string }>(siteFixturePath);
      if (site.title) return site.title;
    } catch {
      // no-op
    }
  }

  if (config.app?.name) return config.app.name;

  const packageJsonPath = resolve(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = readJson<{ name?: string }>(packageJsonPath);
      if (pkg.name) return pkg.name;
    } catch {
      // no-op
    }
  }

  return 'UI8Kit App';
}

export function scanBlueprint(options: ScanBlueprintOptions): ScanBlueprintResult {
  const cwd = resolve(options.cwd);
  const config = loadUi8kitConfig(cwd) as RuntimeUi8kitConfig;

  const fixturesDir = resolveConfiguredPath(cwd, config.fixtures, 'fixtures');
  const blocksDir = resolveConfiguredPath(cwd, config.blocksDir, 'src/blocks');
  const layoutsDir = resolveConfiguredPath(cwd, config.layoutsDir, 'src/layouts');
  const partialsDir = resolveConfiguredPath(cwd, config.partialsDir, 'src/partials');
  const componentsDir = resolveConfiguredPath(cwd, config.componentsDir, 'src/components');
  const appPath = resolve(cwd, 'src/App.tsx');
  const contextPath = resolve(cwd, 'src/data/context.ts');
  const adapterPath = resolve(cwd, 'src/data/adapters/fixtures.adapter.ts');
  const adapterTypesPath = resolve(cwd, 'src/data/adapters/types.ts');

  const routeScan = parseAppRoutesWithFiles(cwd, appPath);
  const fixtureAdapter = parseFixtureAdapter(adapterPath);
  const canonicalTypes = parseCanonicalFixtureTypes(adapterTypesPath);
  const contextScan = parseContext(contextPath);
  const entityViews = scanEntityViews(cwd, blocksDir);

  const candidateKeys = new Set<string>([
    ...fixtureAdapter.fixturePathByKey.keys(),
    ...contextScan.fixtureKeys,
    ...entityViews.keys(),
  ]);

  const entities: BlueprintEntity[] = Array.from(candidateKeys)
    .sort((a, b) => a.localeCompare(b))
    .map((key) =>
      buildEntity(
        cwd,
        key,
        fixtureAdapter.fixturePathByKey,
        canonicalTypes.fixtureTypeByKey,
        entityViews,
        routeScan
      )
    )
    .filter((entity): entity is BlueprintEntity => Boolean(entity));

  const pageFixturePath = resolve(fixturesDir, 'shared/page.json');
  const domains = extractDomainsFromPageFixture(pageFixturePath);
  const tokensPath = resolveConfiguredPath(cwd, config.tokens, 'src/assets/css/shadcn.css');
  const brandTokens = extractBrandTokens(tokensPath);
  const appName = extractAppName(cwd, config, fixturesDir);
  const componentsCount = listFilesRecursive(componentsDir, ['.tsx']).length;

  const blueprint: BlueprintDocument = {
    $schema: './schemas/blueprint.schema.json',
    version: '1',
    app: {
      name: appName,
      domain: config.app?.domain ?? config.platformDomain ?? domains[0] ?? 'website',
      lang: config.app?.lang ?? 'en',
    },
    brand: {
      primary: brandTokens.primary,
      accent: brandTokens.accent,
      font: brandTokens.font,
    },
    entities,
    layouts: scanLayouts(cwd, layoutsDir),
    partials: scanPartials(cwd, partialsDir),
    components: {
      index: 'src/components/index.ts',
      count: componentsCount,
    },
    navigation: {
      source: extractNavigationSource(cwd, fixturesDir),
      type: existsSync(resolve(cwd, 'src/types/navigation.ts'))
        ? 'src/types/navigation.ts'
        : 'src/types/navigation.ts',
    },
    context: {
      file: relPath(cwd, contextPath),
      adapter: relPath(cwd, adapterPath),
    },
    domains,
  };

  const blueprintPath = getBlueprintPath(cwd, options.outputFile);
  writeJsonFile(blueprintPath, blueprint);

  if (!options.silent) {
    const relBlueprintPath = relPath(cwd, blueprintPath);
    console.log(`Generated blueprint: ${relBlueprintPath}`);
    console.log(`Entities: ${entities.length}, routes: ${routeScan.paths.length}`);
  }

  return { blueprintPath, blueprint };
}
