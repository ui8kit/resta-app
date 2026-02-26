import { resolve } from 'node:path';
import { Logger } from '../logger/Logger';
import { CheckPipeline } from '../pipeline/CheckPipeline';
import { CheckerRegistry } from '../registry/CheckerRegistry';
import type {
  CheckContext,
  CheckerMode,
  IChecker,
  ILogger,
  IMaintainConfig,
  MaintainReport,
} from '../interfaces';

export interface MaintainOrchestratorOptions {
  logger?: ILogger;
  continueOnError?: boolean;
  maxParallel?: number;
}

export interface MaintainRunOptions {
  checkerNames?: string[];
  mode?: CheckerMode;
  dryRun?: boolean;
}

export class MaintainOrchestrator {
  private readonly logger: ILogger;
  private readonly registry = new CheckerRegistry();
  private readonly continueOnError: boolean;
  private readonly maxParallel: number;

  constructor(options: MaintainOrchestratorOptions = {}) {
    this.logger = options.logger ?? new Logger();
    this.continueOnError = options.continueOnError ?? true;
    this.maxParallel = options.maxParallel ?? 1;
  }

  use(checker: IChecker): this {
    this.registry.register(checker);
    return this;
  }

  async run(config: IMaintainConfig, options: MaintainRunOptions = {}): Promise<MaintainReport> {
    const startedAt = Date.now();
    const runId = `maintain_${startedAt}`;
    const root = resolve(config.root);
    const reportsDir = resolve(root, config.reportsDir ?? '.cursor/reports');
    const mode = options.mode ?? 'run';

    const checkers = this.selectCheckers(config, options.checkerNames);
    for (const checker of checkers) {
      const checkerConfig = this.getCheckerConfig(config, checker);
      checker.configure(checkerConfig as never);
    }

    const context: CheckContext = {
      root,
      runId,
      reportsDir,
      config,
      logger: this.logger,
      mode,
      dryRun: options.dryRun,
    };

    const pipeline = new CheckPipeline({
      continueOnError: config.continueOnError ?? this.continueOnError,
      maxParallel: config.maxParallel ?? this.maxParallel,
    });

    const results = await pipeline.execute(checkers, context);
    const errors = results.flatMap((result) =>
      result.issues.filter((issue) => issue.level === 'error')
    );
    const warnings = results.flatMap((result) =>
      result.issues.filter((issue) => issue.level === 'warn')
    );
    const duration = Date.now() - startedAt;

    return {
      runId,
      generatedAt: new Date(startedAt).toISOString(),
      duration,
      success: errors.length === 0 && results.every((result) => result.success),
      results,
      errors,
      warnings,
    };
  }

  private selectCheckers(config: IMaintainConfig, checkerNames?: string[]): IChecker[] {
    if (checkerNames && checkerNames.length > 0) {
      return this.registry.resolveMany(checkerNames);
    }

    return this.registry
      .list()
      .filter((checker) => this.getCheckerConfig(config, checker) !== undefined);
  }

  private getCheckerConfig(config: IMaintainConfig, checker: IChecker): unknown {
    return config.checkers[checker.configKey];
  }
}
