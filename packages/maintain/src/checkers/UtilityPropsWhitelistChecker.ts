import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import type { CheckContext, UtilityPropsWhitelistCheckerConfig } from '../core/interfaces';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

interface UtilityMapEntry {
  prop: string;
  value: string;
  line: number;
  column: number;
}

export class UtilityPropsWhitelistChecker extends BaseChecker<UtilityPropsWhitelistCheckerConfig> {
  constructor() {
    super(
      'utility-props-whitelist',
      'Validate utility-props.map.ts values against Tailwind whitelist',
      'utilityPropsWhitelist'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const utilityMapPath = resolve(context.root, config.utilityPropsMapPath);
    const tailwindMapPath = resolve(context.root, config.tailwindMapPath);
    const additionalMapPaths = (config.additionalMapPaths ?? []).map((path) => resolve(context.root, path));
    const maxSuggestions = Math.max(1, config.maxSuggestions ?? 2);

    if (!existsSync(utilityMapPath)) {
      return {
        success: false,
        issues: [
          this.createIssue(
            'error',
            'UTILITY_PROPS_MAP_MISSING',
            `Utility props map not found: ${this.rel(context.root, utilityMapPath)}`,
            {
              hint: 'Provide a valid checkers.utilityPropsWhitelist.utilityPropsMapPath.',
            }
          ),
        ],
      };
    }

    if (!existsSync(tailwindMapPath)) {
      return {
        success: false,
        issues: [
          this.createIssue(
            'error',
            'TAILWIND_MAP_MISSING',
            `Tailwind class map not found: ${this.rel(context.root, tailwindMapPath)}`,
            {
              hint: 'Provide a valid checkers.utilityPropsWhitelist.tailwindMapPath.',
            }
          ),
        ],
      };
    }

    for (const mapPath of additionalMapPaths) {
      if (!existsSync(mapPath)) {
        return {
          success: false,
          issues: [
            this.createIssue(
              'error',
              'ADDITIONAL_MAP_MISSING',
              `Additional class map not found: ${this.rel(context.root, mapPath)}`,
              {
                hint: 'Fix checkers.utilityPropsWhitelist.additionalMapPaths or remove invalid path.',
              }
            ),
          ],
        };
      }
    }

    const entries = this.loadUtilityMapEntries(utilityMapPath);
    const tailwindMap = JSON.parse(readFileSync(tailwindMapPath, 'utf-8')) as Record<string, string>;
    const allowedClasses = new Set(Object.keys(tailwindMap));
    for (const mapPath of additionalMapPaths) {
      const extraMap = JSON.parse(readFileSync(mapPath, 'utf-8')) as Record<string, string>;
      for (const className of Object.keys(extraMap)) {
        allowedClasses.add(className);
      }
    }
    const utilityMapFile = this.rel(context.root, utilityMapPath);

    const issues = entries
      .map((entry) => {
        const className = entry.value === '' ? entry.prop : `${entry.prop}-${entry.value}`;
        if (allowedClasses.has(className)) {
          return undefined;
        }

        const suggestions = this.pickSuggestions(entry.prop, entry.value, className, allowedClasses, maxSuggestions);
        const expected = suggestions.join(' | ');
        const hint =
          suggestions.length > 0
            ? `Keep design consistency. Try: ${suggestions.join(', ')}.`
            : 'Keep design consistency and use only classes from tw-css-extended.json.';

        return this.createIssue(
          'error',
          'UTILITY_PROP_NOT_IN_CLASS_WHITELIST',
          `Class "${className}" is not available in configured class whitelist`,
          {
            file: utilityMapFile,
            line: entry.line,
            column: entry.column,
            received: className,
            expected: expected || undefined,
            hint,
          }
        );
      })
      .filter((issue): issue is NonNullable<typeof issue> => issue !== undefined);

    return {
      success: issues.length === 0,
      issues,
      stats: {
        entriesScanned: entries.length,
        allowedCount: allowedClasses.size,
        errorCount: issues.length,
      },
      hint:
        issues.length > 0
          ? 'Update utility-props.map.ts to Tailwind-supported values for consistent design scale.'
          : undefined,
    };
  }

  private loadUtilityMapEntries(filePath: string): UtilityMapEntry[] {
    const source = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const entries: UtilityMapEntry[] = [];

    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) continue;

      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'utilityPropsMap') continue;

