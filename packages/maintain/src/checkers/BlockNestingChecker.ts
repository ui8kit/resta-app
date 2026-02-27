import { relative } from 'node:path';
import ts from 'typescript';
import type { BlockNestingCheckerConfig, CheckContext, Issue } from '../core/interfaces';
import { FileScanner } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

export class BlockNestingChecker extends BaseChecker<BlockNestingCheckerConfig> {
  private readonly scanner = new FileScanner();

  constructor() {
    super('block-nesting', 'Forbid nested Block components and multiple root Blocks in View files', 'blockNesting');
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues: Issue[] = [];

    const uniqueFiles = new Map<string, { path: string; read: () => string }>();
    for (const scopePath of config.scope) {
      const scanned = this.scanner.scan(context.root, config.pattern, {
        cwd: scopePath,
        useCache: true,
      });
      for (const file of scanned) {
        uniqueFiles.set(file.path, file);
      }
    }

    for (const file of uniqueFiles.values()) {
      issues.push(...this.checkFile(file.path, file.read(), context.root));
    }

    const errorCount = issues.filter((i) => i.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: { filesScanned: uniqueFiles.size, errorCount },
    };
  }

  private checkFile(filePath: string, source: string, root: string): Issue[] {
    const issues: Issue[] = [];
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const fileRel = this.rel(root, filePath);

    const visitJsx = (node: ts.Node, blockDepth: number): void => {
      const isBlock = this.isBlockElement(node, sourceFile);

      if (isBlock && blockDepth > 0) {
        const loc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        issues.push(
          this.createIssue('error', 'BLOCK_NESTED', `<Block> nested inside another <Block> is forbidden`, {
            file: fileRel,
            line: loc.line + 1,
            column: loc.character + 1,
            hint: 'Block is a top-level container. Use Stack, Group, Grid, or Box for inner layout.',
            suggestion: 'Replace the inner <Block> with <Stack>, <Group>, <Grid>, or <Box>.',
          })
        );
      }

      const nextDepth = isBlock ? blockDepth + 1 : blockDepth;
      ts.forEachChild(node, (child) => visitJsx(child, nextDepth));
    };

    const returnStatements: ts.ReturnStatement[] = [];
    const collectReturns = (node: ts.Node, inExportedFn: boolean): void => {
      if (
        (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) &&
        this.isExported(node)
      ) {
        ts.forEachChild(node, (child) => collectReturns(child, true));
        return;
      }
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        ts.forEachChild(node, (child) => collectReturns(child, inExportedFn));
        return;
      }
      if (inExportedFn && ts.isReturnStatement(node)) {
        returnStatements.push(node);
      }
      ts.forEachChild(node, (child) => collectReturns(child, inExportedFn));
    };

    collectReturns(sourceFile, false);

    for (const ret of returnStatements) {
      let topLevelBlocks = 0;
      const countTopBlocks = (node: ts.Node): void => {
        if (this.isBlockElement(node, sourceFile)) {
          topLevelBlocks++;
          return;
        }
        if (ts.isJsxFragment(node) || ts.isParenthesizedExpression(node)) {
          ts.forEachChild(node, countTopBlocks);
        }
      };
      if (ret.expression) countTopBlocks(ret.expression);

      if (topLevelBlocks > 1) {
        const loc = sourceFile.getLineAndCharacterOfPosition(ret.getStart(sourceFile));
        issues.push(
          this.createIssue('error', 'BLOCK_MULTIPLE_ROOTS', `Multiple root <Block> elements found (${topLevelBlocks})`, {
            file: fileRel,
            line: loc.line + 1,
            column: loc.character + 1,
            hint: 'View files should have at most one root Block.',
            suggestion: 'Wrap content in a single <Block> or use a layout component.',
          })
        );
      }
    }

    visitJsx(sourceFile, 0);

    return issues;
  }

  private isBlockElement(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    let tagName: string | undefined;
    if (ts.isJsxElement(node)) {
      tagName = this.getTagName(node.openingElement.tagName);
    } else if (ts.isJsxSelfClosingElement(node)) {
      tagName = this.getTagName(node.tagName);
    }
    return tagName === 'Block';
  }

  private getTagName(expr: ts.JsxTagNameExpression): string | undefined {
    if (ts.isIdentifier(expr)) return expr.text;
    if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
    return undefined;
  }

  private isExported(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;
    const modifiers = ts.getModifiers(node);
    return Boolean(modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
  }

  private rel(root: string, target: string): string {
    return relative(root, target).replace(/\\/g, '/');
  }
}
