import { resolve } from 'node:path';
import { CleanChecker, ContractTestsChecker, FixturesChecker, InvariantsChecker, RefactorAuditChecker, ViewExportsChecker } from '../checkers';
import { loadMaintainConfig } from '../config/loader';
import { MaintainOrchestrator } from '../core/orchestrator/MaintainOrchestrator';
import type { CheckerMode, IMaintainConfig, MaintainReport } from '../core/interfaces';
import { ConsolePrinter } from '../core/report/ConsolePrinter';
import { ReportWriter } from '../core/report/ReportWriter';

export interface ExecuteMaintainRunOptions {
  cwd?: string;
  configPath?: string;
  checkerNames?: string[];
  mode?: CheckerMode;
  dryRun?: boolean;
  mutateConfig?: (config: IMaintainConfig) => void;
}

export interface ExecuteMaintainRunResult {
  report: MaintainReport;
  reportPath: string;
}

export async function executeMaintainRun(
  options: ExecuteMaintainRunOptions = {}
): Promise<ExecuteMaintainRunResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const config = loadMaintainConfig({
    cwd,
    configPath: options.configPath ?? 'maintain.config.json',
  });

  options.mutateConfig?.(config);

  const orchestrator = new MaintainOrchestrator({
    continueOnError: config.continueOnError,
    maxParallel: config.maxParallel,
  })
    .use(new RefactorAuditChecker())
    .use(new InvariantsChecker())
    .use(new FixturesChecker())
    .use(new ViewExportsChecker())
    .use(new ContractTestsChecker())
    .use(new CleanChecker());

  const report = await orchestrator.run(config, {
    checkerNames: options.checkerNames,
    mode: options.mode ?? 'run',
    dryRun: options.dryRun,
  });

  const writer = new ReportWriter();
  const absoluteReportsDir = resolve(config.root, config.reportsDir ?? '.cursor/reports');
  const reportPath = writer.write(report, absoluteReportsDir, config.root);

  const printer = new ConsolePrinter();
  printer.print(report, { reportPath });

  return {
    report,
    reportPath,
  };
}