        const objectLiteral = this.unwrapObjectLiteral(declaration.initializer);
        if (!objectLiteral) continue;

        for (const prop of objectLiteral.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;

          const propName = this.readPropertyName(prop.name);
          if (!propName || !ts.isArrayLiteralExpression(prop.initializer)) continue;

          for (const element of prop.initializer.elements) {
            if (!ts.isStringLiteral(element) && !ts.isNoSubstitutionTemplateLiteral(element)) continue;
            const loc = sourceFile.getLineAndCharacterOfPosition(element.getStart(sourceFile));
            entries.push({
              prop: propName,
              value: element.text,
              line: loc.line + 1,
              column: loc.character + 1,
            });
          }
        }
      }
    }

    return entries;
  }

  private pickSuggestions(
    prop: string,
    rawValue: string,
    className: string,
    allowedClasses: Set<string>,
    maxSuggestions: number
  ): string[] {
    const propPrefix = `${prop}-`;
    const propCandidates = Array.from(allowedClasses).filter((key) => key.startsWith(propPrefix));
    if (propCandidates.length === 0) {
      return [];
    }

    const suggestions: string[] = [];
    const addSuggestion = (candidate: string): void => {
      if (!candidate || suggestions.includes(candidate)) return;
      suggestions.push(candidate);
    };

    // Design-aware shortcut for container scales like w-7xl -> w-6xl + full.
    const widthScaleMatch = rawValue.match(/^w-(\d+)xl$/);
    if (widthScaleMatch) {
      const level = Number(widthScaleMatch[1]);
      const downLevel = `${prop}-w-${Math.max(2, level - 1)}xl`;
      if (allowedClasses.has(downLevel)) {
        addSuggestion(downLevel);
      }
      const full = `${prop}-w-full`;
      if (allowedClasses.has(full)) {
        addSuggestion(full);
      }
    }

    const desiredValue = className.slice(propPrefix.length);
    const desiredHead = desiredValue.split('-')[0] ?? '';

    const ranked = propCandidates
      .map((candidate) => {
        const value = candidate.slice(propPrefix.length);
        const head = value.split('-')[0] ?? '';
        return {
          candidate,
          sameHead: head === desiredHead,
          distance: this.levenshtein(desiredValue, value),
        };
      })
      .sort((left, right) => {
        if (left.sameHead !== right.sameHead) {
          return left.sameHead ? -1 : 1;
        }
        if (left.distance !== right.distance) {
          return left.distance - right.distance;
        }
        return left.candidate.localeCompare(right.candidate);
      });

    for (const item of ranked) {
      addSuggestion(item.candidate);
      if (suggestions.length >= maxSuggestions) {
        break;
      }
    }

    return suggestions.slice(0, maxSuggestions);
  }

  private levenshtein(source: string, target: string): number {
    if (source === target) return 0;
    if (!source) return target.length;
    if (!target) return source.length;

    const rows = source.length + 1;
    const cols = target.length + 1;
    const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

    for (let i = 0; i < rows; i++) dp[i][0] = i;
    for (let j = 0; j < cols; j++) dp[0][j] = j;

    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        const substitution = source[i - 1] === target[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + substitution
        );
      }
    }

    return dp[source.length][target.length];
  }

  private unwrapObjectLiteral(node: ts.Expression | undefined): ts.ObjectLiteralExpression | undefined {
    if (!node) return undefined;
    if (ts.isObjectLiteralExpression(node)) return node;
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
      return this.unwrapObjectLiteral(node.expression);
    }
    if (ts.isParenthesizedExpression(node)) {
      return this.unwrapObjectLiteral(node.expression);
    }
    return undefined;
  }

  private readPropertyName(name: ts.PropertyName): string | undefined {
    if (ts.isIdentifier(name)) return name.text;
    if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) return name.text;
    return undefined;
  }

  private rel(root: string, target: string): string {
    return relative(root, target).replace(/\\/g, '/');
  }
}
