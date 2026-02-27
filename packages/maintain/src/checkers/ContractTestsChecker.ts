import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { CheckContext, ContractTestsCheckerConfig, Issue } from '../core/interfaces';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

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

export class ContractTestsChecker extends BaseChecker<ContractTestsCheckerConfig> {
  constructor() {
    super(
      'contracts',
      'Run blueprint contract checks for fixtures, types, routes, and views',
      'contracts'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues: Issue[] = [];
    const blueprintPath = resolve(context.root, config.blueprint);
    if (!existsSync(blueprintPath)) {
      return {
        success: false,
        issues: [
          this.createIssue(
            'error',
            'BLUEPRINT_MISSING',
            `Blueprint file not found: ${this.relative(context.root, blueprintPath)}`,
            {
              hint: 'Run `bun run blueprint:scan` to generate blueprint.json.',
              suggestion: 'Generate blueprint.json before running contract validation.',
            }
          ),
        ],
      };
    }

    const blueprint = this.readJson<BlueprintDocument>(blueprintPath);
    const appPath = resolve(context.root, config.appFile ?? 'src/App.tsx');
    if (!existsSync(appPath)) {
      issues.push(
        this.createIssue('error', 'APP_FILE_MISSING', `App file not found: ${this.relative(context.root, appPath)}`, {
          file: this.relative(context.root, appPath),
          hint: 'Ensure App.tsx exists or set checkers.contracts.appFile.',
        })
      );
      return { success: false, issues };
    }

    const appSource = this.readText(appPath);
    const appRoutes = this.extractAppRoutes(appSource);

    for (const entity of blueprint.entities) {
      const fixturePath = resolve(context.root, entity.fixture);
      if (!existsSync(fixturePath)) {
        issues.push(
          this.createIssue(
            'error',
            'CONTRACT_FIXTURE_MISSING',
            `Fixture is missing for entity "${entity.name}".`,
            {
              file: entity.fixture,
              hint: 'Create the fixture file referenced by blueprint.json.',
            }
          )
        );
        continue;
      }

      const fixture = this.readJson<Record<string, unknown>>(fixturePath);
      const items = fixture[entity.itemsKey];
      if (!Array.isArray(items) || items.length === 0) {
        issues.push(
          this.createIssue(
            'error',
            'CONTRACT_FIXTURE_ITEMS_EMPTY',
            `Fixture "${entity.fixture}" has no "${entity.itemsKey}" items.`,
            {
              file: entity.fixture,
              expected: `Non-empty array "${entity.itemsKey}"`,
              received: 'Missing/empty/non-array value',
              hint: 'Populate fixture items with at least one entity record.',
            }
          )
        );
        continue;
      }

      const firstItem = items[0];
      if (!firstItem || typeof firstItem !== 'object' || Array.isArray(firstItem)) {
        issues.push(
          this.createIssue(
            'error',
            'CONTRACT_FIXTURE_ITEM_INVALID',
            `First item in fixture "${entity.fixture}" must be an object.`,
            {
              file: entity.fixture,
              expected: 'Object item',
              received: 'Non-object first array element',
              hint: 'Ensure fixture items are objects with typed fields.',
            }
          )
        );
        continue;
      }

      const typePath = resolve(context.root, entity.types);
      if (!existsSync(typePath)) {
        issues.push(
          this.createIssue(
            'error',
            'CONTRACT_TYPE_FILE_MISSING',
            `Type file missing for entity "${entity.name}".`,
            {
              file: entity.types,
              hint: 'Generate or restore the type file declared in blueprint.json.',
            }
          )
        );
        continue;
      }

      const typeSource = this.readText(typePath);
      const requireInlineBody = config.entityTypeRequireInlineBody !== false;
      const typeBody = this.extractTypeBody(typeSource, entity.singular);
      const hasExportedType = this.hasExportedType(typeSource, entity.singular);

      if (requireInlineBody) {
        if (!typeBody) {
          issues.push(
            this.createIssue(
              'error',
              'CONTRACT_SINGULAR_TYPE_MISSING',
              `Type "${entity.singular}" was not found in "${entity.types}". Expected inline object or interface (strict shape applies to entity types when entityTypeRequireInlineBody is true).`,
              {
                file: entity.types,
                hint: `Export ${entity.singular} as interface or inline type in ${entity.types}.`,
                suggestion: `Add: export interface ${entity.singular} { ... }`,
              }
            )
          );
        } else {
          const requiredFields = this.extractRequiredTypeFields(typeBody);
          const firstRecord = firstItem as Record<string, unknown>;
          for (const field of requiredFields) {
            if (!(field in firstRecord)) {
              issues.push(
                this.createIssue(
                  'error',
                  'CONTRACT_REQUIRED_FIELD_MISSING',
                  `Fixture "${entity.fixture}" is missing required field "${field}" from "${entity.singular}".`,
                  {
                    file: entity.fixture,
                    expected: field,
                    received: 'Missing field in fixture item',
                    hint: `Add required field "${field}" to fixture records for ${entity.name}.`,
                  }
                )
              );
            }
          }
        }
      } else {
        if (!hasExportedType) {
          issues.push(
            this.createIssue(
              'error',
              'CONTRACT_SINGULAR_TYPE_MISSING',
              `Type "${entity.singular}" was not found in "${entity.types}".`,
              {
                file: entity.types,
                hint: `Export ${entity.singular} type in ${entity.types}.`,
              }
            )
          );
        }
      }

      for (const route of entity.routes) {
        if (!appRoutes.has(route)) {
          issues.push(
            this.createIssue(
              'error',
              'CONTRACT_ROUTE_NOT_REGISTERED',
              `Route "${route}" is not registered in App.tsx.`,
              {
                file: this.relative(context.root, appPath),
                hint: `Add route "${route}" to App.tsx Route declarations.`,
              }
            )
          );
        }
      }

      for (const routeFile of entity.routeFiles) {
        const absRoutePath = resolve(context.root, routeFile);
        if (!existsSync(absRoutePath)) {
          issues.push(
            this.createIssue('error', 'CONTRACT_ROUTE_FILE_MISSING', `Route file "${routeFile}" is missing.`, {
              file: routeFile,
              hint: 'Create the missing route component file or update blueprint routes.',
            })
          );
        }
      }

      for (const viewFile of entity.views) {
        const absViewPath = resolve(context.root, viewFile);
        if (!existsSync(absViewPath)) {
          issues.push(
            this.createIssue('error', 'CONTRACT_VIEW_FILE_MISSING', `View file "${viewFile}" is missing.`, {
              file: viewFile,
              hint: 'Create the missing View component or update blueprint entity.views.',
            })
          );
        }
      }
    }

    const errorCount = issues.filter((issue) => issue.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: {
        entitiesChecked: blueprint.entities.length,
        errorCount,
      },
    };
  }

  private readText(targetPath: string): string {
    return readFileSync(targetPath, 'utf-8');
  }

  private readJson<T>(targetPath: string): T {
    return JSON.parse(this.readText(targetPath)) as T;
  }

  private extractAppRoutes(source: string): Set<string> {
    const routes = new Set<string>();
    const routePattern = /<Route\s+path=['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = routePattern.exec(source)) !== null) {
      routes.add(match[1] ?? '');
    }
    return routes;
  }

  /**
   * Returns true if the type is exported in any form (alias, inline object, or interface).
   * Used when entityTypeRequireInlineBody is false to accept type aliases.
   */
  private hasExportedType(source: string, typeName: string): boolean {
    const escapedTypeName = typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (
      new RegExp(`export\\s+type\\s+${escapedTypeName}\\s*=`).test(source) ||
      new RegExp(`export\\s+interface\\s+${escapedTypeName}\\s*[<{]`).test(source)
    );
  }

  /**
   * Extracts inline object body from `export type X = { ... }` or `export interface X { ... }`.
   * Returns undefined for type aliases (e.g. `export type X = OtherType`).
   */
  private extractTypeBody(source: string, typeName: string): string | undefined {
    const escapedTypeName = typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const typeMatch = source.match(
      new RegExp(`export\\s+type\\s+${escapedTypeName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`)
    );
    if (typeMatch) {
      return typeMatch[1];
    }

    const interfaceMatch = source.match(
      new RegExp(`export\\s+interface\\s+${escapedTypeName}\\s*\\{([\\s\\S]*?)\\n\\}`)
    );
    return interfaceMatch?.[1];
  }

  private extractRequiredTypeFields(typeBody: string): string[] {
    const fields: string[] = [];
    const linePattern = /^\s*([A-Za-z0-9_]+)(\?)?:\s*[^;]+;/gm;
    let match: RegExpExecArray | null;
    while ((match = linePattern.exec(typeBody)) !== null) {
      const field = match[1];
      const optional = match[2] === '?';
      if (field && !optional) {
        fields.push(field);
      }
    }
    return fields;
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
