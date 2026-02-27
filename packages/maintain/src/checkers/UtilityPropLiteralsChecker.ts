import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import type { CheckContext, Issue, IssueLevel, UtilityPropLiteralsCheckerConfig } from '../core/interfaces';
import { FileScanner } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

export class UtilityPropLiteralsChecker extends BaseChecker<UtilityPropLiteralsCheckerConfig> {
  private readonly scanner = new FileScanner();

  constructor() {
    super(
      'utility-prop-literals',
      'Validate that utility props use static literal values from the whitelist',
      'utilityPropLiterals'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const mapPath = resolve(context.root, config.utilityPropsMapPath);

    if (!existsSync(mapPath)) {
      return {
        success: false,
        issues: [
          this.createIssue('error', 'UTILITY_MAP_MISSING', `Utility props map not found: ${this.rel(context.root, mapPath)}`, {
            hint: 'Provide a valid path in checkers.utilityPropLiterals.utilityPropsMapPath.',
          }),
        ],
      };
    }

    const utilityMap = this.loadUtilityPropsMap(mapPath);
    const utilityKeys = new Set(utilityMap.keys());

    const uniqueFiles = new Map<string, { path: string; read: () => string }>();
    for (const scopePath of config.scope) {
      const scanned = this.scanner.scan(context.root, config.pattern, {
        cwd: scopePath,
        useCache: true,
      });
      for (const file of scanned) {
        uniqueFiles.set(file.path, file);
      }
    }

    const allowDynamic = config.allowDynamicInLoop ?? false;

    const issues: Issue[] = [];
    for (const file of uniqueFiles.values()) {
      issues.push(...this.checkFile(file.path, file.read(), context.root, utilityKeys, utilityMap, allowDynamic));
    }

    const errorCount = issues.filter((i) => i.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: { filesScanned: uniqueFiles.size, errorCount },
    };
  }

  private checkFile(
    filePath: string,
    source: string,
    root: string,
    utilityKeys: Set<string>,
    utilityMap: Map<string, Set<string>>,
    allowDynamicInLoop: boolean
  ): Issue[] {
    const issues: Issue[] = [];
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const coreComponentNames = this.getCoreComponentNames(sourceFile);

    let loopDepth = 0;

    const handleOpening = (opening: ts.JsxOpeningLikeElement): void => {
      if (!this.isCoreComponentOpening(opening, coreComponentNames)) {
        return;
      }

      for (const attr of opening.attributes.properties) {
        if (!ts.isJsxAttribute(attr)) continue;

        const propName = ts.isIdentifier(attr.name) ? attr.name.text : undefined;
        if (!propName || !utilityKeys.has(propName)) continue;

        const allowed = utilityMap.get(propName)!;
        const loc = sourceFile.getLineAndCharacterOfPosition(attr.getStart(sourceFile));
        const fileRel = this.rel(root, filePath);
        const inLoop = loopDepth > 0;

        if (!attr.initializer) {
          if (!allowed.has('')) {
            issues.push(
              this.createIssue('error', 'UTILITY_PROP_INVALID_VALUE', `Prop "${propName}" bare usage is not in whitelist`, {
                file: fileRel,
                line: loc.line + 1,
                column: loc.character + 1,
                received: '(bare)',
                hint: `Allowed values: ${Array.from(allowed).sort().join(', ') || '(none)'}`,
              })
            );
          }
          continue;
        }

        if (ts.isStringLiteral(attr.initializer)) {
          const value = attr.initializer.text;
          if (value !== '' && !allowed.has(value)) {
            issues.push(
              this.createIssue('error', 'UTILITY_PROP_INVALID_VALUE', `Prop "${propName}" value "${value}" is not in whitelist`, {
                file: fileRel,
                line: loc.line + 1,
                column: loc.character + 1,
                received: value,
                expected: Array.from(allowed).sort().join(' | '),
              })
            );
          }
          continue;
        }

        if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
          const expr = attr.initializer.expression;

          if (ts.isAsExpression(expr)) {
            const typeText = expr.type.getText(sourceFile);
            if (typeText === 'any' || typeText === 'never') {
              const level: IssueLevel = (allowDynamicInLoop && inLoop) ? 'info' : 'error';
              const suffix = level === 'info' ? ' (inside <Loop>, allowed by allowDynamicInLoop)' : '';
              issues.push(
                this.createIssue(level, 'UTILITY_PROP_NOT_LITERAL', `Prop "${propName}" uses "as ${typeText}" cast — must be a static literal${suffix}`, {
                  file: fileRel,
                  line: loc.line + 1,
                  column: loc.character + 1,
                  received: `as ${typeText}`,
                  hint: level === 'info'
                    ? 'Dynamic utility prop inside <Loop> — accepted via allowDynamicInLoop.'
                    : 'Replace with a direct string literal value from the whitelist.',
                })
              );
              continue;
            }
          }

          if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
            const value = expr.text;
            if (!allowed.has(value)) {
              issues.push(
                this.createIssue('error', 'UTILITY_PROP_INVALID_VALUE', `Prop "${propName}" value "${value}" is not in whitelist`, {
                  file: fileRel,
                  line: loc.line + 1,
                  column: loc.character + 1,
                  received: value,
                  expected: Array.from(allowed).sort().join(' | '),
                })
              );
            }
            continue;
          }

          if (ts.isNumericLiteral(expr)) {
            const value = expr.text;
            if (!allowed.has(value)) {
              issues.push(
                this.createIssue('error', 'UTILITY_PROP_INVALID_VALUE', `Prop "${propName}" value ${value} is not in whitelist`, {
                  file: fileRel,
                  line: loc.line + 1,
                  column: loc.character + 1,
                  received: value,
                  expected: Array.from(allowed).sort().join(' | '),
                })
              );
            }
            continue;
          }

          const level: IssueLevel = (allowDynamicInLoop && inLoop) ? 'info' : 'error';
          const suffix = level === 'info' ? ' (inside <Loop>, allowed by allowDynamicInLoop)' : '';
          issues.push(
            this.createIssue(level, 'UTILITY_PROP_NOT_LITERAL', `Prop "${propName}" must be a static literal, not a variable or expression${suffix}`, {
              file: fileRel,
              line: loc.line + 1,
              column: loc.character + 1,
              hint: level === 'info'
                ? 'Dynamic utility prop inside <Loop> — accepted via allowDynamicInLoop.'
                : 'Replace with a direct string literal value from the whitelist.',
            })
          );
        }
      }
    };

