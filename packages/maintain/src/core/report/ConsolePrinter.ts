import type { CheckResult, MaintainReport } from '../interfaces';

export interface ConsolePrinterOptions {
  reportPath?: string;
  verbose?: boolean;
}

export class ConsolePrinter {
  print(report: MaintainReport, options: ConsolePrinterOptions = {}): void {
    for (const result of report.results) {
      this.printResult(result, options.verbose ?? false);
    }

    console.log('');
    console.log(
      `Summary: ${report.errors.length} errors, ${report.warnings.length} warnings (${report.success ? 'PASS' : 'FAIL'})`
    );
    if (options.reportPath) {
      console.log(`Report: ${options.reportPath}`);
    }
    console.log('');
  }

  private printResult(result: CheckResult, verbose: boolean): void {
    const errorCount = result.issues.filter((issue) => issue.level === 'error').length;
    const warningCount = result.issues.filter((issue) => issue.level === 'warn').length;
    const checkCount = result.issues.length;

    console.log(`  [${result.checker}]  ${result.description}`);
    console.log(
      `  ${result.success ? '✓ PASS' : '✗ FAIL'}  (${checkCount} checks, ${errorCount} errors, ${warningCount} warnings, ${result.duration}ms)`
    );

    if (result.issues.length > 0) {
      const displayed = verbose ? result.issues : result.issues.slice(0, 3);
      for (const issue of displayed) {
        const location = this.formatLocation(issue.file, issue.line, issue.column);
        const level = issue.level === 'error' ? 'ERROR' : issue.level === 'warn' ? 'WARN' : 'INFO';
        const locationToken = location ? `  ${location}` : '';
        console.log(`    [${level}] ${issue.code}${locationToken}  ${issue.message}`);
        if (issue.expected) {
          console.log(`      expected: ${issue.expected}`);
        }
        if (issue.received) {
          console.log(`      received: ${issue.received}`);
        }
        if (issue.hint) {
          console.log(`      hint: ${issue.hint}`);
        }
        if (issue.suggestion) {
          console.log(`      suggestion: ${issue.suggestion}`);
        }
        if (verbose && issue.docs) {
          console.log(`      docs: ${issue.docs}`);
        }
      }

      if (!verbose && result.issues.length > displayed.length) {
        console.log(
          `    ... ${result.issues.length - displayed.length} more issue(s). Re-run with --verbose to print all.`
        );
      }
    }

    if (result.hint) {
      console.log(`    hint: ${result.hint}`);
    }

    console.log('');
  }

  private formatLocation(file?: string, line?: number, column?: number): string {
    if (!file) {
      return '';
    }
    if (line === undefined) {
      return file;
    }
    if (column === undefined) {
      return `${file}:${line}`;
    }
    return `${file}:${line}:${column}`;
  }
}
