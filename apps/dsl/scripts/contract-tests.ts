#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type ContractIssue = {
  level: 'error' | 'warn';
  code: string;
  message: string;
  file?: string;
};

type BlueprintEntity = {
  name: string;
  singular: string;
  fixture: string;
  itemsKey: string;
  types: string;
  routes: string[];
  routeFiles: string[];
  views: string[];
};

type BlueprintDocument = {
  entities: BlueprintEntity[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPORTS_DIR = join(ROOT, '.cursor', 'reports');

function readText(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

function readJson<T>(relPath: string): T {
  return JSON.parse(readText(relPath)) as T;
}

function addIssue(issues: ContractIssue[], issue: ContractIssue): void {
  issues.push(issue);
}

function extractAppRoutes(appSource: string): Set<string> {
  const routes = new Set<string>();
  const regex = /<Route\s+path="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(appSource)) !== null) {
    routes.add(match[1]!);
  }
  return routes;
}

function extractTypeBody(source: string, typeName: string): string | undefined {
  const typeMatch = source.match(new RegExp(`export\\s+type\\s+${typeName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (typeMatch) return typeMatch[1];

  const interfaceMatch = source.match(
    new RegExp(`export\\s+interface\\s+${typeName}\\s*\\{([\\s\\S]*?)\\n\\}`)
  );
  if (interfaceMatch) return interfaceMatch[1];

  return undefined;
}

function extractRequiredTypeFields(typeBody: string): string[] {
  const fields: string[] = [];
  const lineRegex = /^\s*([A-Za-z0-9_]+)(\?)?:\s*[^;]+;/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(typeBody)) !== null) {
    const field = match[1]!;
    const optional = match[2] === '?';
    if (!optional) fields.push(field);
  }
  return fields;
}

function run(): void {
  const issues: ContractIssue[] = [];
  const blueprintPath = join(ROOT, 'blueprint.json');
  if (!existsSync(blueprintPath)) {
    console.error('Missing blueprint.json. Run: bun run blueprint:scan');
    process.exit(1);
  }

  const blueprint = readJson<BlueprintDocument>('blueprint.json');
  const appSource = readText('src/App.tsx');
  const appRoutes = extractAppRoutes(appSource);

  for (const entity of blueprint.entities) {
    const fixtureAbs = join(ROOT, entity.fixture);
    if (!existsSync(fixtureAbs)) {
      addIssue(issues, {
        level: 'error',
        code: 'CONTRACT_FIXTURE_MISSING',
        message: `Fixture is missing for entity "${entity.name}".`,
        file: entity.fixture,
      });
      continue;
    }

    const fixture = readJson<Record<string, unknown>>(entity.fixture);
    const items = fixture[entity.itemsKey];
    if (!Array.isArray(items) || items.length === 0) {
      addIssue(issues, {
        level: 'error',
        code: 'CONTRACT_FIXTURE_ITEMS_EMPTY',
        message: `Fixture "${entity.fixture}" has no "${entity.itemsKey}" items.`,
        file: entity.fixture,
      });
      continue;
    }

    const firstItem = items[0];
    if (!firstItem || typeof firstItem !== 'object' || Array.isArray(firstItem)) {
      addIssue(issues, {
        level: 'error',
        code: 'CONTRACT_FIXTURE_ITEM_INVALID',
        message: `First item in fixture "${entity.fixture}" must be an object.`,
        file: entity.fixture,
      });
      continue;
    }

    const typeAbs = join(ROOT, entity.types);
    if (!existsSync(typeAbs)) {
      addIssue(issues, {
        level: 'error',
        code: 'CONTRACT_TYPE_FILE_MISSING',
        message: `Type file missing for entity "${entity.name}".`,
        file: entity.types,
      });
      continue;
    }

    const typeSource = readText(entity.types);
    const typeBody = extractTypeBody(typeSource, entity.singular);
    if (!typeBody) {
      addIssue(issues, {
        level: 'error',
        code: 'CONTRACT_SINGULAR_TYPE_MISSING',
        message: `Type "${entity.singular}" was not found in "${entity.types}".`,
        file: entity.types,
      });
    } else {
      const requiredFields = extractRequiredTypeFields(typeBody);
      const firstRecord = firstItem as Record<string, unknown>;
      for (const field of requiredFields) {
        if (!(field in firstRecord)) {
          addIssue(issues, {
            level: 'error',
            code: 'CONTRACT_REQUIRED_FIELD_MISSING',
            message: `Fixture "${entity.fixture}" is missing required "${field}" from "${entity.singular}".`,
            file: entity.fixture,
          });
        }
      }
    }

    for (const route of entity.routes) {
      if (!appRoutes.has(route)) {
        addIssue(issues, {
          level: 'error',
          code: 'CONTRACT_ROUTE_NOT_REGISTERED',
          message: `Route "${route}" is not registered in App.tsx.`,
          file: 'src/App.tsx',
        });
      }
    }

    for (const routeFile of entity.routeFiles) {
      if (!existsSync(join(ROOT, routeFile))) {
        addIssue(issues, {
          level: 'error',
          code: 'CONTRACT_ROUTE_FILE_MISSING',
          message: `Route file "${routeFile}" is missing.`,
          file: routeFile,
        });
      }
    }

    for (const viewFile of entity.views) {
      if (!existsSync(join(ROOT, viewFile))) {
        addIssue(issues, {
          level: 'error',
          code: 'CONTRACT_VIEW_FILE_MISSING',
          message: `View file "${viewFile}" is missing.`,
          file: viewFile,
        });
      }
    }
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = join(REPORTS_DIR, 'contract-tests.json');
  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warn');

  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        errors,
        warnings,
      },
      null,
      2
    ) + '\n',
    'utf-8'
  );

  console.log(`Contract report: ${relative(ROOT, reportPath).replace(/\\/g, '/')}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    for (const issue of errors) {
      console.error(`[${issue.code}] ${issue.message}${issue.file ? ` (${issue.file})` : ''}`);
    }
    process.exit(1);
  }

  console.log('Contract tests passed.');
}

run();
