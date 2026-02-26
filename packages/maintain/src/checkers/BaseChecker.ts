import type {
  CheckContext,
  CheckResult,
  IChecker,
  ILogger,
  IMaintainConfig,
  Issue,
  IssueLevel,
} from '../core/interfaces';

export interface CheckerExecutionResult {
  issues?: Issue[];
  stats?: Record<string, unknown>;
  output?: Record<string, unknown>;
  success?: boolean;
  hint?: string;
  reportPath?: string;
}

export abstract class BaseChecker<TConfig>
  implements IChecker<TConfig>
{
  protected config: TConfig | undefined;

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly configKey: keyof IMaintainConfig['checkers']
  ) {}

  get enabled(): boolean {
    return true;
  }

  configure(config: TConfig | undefined): void {
    this.config = config;
  }

  async run(context: CheckContext): Promise<CheckResult> {
    const startedAt = Date.now();
    const logger = context.logger.child(this.name);
    try {
      const execution = await this.execute(context, logger);
      const issues = execution.issues ?? [];
      const hasError = issues.some((issue) => issue.level === 'error');
      const finishedAt = Date.now();

      return {
        checker: this.name,
        description: this.description,
        success: execution.success ?? !hasError,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date(finishedAt).toISOString(),
        duration: finishedAt - startedAt,
        issues,
        stats: execution.stats,
        output: execution.output,
        hint: execution.hint,
        reportPath: execution.reportPath,
      };
    } catch (error) {
      const finishedAt = Date.now();
      const message = error instanceof Error ? error.message : String(error);
      const issue = this.createIssue('error', 'CHECKER_EXECUTION_FAILED', message, {
        hint: `Inspect checker "${this.name}" configuration and retry.`,
      });
      return {
        checker: this.name,
        description: this.description,
        success: false,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date(finishedAt).toISOString(),
        duration: finishedAt - startedAt,
        issues: [issue],
        hint: issue.hint,
      };
    }
  }

  protected getConfig(): TConfig {
    if (!this.config) {
      throw new Error(`Checker "${this.name}" requires configuration.`);
    }
    return this.config;
  }

  protected createIssue(
    level: IssueLevel,
    code: string,
    message: string,
    extras: Partial<Issue> = {}
  ): Issue {
    return {
      level,
      code,
      message,
      checker: this.name,
      ...extras,
    };
  }

  protected abstract execute(
    context: CheckContext,
    logger: ILogger
  ): Promise<CheckerExecutionResult>;
}
