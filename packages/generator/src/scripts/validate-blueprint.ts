import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  type BlueprintDocument,
  type BlueprintValidationIssue,
  getBlueprintPath,
  listFilesRecursive,
  loadBlueprint,
  parseAppRoutes,
  readJson,
  readText,
  relPath,
  writeJsonFile,
  writeTextFile,
} from './blueprint-shared';

export interface ValidateBlueprintOptions {
  cwd: string;
  blueprintFile?: string;
  reportDir?: string;
  silent?: boolean;
}

export interface ValidateBlueprintResult {
  ok: boolean;
  reportJsonPath: string;
  reportMarkdownPath: string;
  errors: BlueprintValidationIssue[];
  warnings: BlueprintValidationIssue[];
}

function addIssue(issues: BlueprintValidationIssue[], issue: BlueprintValidationIssue): void {
  issues.push(issue);
}

function detectArrayKey(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.items)) return 'items';
  if (Array.isArray(obj.posts)) return 'posts';
  for (const [key, entry] of Object.entries(obj)) {
    if (Array.isArray(entry)) return key;
  }
  return undefined;
}

function parseNavigationHrefs(sourcePath: string): Set<string> {
  const links = new Set<string>();
  if (!existsSync(sourcePath)) return links;
  try {
    const data = readJson<Record<string, unknown>>(sourcePath);
    const navItems = Array.isArray(data.navItems) ? data.navItems : [];
    const sidebarLinks = Array.isArray(data.sidebarLinks) ? data.sidebarLinks : [];
    const adminSidebarLinks = Array.isArray(data.adminSidebarLinks) ? data.adminSidebarLinks : [];

    for (const item of [...navItems, ...sidebarLinks, ...adminSidebarLinks]) {
      if (!item || typeof item !== 'object') continue;
      const href = (item as Record<string, unknown>).href;
      const url = (item as Record<string, unknown>).url;
      if (typeof href === 'string') links.add(href);
      if (typeof url === 'string') links.add(url);
    }
  } catch {
    // ignore malformed navigation here; dedicated issue is emitted by caller
  }
  return links;
}

function parseCanonicalFixtureBlock(typesSource: string): string {
  const canonicalMatch = typesSource.match(/export\s+type\s+CanonicalContextInput\s*=\s*\{([\s\S]*?)\n\};/);
  if (!canonicalMatch) return '';
  const canonicalBlock = canonicalMatch[1]!;
  const fixturesMatch = canonicalBlock.match(/fixtures:\s*\{([\s\S]*?)\}\s*;/);
  return fixturesMatch?.[1] ?? '';
}

function hasExportedType(source: string, name: string): boolean {
  const typePattern = new RegExp(`export\\s+type\\s+${name}\\b`);
  const interfacePattern = new RegExp(`export\\s+interface\\s+${name}\\b`);
  return typePattern.test(source) || interfacePattern.test(source);
}

function formatIssue(issue: BlueprintValidationIssue): string {
  return `- [${issue.code}] ${issue.message}${issue.file ? ` (${issue.file})` : ''}`;
}

function toMarkdown(
  blueprintPath: string,
  errors: BlueprintValidationIssue[],
  warnings: BlueprintValidationIssue[]
): string {
  const status = errors.length > 0 ? 'FAIL' : 'PASS';
  const lines: string[] = [
    '# Blueprint Validation Report',
    '',
    `- Generated: ${new Date().toISOString()}`,
    `- Blueprint: ${blueprintPath}`,
    `- Status: **${status}**`,
    '',
    '## Summary',
    '',
    `- Errors: ${errors.length}`,
    `- Warnings: ${warnings.length}`,
    '',
  ];

  lines.push('## Errors', '');
  if (errors.length === 0) {
    lines.push('- None');
  } else {
    lines.push(...errors.map(formatIssue));
  }

  lines.push('', '## Warnings', '');
  if (warnings.length === 0) {
    lines.push('- None');
  } else {
    lines.push(...warnings.map(formatIssue));
  }

  lines.push('');
  return lines.join('\n');
}

