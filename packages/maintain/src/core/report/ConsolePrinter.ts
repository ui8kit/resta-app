import type { CheckResult, MaintainReport } from '../interfaces';

export interface ConsolePrinterOptions {
  reportPath?: string;
}

export class ConsolePrinter {
  print(report: MaintainReport, options: ConsolePrinterOptions = {}): void {
    for (const result of report.results) {
      this.printResult(result);
    }

    console.log('');
    console.log(
      `Summary: ${report.success ? 'success' : 'failed'} (${report.errors.length} errors, ${report.warnings.length} warnings)`
    );
    if (options.reportPath) {
      console.log(`Report: ${options.reportPath}`);
    }
    console.log('');
  }

  private printResult(result: CheckResult): void {
    const errorCount = result.issues.filter((issue) => issue.level === 'error').length;
    const warningCount = result.issues.filter((issue) => issue.level === 'warn').length;

    if (result.success) {
      console.log(
        `[OK] ${result.checker}: completed (${warningCount} warning${warningCount === 1 ? '' : 's'})`
      );
      return;
    }

    console.log(
      `[FAIL] ${result.checker}: ${errorCount} error${errorCount === 1 ? '' : 's'}, ${warningCount} warning${warningCount === 1 ? '' : 's'}`
    );

    const sampleIssues = result.issues.slice(0, 3);
    for (const issue of sampleIssues) {
      const location =
        issue.file && issue.line
          ? ` (${issue.file}:${issue.line})`
          : issue.file
            ? ` (${issue.file})`
            : '';
      console.log(`  - [${issue.code}] ${issue.message}${location}`);
    }

    if (result.issues.length > sampleIssues.length) {
      console.log(`  - ... ${result.issues.length - sampleIssues.length} more issue(s)`);
    }

    const hint = result.hint ?? result.issues.find((issue) => issue.hint)?.hint;
    if (hint) {
      console.log(`  Hint: ${hint}`);
    }
  }
}
