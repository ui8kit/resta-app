import type { CheckContext, IChecker, CheckResult, Issue } from '../interfaces';

export interface CheckPipelineOptions {
  continueOnError?: boolean;
  maxParallel?: number;
}

export class CheckPipeline {
  private readonly continueOnError: boolean;
  private readonly maxParallel: number;

  constructor(options: CheckPipelineOptions = {}) {
    this.continueOnError = options.continueOnError ?? true;
    this.maxParallel = Math.max(1, options.maxParallel ?? 1);
  }

  async execute(checkers: IChecker[], context: CheckContext): Promise<CheckResult[]> {
    if (checkers.length === 0) {
      return [];
    }

    if (this.maxParallel === 1 || checkers.length === 1) {
      return this.executeSequential(checkers, context);
    }

    return this.executeParallel(checkers, context);
  }

  private async executeSequential(checkers: IChecker[], context: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    for (const checker of checkers) {
      const result = await this.runChecker(checker, context);
      results.push(result);
      if (!result.success && !this.continueOnError) {
        break;
      }
    }
    return results;
  }

  private async executeParallel(checkers: IChecker[], context: CheckContext): Promise<CheckResult[]> {
    const results: Array<CheckResult | undefined> = new Array(checkers.length);
    let cursor = 0;
    let stop = false;

    const worker = async (): Promise<void> => {
      while (!stop) {
        const index = cursor;
        cursor += 1;
        if (index >= checkers.length) {
          return;
        }

        const checker = checkers[index];
        if (!checker) {
          return;
        }

        const result = await this.runChecker(checker, context);
        results[index] = result;

        if (!result.success && !this.continueOnError) {
          stop = true;
        }
      }
    };

    const workerCount = Math.min(this.maxParallel, checkers.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return results.filter((result): result is CheckResult => Boolean(result));
  }

  private async runChecker(checker: IChecker, context: CheckContext): Promise<CheckResult> {
    const startedAt = new Date();
    try {
      return await checker.run(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const issue: Issue = {
        level: 'error',
        code: 'CHECKER_RUNTIME_ERROR',
        checker: checker.name,
        message,
        hint: 'Inspect checker runtime logs and rerun the command.',
        suggestion: 'Fix the checker runtime error and execute maintain again.',
      };
      const finishedAt = new Date();
      return {
        checker: checker.name,
        description: checker.description,
        success: false,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        duration: finishedAt.getTime() - startedAt.getTime(),
        issues: [issue],
        hint: issue.hint,
      };
    }
  }
}
