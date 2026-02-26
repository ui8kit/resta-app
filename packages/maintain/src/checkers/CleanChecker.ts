import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { CheckContext, CleanCheckerConfig, Issue } from '../core/interfaces';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

export class CleanChecker extends BaseChecker<CleanCheckerConfig> {
  constructor() {
    super('clean', 'Clean generated artifacts and caches', 'clean');
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues: Issue[] = [];
    const removed: string[] = [];
    const dryRun = context.dryRun ?? true;

    for (const pathEntry of config.paths) {
      const absolutePath = resolve(context.root, pathEntry);
      if (!existsSync(absolutePath)) {
        continue;
      }
      if (absolutePath === '/' || absolutePath === '') {
        issues.push(
          this.createIssue(
            'error',
            'CLEAN_PATH_INVALID',
            `Refusing to remove unsafe path: ${pathEntry}`
          )
        );
        continue;
      }

      try {
        if (!dryRun) {
          rmSync(absolutePath, { recursive: true, force: true });
        }
        removed.push(this.relative(context.root, absolutePath));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        issues.push(
          this.createIssue('error', 'CLEAN_REMOVE_FAILED', message, {
            file: this.relative(context.root, absolutePath),
          })
        );
      }
    }

    if (config.includeTsBuildInfo !== false) {
      const tsBuildInfoFiles = this.collectTsBuildInfoFiles(context.root);
      for (const tsBuildInfoFile of tsBuildInfoFiles) {
        try {
          if (!dryRun) {
            rmSync(tsBuildInfoFile, { force: true });
          }
          removed.push(this.relative(context.root, tsBuildInfoFile));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          issues.push(
            this.createIssue('warn', 'CLEAN_TSBUILDINFO_FAILED', message, {
              file: this.relative(context.root, tsBuildInfoFile),
            })
          );
        }
      }
    }

    const errorCount = issues.filter((issue) => issue.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: {
        dryRun,
        removedCount: removed.length,
      },
      output: {
        removed,
      },
      hint: dryRun ? 'Dry-run only. Use --execute to apply deletion.' : undefined,
    };
  }

  private collectTsBuildInfoFiles(root: string): string[] {
    const files: string[] = [];
    const visit = (dirPath: string): void => {
      for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.turbo') {
          continue;
        }
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          visit(fullPath);
          continue;
        }
        if (entry.isFile() && entry.name.endsWith('.tsbuildinfo')) {
          files.push(fullPath);
        }
      }
    };
    visit(root);
    return files;
  }

  private relative(root: string, targetPath: string): string {
    const path = relative(root, targetPath).replace(/\\/g, '/');
    if (path.startsWith('..')) {
      return targetPath.replace(/\\/g, '/');
    }
    return path;
  }
}
