import { relative } from 'node:path';
import type { CheckContext, Issue, ViewExportsCheckerConfig } from '../core/interfaces';
import { FileScanner, TsxParser } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

type ExportIssue = {
  line: number;
  column: number;
  message: string;
  expected?: string;
  received?: string;
  hint?: string;
  suggestion?: string;
};

export class ViewExportsChecker extends BaseChecker<ViewExportsCheckerConfig> {
  private readonly scanner = new FileScanner();
  private readonly parser = new TsxParser();

  constructor() {
    super(
      'view-exports',
      'Validate that View files export one interface and one function',
      'viewExports'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const files = this.scanner.scan(context.root, config.pattern, { useCache: true });
    const issues: Issue[] = [];

    for (const file of files) {
      const exportIssues = this.validateFile(file.path, file.read(), config.exportShape);
      for (const exportIssue of exportIssues) {
        issues.push(
          this.createIssue(
            'error',
            'VIEW_EXPORT_SHAPE_INVALID',
            exportIssue.message,
            {
              file: this.relative(context.root, file.path),
              line: exportIssue.line,
              column: exportIssue.column,
              expected: exportIssue.expected,
              received: exportIssue.received,
              hint: exportIssue.hint,
              suggestion: exportIssue.suggestion,
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

  private validateFile(
    filePath: string,
    source: string,
    exportShape: ViewExportsCheckerConfig['exportShape']
  ): ExportIssue[] {
    if (exportShape !== 'interface+function') {
      return [
        {
          line: 1,
          column: 1,
          message: `Unsupported export shape: ${exportShape}`,
          expected: 'interface+function',
          received: exportShape,
        },
      ];
    }

    const exportedSymbols = this.parser.parseExports(source, filePath);
    return this.validateExportShape(exportedSymbols);
  }

  private validateExportShape(exportedSymbols: ReturnType<TsxParser['parseExports']>): ExportIssue[] {
    const issues: ExportIssue[] = [];

    let exportedInterfaces = 0;
    let exportedFunctions = 0;
    const totalExports = exportedSymbols.length;

    for (const symbol of exportedSymbols) {
      if (symbol.kind === 'interface') {
        exportedInterfaces += 1;
        continue;
      }

      if (symbol.kind === 'function') {
        exportedFunctions += 1;
        continue;
      }

      if (symbol.kind === 'type') {
        issues.push({
          line: symbol.line,
          column: symbol.column,
          message:
            'Found `export type`. Move it to shared types or replace it with `export interface` when possible.',
          suggestion: 'Replace `export type` with `export interface` when the shape is object-like.',
          hint: 'View files should expose one interface and one function only.',
        });
        continue;
      }

      issues.push({
        line: symbol.line,
        column: symbol.column,
        message:
          'Unexpected exported declaration. View files must export only one interface and one function.',
        hint: 'Keep only `export interface XProps` and `export function XView` in the file.',
      });
    }

    if (totalExports !== 2 || exportedInterfaces !== 1 || exportedFunctions !== 1) {
      issues.push({
        line: 1,
        column: 1,
        message:
          `Invalid export shape: expected 2 exports (1 interface + 1 function), got ${totalExports} ` +
          `(interfaces: ${exportedInterfaces}, functions: ${exportedFunctions}).`,
        expected: '2 exports (1 interface + 1 function)',
        received: `${totalExports} exports (${exportedInterfaces} interfaces, ${exportedFunctions} functions)`,
        hint: 'Keep a single exported props interface and a single exported view function.',
        suggestion: 'Remove extra exports or move helpers/types to separate files.',
      });
    }

    return issues;
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
