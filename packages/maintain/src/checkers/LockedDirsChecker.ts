import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { CheckContext, Issue, LockedDirsCheckerConfig } from '../core/interfaces';
import { FileScanner } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

interface SnapshotEntry {
  file: string;
  hash: string;
}

interface Snapshot {
  generatedAt: string;
  entries: SnapshotEntry[];
}

const SNAPSHOT_FILENAME = 'locked-dirs.snapshot.json';

export class LockedDirsChecker extends BaseChecker<LockedDirsCheckerConfig> {
  private readonly scanner = new FileScanner();

  constructor() {
    super('locked-dirs', 'Validate that protected directories have not been modified', 'lockedDirs');
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues: Issue[] = [];

    const currentEntries = new Map<string, string>();
    for (const dir of config.dirs) {
      const files = this.scanner.scan(context.root, config.pattern, {
        cwd: dir,
        useCache: false,
      });
      for (const file of files) {
        const rel = this.rel(context.root, file.path);
        const hash = this.hashContent(file.read());
        currentEntries.set(rel, hash);
      }
    }

    const snapshotPath = resolve(context.reportsDir, SNAPSHOT_FILENAME);
    const existing = this.loadSnapshot(snapshotPath);

    if (!existing) {
      this.saveSnapshot(snapshotPath, currentEntries);
      return {
        success: true,
        issues: [],
        stats: { filesLocked: currentEntries.size, snapshotCreated: true },
        hint: `Snapshot created at ${this.rel(context.root, snapshotPath)} with ${currentEntries.size} files.`,
      };
    }

    const baselineMap = new Map(existing.entries.map((e) => [e.file, e.hash]));

    for (const [file, hash] of currentEntries) {
      const baselineHash = baselineMap.get(file);
      if (!baselineHash) {
        issues.push(
          this.createIssue('error', 'LOCKED_DIR_FILE_ADDED', `File added to locked directory: ${file}`, {
            file,
            hint: 'This directory is locked. New files are not allowed.',
            suggestion: 'Remove the file or update the locked-dirs snapshot if the change is intentional.',
          })
        );
      } else if (baselineHash !== hash) {
        issues.push(
          this.createIssue('error', 'LOCKED_DIR_FILE_MODIFIED', `File modified in locked directory: ${file}`, {
            file,
            hint: 'This directory is locked. Modifications are not allowed.',
            suggestion: 'Revert the change or update the locked-dirs snapshot if the change is intentional.',
          })
        );
      }
    }

    for (const [file] of baselineMap) {
      if (!currentEntries.has(file)) {
        issues.push(
          this.createIssue('error', 'LOCKED_DIR_FILE_REMOVED', `File removed from locked directory: ${file}`, {
            file,
            hint: 'This directory is locked. File deletions are not allowed.',
            suggestion: 'Restore the file or update the locked-dirs snapshot if the change is intentional.',
          })
        );
      }
    }

    const errorCount = issues.filter((i) => i.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: { filesLocked: currentEntries.size, errorCount },
    };
  }

  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  private loadSnapshot(path: string): Snapshot | null {
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as Snapshot;
    } catch {
      return null;
    }
  }

  private saveSnapshot(path: string, entries: Map<string, string>): void {
    const dir = resolve(path, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const snapshot: Snapshot = {
      generatedAt: new Date().toISOString(),
      entries: Array.from(entries, ([file, hash]) => ({ file, hash })).sort((a, b) =>
        a.file.localeCompare(b.file)
      ),
    };
    writeFileSync(path, JSON.stringify(snapshot, null, 2) + '\n', 'utf-8');
  }

  private rel(root: string, target: string): string {
    return relative(root, target).replace(/\\/g, '/');
  }
}
