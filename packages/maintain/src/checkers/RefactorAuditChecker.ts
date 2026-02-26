import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import type { CheckContext, RefactorAuditConfig, Severity } from '../core/interfaces';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

interface MappingEntry {
  from: string;
  to: string;
  severity?: Severity;
}

interface MappingFile {
  version?: string;
  entries: MappingEntry[];
}

interface ResidualMatch {
  term: string;
  replacement: string;
  severity: Severity;
  file: string;
  line: number;
  excerpt: string;
}

interface EntryMetrics {
  from: string;
  to: string;
  severity: Severity;
  oldCount: number;
  newCount: number;
  residualCount: number;
  expectedCount: number;
}

const VALID_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mdx',
  '.css',
  '.scss',
  '.sh',
  '.yml',
  '.yaml',
]);

export class RefactorAuditChecker extends BaseChecker<RefactorAuditConfig> {
  constructor() {
    super(
      'refactor-audit',
      'Audit residual legacy terms after refactors',
      'refactorAudit'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const mappingPath = resolve(context.root, config.mapping);
    if (!existsSync(mappingPath)) {
      return {
        success: false,
        issues: [
          this.createIssue(
            'error',
            'MAPPING_FILE_MISSING',
            `Mapping file not found: ${this.relative(context.root, mappingPath)}`
          ),
        ],
        hint: 'Set checkers.refactorAudit.mapping to a valid JSON mapping file.',
      };
    }

    const mapping = this.loadMapping(mappingPath);
    const files = Array.from(
      new Set(config.scope.flatMap((targetPath) => this.listFilesRecursively(context.root, targetPath)))
    );

    const metricsByEntry: EntryMetrics[] = mapping.entries.map((entry) => ({
      from: entry.from,
      to: entry.to,
      severity: entry.severity ?? 'error',
      oldCount: 0,
      newCount: 0,
      residualCount: 0,
      expectedCount: 0,
    }));
    const residualMatches: ResidualMatch[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      mapping.entries.forEach((entry, index) => {
        const oldCount = this.countMatches(content, entry.from);
        const newCount = this.countMatches(content, entry.to);
        metricsByEntry[index]!.oldCount += oldCount;
        metricsByEntry[index]!.newCount += newCount;
        metricsByEntry[index]!.residualCount += oldCount;
        metricsByEntry[index]!.expectedCount += oldCount + newCount;
        if (oldCount > 0) {
          residualMatches.push(
            ...this.collectResidualMatches(
              content,
              file,
              entry,
              config.maxMatchesPerEntry ?? 10,
              context.root
            )
          );
        }
      });
    }

    const issues = residualMatches.map((match) =>
      this.createIssue(
        match.severity === 'info' ? 'warn' : match.severity,
        'RESIDUAL_MATCH_FOUND',
        `Residual term "${match.term}" found.`,
        {
          file: match.file,
          line: match.line,
          details: { replacement: match.replacement, excerpt: match.excerpt },
        }
      )
    );
    const errorCount = issues.filter((issue) => issue.level === 'error').length;

    return {
      success: errorCount === 0,
      issues,
      stats: {
        filesScanned: files.length,
        mappingVersion: mapping.version ?? '1.0.0',
        mappingFile: this.relative(context.root, mappingPath),
        residualCount: metricsByEntry.reduce((sum, item) => sum + item.residualCount, 0),
        replacedCount: metricsByEntry.reduce((sum, item) => sum + item.newCount, 0),
      },
      output: {
        metrics: metricsByEntry,
        residualMatches: residualMatches.slice(0, 200),
      },
      hint:
        errorCount > 0
          ? 'Run `bun run audit:refactor` for detailed legacy-term locations and replace all error-severity terms.'
          : undefined,
    };
  }

  private loadMapping(mappingPath: string): MappingFile {
    const raw = readFileSync(mappingPath, 'utf-8');
    const parsed = JSON.parse(raw) as MappingFile;
    if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) {
      throw new Error(`Mapping file must contain a non-empty "entries" array (${mappingPath}).`);
    }
    return parsed;
  }

  private listFilesRecursively(root: string, targetPath: string): string[] {
    const fullPath = resolve(root, targetPath);
    const stats = statSync(fullPath, { throwIfNoEntry: false });
    if (!stats) {
      return [];
    }
    if (stats.isFile()) {
      return VALID_EXTENSIONS.has(extname(fullPath)) ? [fullPath] : [];
    }

    const files: string[] = [];
    for (const entry of readdirSync(fullPath, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.turbo') {
        continue;
      }
      const child = join(fullPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.listFilesRecursively(root, this.relative(root, child)));
        continue;
      }
      if (entry.isFile() && VALID_EXTENSIONS.has(extname(entry.name))) {
        files.push(child);
      }
    }
    return files;
  }

  private collectResidualMatches(
    content: string,
    file: string,
    entry: MappingEntry,
    maxPerEntry: number,
    root: string
  ): ResidualMatch[] {
    const from = entry.from;
    if (!from) {
      return [];
    }

    const severity = entry.severity ?? 'error';
    const matcher = new RegExp(this.escapeRegex(from), 'i');
    const lines = content.split(/\r?\n/);
    const matches: ResidualMatch[] = [];
    for (let index = 0; index < lines.length && matches.length < maxPerEntry; index += 1) {
      const line = lines[index] ?? '';
      if (!matcher.test(line)) {
        continue;
      }
      matches.push({
        term: from,
        replacement: entry.to,
        severity,
        file: this.relative(root, file),
        line: index + 1,
        excerpt: line.trim().slice(0, 200),
      });
    }
    return matches;
  }

  private countMatches(content: string, term: string): number {
    if (!term) {
      return 0;
    }
    const matcher = new RegExp(this.escapeRegex(term), 'gi');
    return content.match(matcher)?.length ?? 0;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private relative(root: string, target: string): string {
    return relative(root, target).replace(/\\/g, '/');
  }
}
