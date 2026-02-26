export type IssueLevel = 'error' | 'warn' | 'info';

export interface Issue {
  level: IssueLevel;
  code: string;
  message: string;
  checker?: string;
  file?: string;
  line?: number;
  hint?: string;
  details?: unknown;
}

export interface CheckResult {
  checker: string;
  description: string;
  success: boolean;
  duration: number;
  startedAt: string;
  finishedAt: string;
  issues: Issue[];
  stats?: Record<string, unknown>;
  output?: Record<string, unknown>;
  reportPath?: string;
  hint?: string;
  skipped?: boolean;
}

export interface MaintainReport {
  runId: string;
  generatedAt: string;
  duration: number;
  success: boolean;
  results: CheckResult[];
  errors: Issue[];
  warnings: Issue[];
}
