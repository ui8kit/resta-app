import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import type { ErrorObject } from 'ajv';
import type { CheckContext, FixturesCheckerConfig, Issue } from '../core/interfaces';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

export class FixturesChecker extends BaseChecker<FixturesCheckerConfig> {
  constructor() {
    super('fixtures', 'Validate fixture JSON against schema targets', 'fixtures');
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues: Issue[] = [];

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);

    const schemaFiles = this.collectSchemaFiles(
      Array.from(new Set(config.targets.map((target) => dirname(resolve(context.root, target.schema)))))
    );
    for (const schemaFile of schemaFiles) {
      try {
        const schema = this.readJson(schemaFile);
        ajv.addSchema(schema);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('schema with key or id')) {
          issues.push(
            this.createIssue('warn', 'SCHEMA_LOAD_WARNING', message, {
              file: this.relative(context.root, schemaFile),
            })
          );
        }
      }
    }

    for (const target of config.targets) {
      const dataPath = resolve(context.root, target.file);
      const schemaPath = resolve(context.root, target.schema);

      if (!existsSync(dataPath)) {
        issues.push(
          this.createIssue('error', 'FIXTURE_FILE_MISSING', `Fixture file not found: ${target.file}`, {
            file: target.file,
          })
        );
        continue;
      }

      if (!existsSync(schemaPath)) {
        issues.push(
          this.createIssue('error', 'SCHEMA_FILE_MISSING', `Schema file not found: ${target.schema}`, {
            file: target.schema,
          })
        );
        continue;
      }

      try {
        const schema = this.readJson(schemaPath);
        const data = this.readJson(dataPath);
        const validate = ajv.compile(schema);
        const valid = validate(data);
        if (!valid) {
          for (const validationError of validate.errors ?? []) {
            issues.push(this.toIssue(target.file, validationError));
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        issues.push(
          this.createIssue('error', 'FIXTURE_VALIDATION_ERROR', message, {
            file: target.file,
          })
        );
      }
    }

    const errorCount = issues.filter((issue) => issue.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: {
        checkedTargets: config.targets.length,
        errorCount,
        warningCount: issues.filter((issue) => issue.level === 'warn').length,
      },
    };
  }

  private toIssue(targetFile: string, error: ErrorObject): Issue {
    const instancePath = error.instancePath || '/';
    const message = error.message ?? 'validation error';
    return this.createIssue(
      'error',
      'FIXTURE_SCHEMA_INVALID',
      `${targetFile} ${instancePath}: ${message}`
    );
  }

  private collectSchemaFiles(baseDirectories: string[]): string[] {
    const files = new Set<string>();
    const visit = (dirPath: string): void => {
      if (!existsSync(dirPath)) {
        return;
      }
      for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          visit(fullPath);
          continue;
        }
        if (entry.isFile() && extname(entry.name) === '.json') {
          files.add(fullPath);
        }
      }
    };

    for (const baseDirectory of baseDirectories) {
      visit(baseDirectory);
    }
    return Array.from(files);
  }

  private readJson(targetPath: string): unknown {
    return JSON.parse(readFileSync(targetPath, 'utf-8')) as unknown;
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