    const visit = (node: ts.Node): void => {
      const isLoop = this.isLoopElement(node);
      if (isLoop) loopDepth++;

      if (ts.isJsxSelfClosingElement(node)) {
        handleOpening(node);
      } else if (ts.isJsxElement(node)) {
        handleOpening(node.openingElement);
      }

      ts.forEachChild(node, visit);

      if (isLoop) loopDepth--;
    };

    visit(sourceFile);
    return issues;
  }

  private isLoopElement(node: ts.Node): boolean {
    if (ts.isJsxElement(node)) {
      const tagName = node.openingElement.tagName;
      return ts.isIdentifier(tagName) && tagName.text === 'Loop';
    }
    if (ts.isJsxSelfClosingElement(node)) {
      return ts.isIdentifier(node.tagName) && node.tagName.text === 'Loop';
    }
    return false;
  }

  private isCoreComponentOpening(
    opening: ts.JsxOpeningLikeElement,
    coreComponentNames: Set<string>
  ): boolean {
    const tagName = opening.tagName;
    return ts.isIdentifier(tagName) && coreComponentNames.has(tagName.text);
  }

  private getCoreComponentNames(sourceFile: ts.SourceFile): Set<string> {
    const names = new Set<string>();

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
      if (statement.moduleSpecifier.text !== '@ui8kit/core') continue;
      if (!statement.importClause?.namedBindings) continue;
      if (!ts.isNamedImports(statement.importClause.namedBindings)) continue;

      for (const element of statement.importClause.namedBindings.elements) {
        names.add(element.name.text);
      }
    }

    return names;
  }

  private loadUtilityPropsMap(filePath: string): Map<string, Set<string>> {
    const source = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    const result = new Map<string, Set<string>>();
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const decl of statement.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || decl.name.text !== 'utilityPropsMap') continue;
        const objLiteral = this.unwrapObjectLiteral(decl.initializer);
        if (!objLiteral) continue;
        for (const prop of objLiteral.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const key = this.readPropertyName(prop.name);
          if (!key || !ts.isArrayLiteralExpression(prop.initializer)) continue;
          const values = prop.initializer.elements
            .filter((e): e is ts.StringLiteral => ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e))
            .map((e) => e.text);
          result.set(key, new Set(values));
        }
      }
    }
    return result;
  }

  /** Unwrap `{ ... } as const` / `{ ... } satisfies T` to get the underlying ObjectLiteralExpression. */
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