function getEntityListRoute(routes: string[]): string | undefined {
  return routes.find((route) => !route.includes(':'));
}

function validatePerEntity(
  blueprint: BlueprintDocument,
  cwd: string,
  appRoutes: Set<string>,
  contextSource: string,
  adapterTypesSource: string,
  canonicalFixturesBlock: string,
  navigationLinks: Set<string>,
  issues: BlueprintValidationIssue[]
): void {
  for (const entity of blueprint.entities) {
    const fixturePath = resolve(cwd, entity.fixture);
    if (!existsSync(fixturePath)) {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_FIXTURE_MISSING',
        message: `Fixture file does not exist for entity "${entity.name}".`,
        file: entity.fixture,
      });
      continue;
    }

    let fixtureJson: unknown;
    try {
      fixtureJson = readJson<unknown>(fixturePath);
    } catch {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_FIXTURE_INVALID_JSON',
        message: `Fixture file is not valid JSON for entity "${entity.name}".`,
        file: entity.fixture,
      });
      continue;
    }

    if (!fixtureJson || typeof fixtureJson !== 'object' || Array.isArray(fixtureJson)) {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_FIXTURE_INVALID_SHAPE',
        message: `Fixture root must be an object for entity "${entity.name}".`,
        file: entity.fixture,
      });
      continue;
    }

    const fixtureObject = fixtureJson as Record<string, unknown>;
    const itemsValue = fixtureObject[entity.itemsKey];
    if (!Array.isArray(itemsValue) || itemsValue.length === 0) {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_ITEMS_MISSING',
        message: `Fixture "${entity.fixture}" must have non-empty "${entity.itemsKey}" array.`,
        file: entity.fixture,
      });
    } else {
      for (const [index, item] of itemsValue.entries()) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          addIssue(issues, {
            level: 'error',
            code: 'ENTITY_ITEM_INVALID',
            message: `Fixture item #${index} for "${entity.name}" must be an object.`,
            file: entity.fixture,
          });
          continue;
        }
        const record = item as Record<string, unknown>;
        if (!('id' in record)) {
          addIssue(issues, {
            level: 'error',
            code: 'ENTITY_ITEM_ID_MISSING',
            message: `Fixture item #${index} for "${entity.name}" is missing "id".`,
            file: entity.fixture,
          });
        }
        if (!(entity.slugField in record)) {
          addIssue(issues, {
            level: 'error',
            code: 'ENTITY_ITEM_SLUG_FIELD_MISSING',
            message: `Fixture item #${index} for "${entity.name}" is missing "${entity.slugField}".`,
            file: entity.fixture,
          });
        }
      }
    }

    const typePath = resolve(cwd, entity.types);
    if (!existsSync(typePath)) {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_TYPES_FILE_MISSING',
        message: `Type file does not exist for entity "${entity.name}".`,
        file: entity.types,
      });
    } else {
      const typeSource = readText(typePath);
      if (!hasExportedType(typeSource, entity.singular)) {
        addIssue(issues, {
          level: 'error',
          code: 'ENTITY_SINGULAR_TYPE_MISSING',
          message: `Type file must export "${entity.singular}" for entity "${entity.name}".`,
          file: entity.types,
        });
      }
    }

    if (entity.fixtureType && !new RegExp(`\\b${entity.fixtureType}\\b`).test(adapterTypesSource)) {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_FIXTURE_TYPE_MISSING',
        message: `Fixture type "${entity.fixtureType}" is missing in adapters/types.ts for "${entity.name}".`,
        file: 'src/data/adapters/types.ts',
      });
    }

    const canonicalFixtureKeyRegex = new RegExp(`\\b${entity.name}\\??\\s*:`);
    if (!canonicalFixtureKeyRegex.test(canonicalFixturesBlock)) {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_CONTEXT_FIXTURE_KEY_MISSING',
        message: `CanonicalContextInput.fixtures is missing key "${entity.name}".`,
        file: 'src/data/adapters/types.ts',
      });
    }

    if (!contextSource.includes(`input.fixtures.${entity.name}`)) {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_CONTEXT_REFERENCE_MISSING',
        message: `context.ts does not reference fixture "${entity.name}" from input.fixtures.`,
        file: 'src/data/context.ts',
      });
    }

    for (const routeFile of entity.routeFiles) {
      if (!existsSync(resolve(cwd, routeFile))) {
        addIssue(issues, {
          level: 'error',
          code: 'ENTITY_ROUTE_FILE_MISSING',
          message: `Route file "${routeFile}" is missing for entity "${entity.name}".`,
          file: routeFile,
        });
      }
    }

    for (const viewFile of entity.views) {
      if (!existsSync(resolve(cwd, viewFile))) {
        addIssue(issues, {
          level: 'error',
          code: 'ENTITY_VIEW_FILE_MISSING',
          message: `View file "${viewFile}" is missing for entity "${entity.name}".`,
          file: viewFile,
        });
      }
    }

    for (const route of entity.routes) {
      if (!appRoutes.has(route)) {
        addIssue(issues, {
          level: 'error',
          code: 'ENTITY_ROUTE_NOT_REGISTERED',
          message: `Route "${route}" is not registered in App.tsx for entity "${entity.name}".`,
          file: 'src/App.tsx',
        });
      }
      if (route.includes(':') && !route.endsWith(':slug')) {
        addIssue(issues, {
          level: 'error',
          code: 'ENTITY_ROUTE_PARAM_NOT_NORMALIZED',
          message: `Route "${route}" should use ":slug" parameter for normalized routing.`,
          file: 'src/App.tsx',
        });
      }
    }

    const listRoute = getEntityListRoute(entity.routes);
    if (listRoute && !navigationLinks.has(listRoute)) {
      addIssue(issues, {
        level: 'error',
        code: 'ENTITY_NAV_LINK_MISSING',
        message: `Navigation does not include list route "${listRoute}" for entity "${entity.name}".`,
        file: blueprint.navigation.source,
      });
    }
  }
}

