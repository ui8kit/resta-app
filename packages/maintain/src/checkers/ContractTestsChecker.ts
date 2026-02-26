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
            }
          ),
        ],
      };
    }

    const blueprint = this.readJson<BlueprintDocument>(blueprintPath);
    const appPath = resolve(context.root, config.appFile ?? 'src/App.tsx');
    if (!existsSync(appPath)) {
      issues.push(
        this.createIssue('error', 'APP_FILE_MISSING', `App file not found: ${this.relative(context.root, appPath)}`)
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
            }
          )
        );
        continue;
      }

      const typeSource = this.readText(typePath);
      const typeBody = this.extractTypeBody(typeSource, entity.singular);
      if (!typeBody) {
        issues.push(
          this.createIssue(
            'error',
            'CONTRACT_SINGULAR_TYPE_MISSING',
            `Type "${entity.singular}" was not found in "${entity.types}".`,
            {
              file: entity.types,
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
                }
              )
            );
          }
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
