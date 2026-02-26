import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { MaintainReport } from '../interfaces';

export class ReportWriter {
  write(report: MaintainReport, reportsDir: string, root = process.cwd()): string {
    mkdirSync(reportsDir, { recursive: true });
    const fileName = `maintain-${report.runId}.json`;
    const outputPath = join(reportsDir, fileName);
    writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');
    return relative(root, outputPath).replace(/\\/g, '/');
  }
}
