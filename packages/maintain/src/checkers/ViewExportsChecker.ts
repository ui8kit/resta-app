import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import type { CheckContext, Issue, ViewExportsCheckerConfig } from '../core/interfaces';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

type ExportIssue = {
  line: number;
  message: string;
};

export class ViewExportsChecker extends BaseChecker<ViewExportsCheckerConfig> {
  constructor() {
    super(
      'view-exports',
      'Validate that View files export one interface and one function',
      'viewExports'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const files = this.findFilesByPattern(context.root, config.pattern);
    const issues: Issue[] = [];

    for (const file of files) {
      const exportIssues = this.validateFile(file, config.exportShape);
      for (const exportIssue of exportIssues) {
        issues.push(
          this.createIssue(
            'error',
            'VIEW_EXPORT_SHAPE_INVALID',
            exportIssue.message,
            {
              file: this.relative(context.root, file),
              line: exportIssue.line,
            }
          )
        );
      }
    }

    const errorCount = issues.length;
    return {
      success: errorCount === 0,
      issues,
      stats: {
        filesScanned: files.length,
        errorCount,
      },
    };
  }

  private validateFile(filePath: string, exportShape: ViewExportsCheckerConfig['exportShape']): ExportIssue[] {
    if (exportShape !== 'interface+function') {
      return [{ line: 1, message: `Unsupported export shape: ${exportShape}` }];
    }

    const source = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const issues: ExportIssue[] = [];

    let exportedInterfaces = 0;
    let exportedFunctions = 0;
    let totalExports = 0;

    for (const statement of sourceFile.statements) {
      if (
        ts.isExportAssignment(statement) ||
        (ts.isExportDeclaration(statement) && !statement.isTypeOnly)
      ) {
        totalExports += 1;
        issues.push({
          line: this.getLine(sourceFile, statement),
          message:
            'Unsupported export form. Use only `export interface` and `export function` in View files.',
        });
        continue;
      }

      if (!this.hasExportModifier(statement)) {
        continue;
      }
      totalExports += 1;

      if (ts.isInterfaceDeclaration(statement)) {
        exportedInterfaces += 1;
        continue;
      }

      if (ts.isFunctionDeclaration(statement)) {
        exportedFunctions += 1;
        continue;
      }

      if (ts.isTypeAliasDeclaration(statement)) {
        issues.push({
          line: this.getLine(sourceFile, statement),
          message:
            'Found `export type`. Move it to shared types or replace it with `export interface` when possible.',
        });
        continue;
      }

      issues.push({
        line: this.getLine(sourceFile, statement),
        message: 'Unexpected exported declaration. View files must export only one interface and one function.',
      });
    }

    if (totalExports !== 2 || exportedInterfaces !== 1 || exportedFunctions !== 1) {
      issues.push({
        line: 1,
        message:
          `Invalid export shape: expected 2 exports (1 interface + 1 function), got ${totalExports} ` +
          `(interfaces: ${exportedInterfaces}, functions: ${exportedFunctions}).`,
      });
    }

    return issues;
  }

  private hasExportModifier(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) {
      return false;
    }
    const modifiers = ts.getModifiers(node);
    return Boolean(modifiers?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword));
  }

  private getLine(sourceFile: ts.SourceFile, node: ts.Node): number {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }

  private findFilesByPattern(root: string, pattern: string): string[] {
    const normalizedPattern = pattern.replace(/\\/g, '/');
    const wildcardIndex = normalizedPattern.search(/[*?]/);
    const baseDir =
      wildcardIndex < 0
        ? dirname(normalizedPattern)
        : normalizedPattern.slice(0, normalizedPattern.slice(0, wildcardIndex).lastIndexOf('/'));

    const scanRoot = resolve(root, baseDir || '.');
    if (!existsSync(scanRoot)) {
      return [];
    }

    const matcher = this.patternToRegex(normalizedPattern);
    const files: string[] = [];
    this.walkFiles(scanRoot, (filePath) => {
      const relPath = this.relative(root, filePath);
      if (matcher.test(relPath)) {
        files.push(filePath);
      }
    });

    return files;
  }

  private walkFiles(dirPath: string, onFile: (filePath: string) => void): void {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        this.walkFiles(fullPath, onFile);
        continue;
      }
      if (entry.isFile()) {
        onFile(fullPath);
      }
    }
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '::DOUBLE_STAR::')
      .replace(/\*/g, '[^/]*')
      .replace(/::DOUBLE_STAR::/g, '.*')
      .replace(/\?/g, '.');

    return new RegExp(`^${escaped}$`);
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
