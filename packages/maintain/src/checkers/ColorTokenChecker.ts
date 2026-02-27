import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import type { CheckContext, ColorTokenCheckerConfig, Issue } from '../core/interfaces';
import { FileScanner, TsxParser } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

const COLOR_PROP_TO_TOKEN_KEY: Record<string, string> = {
  bg: 'bg',
  textColor: 'text',
  border: 'border',
  ring: 'ring',
  accent: 'accent',
  caret: 'caret',
};

export class ColorTokenChecker extends BaseChecker<ColorTokenCheckerConfig> {
  private readonly scanner = new FileScanner();
  private readonly parser = new TsxParser();

  constructor() {
    super('color-tokens', 'Validate utility color props against token whitelist', 'colorTokens');
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const tokenMapPath = resolve(context.root, config.utilityPropsMapPath);
    if (!existsSync(tokenMapPath)) {
      return {
        success: false,
        issues: [
          this.createIssue(
            'error',
            'COLOR_TOKEN_SOURCE_MISSING',
            `Token source not found: ${this.relative(context.root, tokenMapPath)}`,
            {
              hint: 'Provide a valid utility props map path in checkers.colorTokens.utilityPropsMapPath.',
              suggestion:
                'Point utilityPropsMapPath to src/lib/utility-props.map.ts (or your project equivalent).',
            }
          ),
        ],
      };
    }

    const tokenMap = this.loadUtilityPropsMap(tokenMapPath);
    const uniqueFiles = new Map<string, { path: string; read: () => string }>();
    for (const scopePath of config.scope) {
      const scopedFiles = this.scanner.scan(context.root, config.pattern, {
        cwd: scopePath,
        useCache: true,
      });
      for (const file of scopedFiles) {
        uniqueFiles.set(file.path, file);
      }
    }

    const issues: Issue[] = [];
    for (const file of uniqueFiles.values()) {
      const usages = this.parser.parseJsxProps(file.read(), '*', file.path);
      for (const usage of usages) {
        for (const [propName, tokenKey] of Object.entries(COLOR_PROP_TO_TOKEN_KEY)) {
          const rawValue = usage.props[propName];
          if (typeof rawValue !== 'string') {
            continue;
          }

          const value = rawValue.trim();
          if (!value) {
            continue;
          }

          const allowed = tokenMap.get(tokenKey) ?? new Set<string>();
          if (allowed.has(value)) {
            continue;
          }

          const expectedValues = Array.from(allowed).sort();
          issues.push(
            this.createIssue(
              'error',
              'COLOR_TOKEN_INVALID',
              `Invalid token for prop "${propName}": "${value}".`,
              {
                file: this.relative(context.root, file.path),
                line: usage.line,
                column: usage.column,
                expected: expectedValues.join(' | ') || 'Token values from utility-props.map',
                received: value,
                hint: `Use semantic tokens from utilityPropsMap.${tokenKey}.`,
                suggestion:
                  expectedValues[0] !== undefined
                    ? `Replace "${value}" with "${expectedValues[0]}" (or another allowed semantic token).`
                    : 'Use a token defined in utility-props.map.ts.',
              }
            )
          );
        }
      }
    }

    const errorCount = issues.filter((issue) => issue.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: {
        filesScanned: uniqueFiles.size,
        tokenSource: this.relative(context.root, tokenMapPath),
        errorCount,
      },
    };
  }

  private loadUtilityPropsMap(filePath: string): Map<string, Set<string>> {
    const source = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    const result = new Map<string, Set<string>>();
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) {
        continue;
      }
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'utilityPropsMap') {
          continue;
        }
        if (!declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) {
          continue;
        }
        for (const property of declaration.initializer.properties) {
          if (!ts.isPropertyAssignment(property)) {
            continue;
          }
          const key = this.readPropertyName(property.name);
          if (!key || !ts.isArrayLiteralExpression(property.initializer)) {
            continue;
          }
          const values = property.initializer.elements
            .filter(
              (element): element is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral =>
                ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)
            )
            .map((element) => element.text)
            .filter(Boolean);
          result.set(key, new Set(values));
        }
      }
    }

    return result;
  }

  private readPropertyName(name: ts.PropertyName): string | undefined {
    if (ts.isIdentifier(name)) {
      return name.text;
    }
    if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
      return name.text;
    }
    return undefined;
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
