import { relative } from 'node:path';
import type { CheckContext, DataClassConflictCheckerConfig, Issue } from '../core/interfaces';
import { ClassMatcher, FileScanner, TsxParser } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

interface DataClassUsage {
  file: string;
  line: number;
  column: number;
  classes: string[];
  key: string;
}

export class DataClassConflictChecker extends BaseChecker<DataClassConflictCheckerConfig> {
  private readonly scanner = new FileScanner();
  private readonly parser = new TsxParser();

  constructor() {
    super(
      'data-class-conflicts',
      'Detect conflicting utility sets for identical data-class selectors',
      'dataClassConflicts'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const ignoreDataClasses = new Set(config.ignoreDataClasses ?? []);
    const uniqueFiles = new Map<string, { path: string; read: () => string }>();

    for (const scopePath of config.scope) {
      const scopedFiles = this.scanner.scan(context.root, config.pattern, {
        cwd: scopePath,
        useCache: true,
      });
      for (const file of scopedFiles) {
        uniqueFiles.set(file.path, file);
      }
    }

    const dataClassMap = new Map<string, Map<string, DataClassUsage[]>>();

    for (const file of uniqueFiles.values()) {
      const usages = this.parser.parseJsxProps(file.read(), '*', file.path);
      for (const usage of usages) {
        const rawDataClass = usage.props['data-class'];
        if (typeof rawDataClass !== 'string' || !rawDataClass.trim()) {
          continue;
        }

        const dataClass = rawDataClass.trim();
        if (ignoreDataClasses.has(dataClass)) {
          continue;
        }

        const classes = this.buildCanonicalClasses(usage.props);
        if (classes.length === 0) {
          continue;
        }

        const key = classes.join(' ');
        const byClassSet = dataClassMap.get(dataClass) ?? new Map<string, DataClassUsage[]>();
        const list = byClassSet.get(key) ?? [];

        list.push({
          file: this.relative(context.root, file.path),
          line: usage.line,
          column: usage.column,
          classes,
          key,
        });

        byClassSet.set(key, list);
        dataClassMap.set(dataClass, byClassSet);
      }
    }

    const issues: Issue[] = [];
    for (const [dataClass, classSets] of dataClassMap.entries()) {
      if (classSets.size <= 1) {
        continue;
      }

      const flattened = Array.from(classSets.values()).flat();
      const first = flattened[0];
      if (!first) {
        continue;
      }

      const conflicts = ClassMatcher.detectConflicts(
        Array.from(classSets.values()).flatMap((set) => set.map((entry) => entry.classes))
      );
      const distinctSets = Array.from(classSets.keys()).sort();

      issues.push(
        this.createIssue(
          'error',
          'DATA_CLASS_CONFLICT',
          `data-class "${dataClass}" resolves to ${classSets.size} different utility sets.`,
          {
            file: first.file,
            line: first.line,
            column: first.column,
            expected: 'A single canonical utility set per data-class',
            received: `${classSets.size} distinct utility sets`,
            hint: 'Keep each data-class tied to one semantic style contract.',
            suggestion: 'Use unique data-class names or normalize utility props across usages.',
            details: {
              dataClass,
              classSets: distinctSets,
              locations: flattened.map((entry) => ({
                file: entry.file,
                line: entry.line,
                column: entry.column,
                classes: entry.classes,
              })),
              utilityConflicts: conflicts,
            },
          }
        )
      );
    }

    const errorCount = issues.filter((issue) => issue.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: {
        filesScanned: uniqueFiles.size,
        dataClassesChecked: dataClassMap.size,
        conflicts: issues.length,
      },
    };
  }

  private buildCanonicalClasses(props: Record<string, string | number | boolean | null>): string[] {
    const entries: string[] = [];
    const rawClassTokens = [
      typeof props.className === 'string' ? props.className : '',
      typeof props.class === 'string' ? props.class : '',
    ]
      .flatMap((value) => value.split(/\s+/))
      .map((value) => value.trim())
      .filter(Boolean);

    entries.push(...rawClassTokens);

    for (const [key, value] of Object.entries(props)) {
      if (
        key === 'data-class' ||
        key === 'className' ||
        key === 'class' ||
        key === 'children'
      ) {
        continue;
      }
      if (value === null) {
        entries.push(`${key}:null`);
        continue;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          continue;
        }
        entries.push(`${key}:${trimmed}`);
        continue;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        entries.push(`${key}:${String(value)}`);
      }
    }

    return Array.from(new Set(entries)).sort();
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
