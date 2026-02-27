import type { IMaintainConfig } from './IMaintainConfig';
import type { ILogger } from './ILogger';
import type { CheckResult } from './IReport';

export type CheckerMode = 'run' | 'validate' | 'audit' | 'clean';

export interface CheckContext {
  root: string;
  runId: string;
  reportsDir: string;
  config: IMaintainConfig;
  logger: ILogger;
  mode: CheckerMode;
  dryRun?: boolean;
  signal?: AbortSignal;
}

export interface IChecker<TConfig = unknown> {
  readonly name: string;
  readonly description: string;
  readonly configKey: string;
  readonly enabled: boolean;
  configure(config: TConfig | undefined): void;
  run(context: CheckContext): Promise<CheckResult>;
}
