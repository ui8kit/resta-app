import { resolve } from 'node:path';
import {
  BlockNestingChecker,
  CleanChecker,
  ColorTokenChecker,
  ComponentTagChecker,
  ContractTestsChecker,
  DataClassConflictChecker,
  FixturesChecker,
  GenLintChecker,
  InvariantsChecker,
  LockedDirsChecker,
  OrphanFilesChecker,
  RefactorAuditChecker,
  UtilityPropLiteralsChecker,
  UtilityPropsWhitelistChecker,
  ViewExportsChecker,
  ViewHooksChecker,
} from '../checkers';
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
  verbose?: boolean;
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

  const builtinCheckers = [
    new RefactorAuditChecker(),
    new InvariantsChecker(),
    new FixturesChecker(),
    new ViewExportsChecker(),
    new ContractTestsChecker(),
    new DataClassConflictChecker(),
    new ComponentTagChecker(),
    new ColorTokenChecker(),
    new GenLintChecker(),
    new CleanChecker(),
    new LockedDirsChecker(),
    new ViewHooksChecker(),
    new UtilityPropLiteralsChecker(),
    new UtilityPropsWhitelistChecker(),
    new OrphanFilesChecker(),
    new BlockNestingChecker(),
  ] as const;

  const orchestrator = new MaintainOrchestrator({
    continueOnError: config.continueOnError,
    maxParallel: config.maxParallel,
  });
  for (const checker of builtinCheckers) {
    orchestrator.use(checker);
  }

  const report = await orchestrator.run(config, {
    checkerNames: options.checkerNames,
    mode: options.mode ?? 'run',
    dryRun: options.dryRun,
  });

  const writer = new ReportWriter();
  const absoluteReportsDir = resolve(config.root, config.reportsDir ?? '.cursor/reports');
  const reportPath = writer.write(report, absoluteReportsDir, config.root);

  const printer = new ConsolePrinter();
  printer.print(report, { reportPath, verbose: options.verbose });

  return {
    report,
    reportPath,
  };
}
