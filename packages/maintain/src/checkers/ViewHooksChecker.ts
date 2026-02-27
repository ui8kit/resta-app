import { relative } from 'node:path';
import ts from 'typescript';
import type { CheckContext, Issue, ViewHooksCheckerConfig } from '../core/interfaces';
import { FileScanner } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

export class ViewHooksChecker extends BaseChecker<ViewHooksCheckerConfig> {
  private readonly scanner = new FileScanner();

  constructor() {
    super('view-hooks', 'Forbid React hooks in View files', 'viewHooks');
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues: Issue[] = [];

    const files = this.scanner.scan(context.root, config.pattern, { useCache: true });
    const allowed = new Set(config.allowedHooks ?? []);

    for (const file of files) {
      const source = file.read();
      const sourceFile = ts.createSourceFile(
        file.path,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) {
          const hookName = this.getHookName(node.expression);
          if (hookName && !allowed.has(hookName)) {
            const loc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            issues.push(
              this.createIssue('error', 'VIEW_HOOK_FORBIDDEN', `Hook "${hookName}" is not allowed in View files`, {
                file: this.rel(context.root, file.path),
                line: loc.line + 1,
                column: loc.character + 1,
                received: hookName,
                hint: 'View files must be pure presentation without hooks.',
                suggestion: config.allowedHooks?.length
                  ? `Use one of the allowed hooks: ${config.allowedHooks.join(', ')}.`
                  : 'Remove the hook call or move logic to a parent component.',
              })
            );
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    const errorCount = issues.filter((i) => i.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: { filesScanned: files.length, errorCount },
    };
  }

  private getHookName(expr: ts.Expression): string | null {
    if (ts.isIdentifier(expr) && expr.text.startsWith('use') && expr.text.length > 3) {
      return expr.text;
    }
    return null;
  }

  private rel(root: string, target: string): string {
    return relative(root, target).replace(/\\/g, '/');
  }
}