function validateCrossEntity(
  blueprint: BlueprintDocument,
  cwd: string,
  appRoutes: Set<string>,
  contextSource: string,
  issues: BlueprintValidationIssue[]
): void {
  const entityFixtureSet = new Set(blueprint.entities.map((entity) => entity.fixture));
  const entityRouteSet = new Set(blueprint.entities.flatMap((entity) => entity.routes));
  const entityViewSet = new Set(blueprint.entities.flatMap((entity) => entity.views));
  const entityNameSet = new Set(blueprint.entities.map((entity) => entity.name));

  const fixturesDir = resolve(cwd, 'fixtures');
  const fixtureFiles = listFilesRecursive(fixturesDir, ['.json']).filter(
    (file) => !toRelativeFixture(file, cwd).startsWith('fixtures/shared/')
  );

  for (const fixtureFile of fixtureFiles) {
    const relFixture = relPath(cwd, fixtureFile);
    if (entityFixtureSet.has(relFixture)) continue;
    try {
      const fixture = readJson<unknown>(fixtureFile);
      const collectionKey = detectArrayKey(fixture);
      if (collectionKey) {
        addIssue(issues, {
          level: 'error',
          code: 'ORPHAN_FIXTURE',
          message: `Fixture "${relFixture}" has collection "${collectionKey}" but is not declared in blueprint entities.`,
          file: relFixture,
        });
      }
    } catch {
      addIssue(issues, {
        level: 'warn',
        code: 'FIXTURE_PARSE_FAILED',
        message: `Could not parse fixture while checking orphan fixtures: "${relFixture}".`,
        file: relFixture,
      });
    }
  }

  const allowedNonEntityRoutes = new Set(['/', '/admin', '/admin/dashboard']);
  for (const route of appRoutes) {
    if (entityRouteSet.has(route) || allowedNonEntityRoutes.has(route)) continue;
    addIssue(issues, {
      level: 'error',
      code: 'ORPHAN_ROUTE',
      message: `Route "${route}" is registered in App.tsx but not declared in blueprint entities.`,
      file: 'src/App.tsx',
    });
  }

  const blockViews = listFilesRecursive(resolve(cwd, 'src/blocks'), ['.tsx'])
    .map((file) => relPath(cwd, file))
    .filter((file) => file.endsWith('View.tsx'));

  for (const view of blockViews) {
    const withoutPrefix = view.replace(/^src\/blocks\//, '');
    const folder = withoutPrefix.split('/')[0] ?? '';
    if (!entityNameSet.has(folder)) continue;
    if (entityViewSet.has(view)) continue;
    addIssue(issues, {
      level: 'error',
      code: 'ORPHAN_VIEW',
      message: `View "${view}" exists in entity folder "${folder}" but is not declared in blueprint.`,
      file: view,
    });
  }

  for (const domain of blueprint.domains) {
    if (!contextSource.includes(`${domain}:`)) {
      addIssue(issues, {
        level: 'error',
        code: 'DOMAIN_CONTEXT_MISSING',
        message: `Domain "${domain}" is declared in blueprint.domains but not found in context.ts domains object.`,
        file: 'src/data/context.ts',
      });
    }
  }
}

function toRelativeFixture(absPath: string, cwd: string): string {
  return relPath(cwd, absPath);
}

export function validateBlueprint(options: ValidateBlueprintOptions): ValidateBlueprintResult {
  const cwd = resolve(options.cwd);
  const { path: blueprintPath, blueprint } = loadBlueprint(cwd, options.blueprintFile);

  const issues: BlueprintValidationIssue[] = [];
  const appPath = resolve(cwd, 'src/App.tsx');
  const contextPath = resolve(cwd, 'src/data/context.ts');
  const adapterTypesPath = resolve(cwd, 'src/data/adapters/types.ts');
  const navigationPath = resolve(cwd, blueprint.navigation.source);

  if (!existsSync(resolve(cwd, blueprint.$schema))) {
    addIssue(issues, {
      level: 'warn',
      code: 'BLUEPRINT_SCHEMA_MISSING',
      message: `Schema file "${blueprint.$schema}" referenced by blueprint is missing.`,
      file: blueprint.$schema,
    });
  }

  if (!existsSync(appPath)) {
    addIssue(issues, {
      level: 'error',
      code: 'APP_FILE_MISSING',
      message: 'src/App.tsx is missing.',
      file: 'src/App.tsx',
    });
  }

  const appRoutes = existsSync(appPath)
    ? new Set(parseAppRoutes(readText(appPath)).map((route) => route.path))
    : new Set<string>();
  const contextSource = existsSync(contextPath) ? readText(contextPath) : '';
  const adapterTypesSource = existsSync(adapterTypesPath) ? readText(adapterTypesPath) : '';
  const canonicalFixturesBlock = parseCanonicalFixtureBlock(adapterTypesSource);
  const navigationLinks = parseNavigationHrefs(navigationPath);

  validatePerEntity(
    blueprint,
    cwd,
    appRoutes,
    contextSource,
    adapterTypesSource,
    canonicalFixturesBlock,
    navigationLinks,
    issues
  );
  validateCrossEntity(blueprint, cwd, appRoutes, contextSource, issues);

  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warn');

  const reportDir = resolve(cwd, options.reportDir ?? '.cursor/reports');
  const reportJsonPath = join(reportDir, 'blueprint-validation.json');
  const reportMarkdownPath = join(reportDir, 'blueprint-validation.md');
  const blueprintRelativePath = relPath(cwd, getBlueprintPath(cwd, options.blueprintFile));

  writeJsonFile(reportJsonPath, {
    generatedAt: new Date().toISOString(),
    blueprintPath: blueprintRelativePath,
    errors,
    warnings,
  });
  writeTextFile(reportMarkdownPath, toMarkdown(blueprintRelativePath, errors, warnings));

  if (!options.silent) {
    console.log(`Blueprint validation report (json): ${relPath(cwd, reportJsonPath)}`);
    console.log(`Blueprint validation report (md): ${relPath(cwd, reportMarkdownPath)}`);
    console.log(`Errors: ${errors.length}, warnings: ${warnings.length}`);
  }

  return {
    ok: errors.length === 0,
    reportJsonPath,
    reportMarkdownPath,
    errors,
    warnings,
  };
}
