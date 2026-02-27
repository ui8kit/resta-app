import { relative, resolve } from 'node:path';
import {
  getAllowedTags,
  loadComponentTagMap,
  type ComponentTagMap,
  validateComponentTag,
} from '@ui8kit/generator/lib';
import type { CheckContext, ComponentTagCheckerConfig, Issue } from '../core/interfaces';
import { FileScanner, TsxParser } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

const DEFAULT_COMPONENTS = new Set(['Block', 'Box', 'Stack', 'Group', 'Text', 'Icon', 'Field']);

export class ComponentTagChecker extends BaseChecker<ComponentTagCheckerConfig> {
  private readonly scanner = new FileScanner();
  private readonly parser = new TsxParser();

  constructor() {
    super(
      'component-tag',
      'Validate component prop values against allowed HTML tags',
      'componentTag'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues: Issue[] = [];

    let tagMap: ComponentTagMap;
    try {
      const customPath =
        config.tagMapPath && config.tagMapPath.trim()
          ? resolve(context.root, config.tagMapPath)
          : undefined;
      tagMap = loadComponentTagMap(customPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        issues: [
          this.createIssue('error', 'COMPONENT_TAG_MAP_LOAD_FAILED', message, {
            hint: 'Provide checkers.componentTag.tagMapPath or ensure component-tag-map.json is available.',
            suggestion:
              'Add src/lib/component-tag-map.json or point to a custom map via maintain.config.json.',
          }),
        ],
      };
    }

    const uniqueFiles = new Map<string, { path: string; read: () => string }>();
    for (const scopePath of config.scope) {
      const files = this.scanner.scan(context.root, config.pattern, {
        cwd: scopePath,
        useCache: true,
      });
      for (const file of files) {
        uniqueFiles.set(file.path, file);
      }
    }

    for (const file of uniqueFiles.values()) {
      const usages = this.parser.parseJsxProps(file.read(), '*', file.path);
      for (const usage of usages) {
        if (!DEFAULT_COMPONENTS.has(usage.componentName)) {
          continue;
        }

        const componentProp = usage.props.component;
        if (typeof componentProp !== 'string' || !componentProp.trim()) {
          continue;
        }

        const tagValue = componentProp.trim();
        const validationError = validateComponentTag(usage.componentName, tagValue, tagMap);
        if (!validationError) {
          continue;
        }

        const allowed = getAllowedTags(usage.componentName, tagMap);
        const primarySuggestion = allowed[0];
        const expected = allowed.length > 0 ? allowed.join(' | ') : 'Known tags from component-tag map';

        issues.push(
          this.createIssue(
            'error',
            'COMPONENT_TAG_INVALID',
            validationError,
            {
              file: this.relative(context.root, file.path),
              line: usage.line,
              column: usage.column,
              expected,
              received: tagValue,
              hint: `Use a semantic tag supported by ${usage.componentName}.`,
              suggestion: primarySuggestion
                ? `Change component="${tagValue}" to component="${primarySuggestion}".`
                : 'Use one of the allowed tags defined in component-tag-map.json.',
            }
          )
        );
      }
    }

    const errorCount = issues.filter((issue) => issue.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: {
        filesScanned: uniqueFiles.size,
        errorCount,
      },
    };
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
