import { relative } from 'node:path';
import ts from 'typescript';
import type {
  CheckContext,
  GenLintCheckerConfig,
  GenLintRuleCode,
  Issue,
  Severity,
} from '../core/interfaces';
import { FileScanner } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

interface GenLintIssue {
  code: GenLintRuleCode;
  message: string;
  file: string;
  line: number;
  column: number;
}

const DEFAULT_RULE_SEVERITY: Record<GenLintRuleCode, Severity> = {
  GEN001: 'error',
  GEN002: 'error',
  GEN003: 'warn',
  GEN004: 'error',
  GEN005: 'warn',
  GEN006: 'error',
  GEN007: 'error',
  GEN008: 'warn',
};

const RULE_SUGGESTIONS: Record<GenLintRuleCode, string> = {
  GEN001: 'Extract the local function outside the component or move it to a shared utility.',
  GEN002: 'Move inline arrow-function constants outside the component body.',
  GEN003: "Extract local non-props types to '@/types' and import them.",
  GEN004: 'Replace rest params with explicit props fields in component signatures.',
  GEN005: 'Remove index signatures from props to keep prop contracts explicit.',
  GEN006: 'Nest <Else> / <ElseIf> directly inside an <If> component.',
  GEN007: "Replace '@ui8kit/sdk' imports with local DSL-compatible abstractions.",
  GEN008: "Use primitive/inline props or import shared types from '@/types'.",
};

const RULE_HINTS: Record<GenLintRuleCode, string> = {
  GEN001: 'Component bodies should remain declarative and side-effect free.',
  GEN002: 'Stable component structure reduces runtime allocations and re-renders.',
  GEN003: 'Generatable files should avoid domain type declarations inside view modules.',
  GEN004: 'Explicit props contracts are easier to transform reliably.',
  GEN005: 'Index signatures make generated contracts too loose and unpredictable.',
  GEN006: 'Conditional DSL nodes must keep a strict parent-child structure.',
  GEN007: "Generator targets should not depend on '@ui8kit/sdk' runtime APIs.",
  GEN008: 'Unknown type references reduce portability across generator targets.',
};

const ALLOWED_PRIMITIVES = new Set([
  'string',
  'number',
  'boolean',
  'any',
  'unknown',
  'never',
  'void',
  'object',
  'undefined',
  'null',
  'Array',
  'Record',
  'Partial',
  'Required',
  'Readonly',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'ReturnType',
  'Parameters',
  'ConstructorParameters',
  'InstanceType',
  'Promise',
  'ReactNode',
  'ReactElement',
  'JSX',
  'ComponentProps',
  'MouseEventHandler',
  'HTMLElement',
]);

export class GenLintChecker extends BaseChecker<GenLintCheckerConfig> {
  private readonly scanner = new FileScanner();

  constructor() {
    super('gen-lint', 'Validate generator lint rules for DSL TSX files', 'genLint');
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const files = new Map<string, { path: string; read: () => string }>();
    for (const scopePath of config.scope) {
      const scanned = this.scanner.scan(context.root, config.pattern, {
        cwd: scopePath,
        useCache: true,
      });
      for (const file of scanned) {
        files.set(file.path, file);
      }
    }

    const ruleIssues: GenLintIssue[] = [];
    for (const file of files.values()) {
      ruleIssues.push(...this.lintFile(file.path, file.read(), context.root));
    }

    const issues: Issue[] = ruleIssues.map((issue) => {
      const severity = config.rules?.[issue.code] ?? DEFAULT_RULE_SEVERITY[issue.code];
      return this.createIssue(severity, issue.code, issue.message, {
        file: issue.file,
        line: issue.line,
        column: issue.column,
        hint: RULE_HINTS[issue.code],
        suggestion: RULE_SUGGESTIONS[issue.code],
      });
    });

    const errorCount = issues.filter((issue) => issue.level === 'error').length;
    return {
      success: errorCount === 0,
      issues,
      stats: {
        filesScanned: files.size,
        issues: issues.length,
        errorCount,
        warningCount: issues.filter((issue) => issue.level === 'warn').length,
      },
    };
  }

  private lintFile(filePath: string, source: string, root: string): GenLintIssue[] {
    const issues: GenLintIssue[] = [];
    const sourceFile = ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const importedFromTypes = new Set<string>();

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement)) {
        continue;
      }
      const importPath = statement.moduleSpecifier
        .getText(sourceFile)
        .replace(/^['"]|['"]$/g, '');

      if (importPath === '@ui8kit/sdk' || importPath.startsWith('@ui8kit/sdk/')) {
        this.addIssue(
          issues,
          sourceFile,
          statement,
          'GEN007',
          "Import from '@ui8kit/sdk' is not allowed in generatable files",
          root
        );
      }

      if (importPath === '@/types') {
        const clause = statement.importClause;
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const element of clause.namedBindings.elements) {
            importedFromTypes.add(element.name.text);
          }
        }
      }
    }

    const validatePropsType = (typeNode: ts.TypeNode, propsName: string, node: ts.Node): void => {
      if (ts.isTypeLiteralNode(typeNode)) {
        for (const member of typeNode.members) {
          if (ts.isIndexSignatureDeclaration(member)) {
            this.addIssue(
              issues,
              sourceFile,
              member,
              'GEN005',
              `Props '${propsName}' must not contain index signatures`,
              root
            );
          }
        }
      }

      const refs = new Set<string>();
      this.collectTypeReferences(typeNode, refs);
      for (const ref of refs) {
        if (ALLOWED_PRIMITIVES.has(ref) || importedFromTypes.has(ref)) {
          continue;
        }
        this.addIssue(
          issues,
          sourceFile,
          node,
          'GEN008',
          `Props '${propsName}' uses '${ref}', which should be primitive/inline or imported from '@/types'`,
          root
        );
      }
    };

    const inspectComponentBody = (
      fn: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction
    ): void => {
      const body = fn.body;
      if (!body || !ts.isBlock(body)) {
        return;
      }

      for (const statement of body.statements) {
        if (ts.isFunctionDeclaration(statement)) {
          this.addIssue(
            issues,
            sourceFile,
            statement,
            'GEN001',
            'Local function declarations are not allowed inside components',
            root
          );
        }
        if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
              this.addIssue(
                issues,
                sourceFile,
                declaration,
                'GEN002',
                'Arrow function constants are not allowed inside components',
                root
              );
            }
          }
        }
      }
    };

    const visit = (node: ts.Node): void => {
      if (ts.isTypeAliasDeclaration(node)) {
        const name = node.name.text;
        if (!name.endsWith('Props')) {
          this.addIssue(
            issues,
            sourceFile,
            node,
            'GEN003',
            `Local type '${name}' is not allowed (extract to '@/types')`,
            root
          );
        } else {
          validatePropsType(node.type, name, node);
        }
      }

      if (ts.isInterfaceDeclaration(node)) {
        const name = node.name.text;
        if (!name.endsWith('Props')) {
          this.addIssue(
            issues,
            sourceFile,
            node,
            'GEN003',
            `Local interface '${name}' is not allowed (extract to '@/types')`,
            root
          );
        } else {
          for (const member of node.members) {
            if (ts.isIndexSignatureDeclaration(member)) {
              this.addIssue(
                issues,
                sourceFile,
                member,
                'GEN005',
                `Props '${name}' must not contain index signatures`,
                root
              );
            }
          }

          const refs = new Set<string>();
          for (const member of node.members) {
            if (ts.isPropertySignature(member) && member.type) {
              this.collectTypeReferences(member.type, refs);
            }
          }
          for (const ref of refs) {
            if (ALLOWED_PRIMITIVES.has(ref) || importedFromTypes.has(ref)) {
              continue;
            }
            this.addIssue(
              issues,
              sourceFile,
              node,
              'GEN008',
              `Props '${name}' uses '${ref}', which should be primitive/inline or imported from '@/types'`,
              root
            );
          }
        }
      }

      if (ts.isFunctionDeclaration(node) && this.isExported(node)) {
        for (const param of node.parameters) {
          if (param.dotDotDotToken) {
            this.addIssue(
              issues,
              sourceFile,
              param,
              'GEN004',
              'Rest params are not allowed in component signatures',
              root
            );
          }
        }
        inspectComponentBody(node);
      }

      if (ts.isVariableStatement(node) && this.isExported(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (!declaration.initializer) {
            continue;
          }
          if (
            !ts.isArrowFunction(declaration.initializer) &&
            !ts.isFunctionExpression(declaration.initializer)
          ) {
            continue;
          }
          for (const param of declaration.initializer.parameters) {
            if (param.dotDotDotToken) {
              this.addIssue(
                issues,
                sourceFile,
                param,
                'GEN004',
                'Rest params are not allowed in component signatures',
                root
              );
            }
          }
          inspectComponentBody(declaration.initializer);
        }
      }

      if (ts.isJsxElement(node)) {
        const tagName = this.getJsxTagName(node.openingElement.tagName);
        if (tagName === 'Else' || tagName === 'ElseIf') {
          const parentJsx = ts.findAncestor(node.parent, (ancestor) =>
            ts.isJsxElement(ancestor)
          ) as ts.JsxElement | undefined;
          const parentTagName = parentJsx
            ? this.getJsxTagName(parentJsx.openingElement.tagName)
            : undefined;
          if (parentTagName !== 'If') {
            this.addIssue(
              issues,
              sourceFile,
              node,
              'GEN006',
              `<${tagName}> must be nested inside <If>, not a sibling`,
              root
            );
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return issues;
  }

  private addIssue(
    bucket: GenLintIssue[],
    sourceFile: ts.SourceFile,
    node: ts.Node,
    code: GenLintRuleCode,
    message: string,
    root: string
  ): void {
    const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    bucket.push({
      code,
      message,
      file: this.relative(root, sourceFile.fileName),
      line: location.line + 1,
      column: location.character + 1,
    });
  }

  private isExported(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) {
      return false;
    }
    const modifiers = ts.getModifiers(node);
    return Boolean(modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword));
  }

  private collectTypeReferences(node: ts.Node, output: Set<string>): void {
    const visit = (next: ts.Node): void => {
      if (ts.isTypeReferenceNode(next)) {
        if (ts.isIdentifier(next.typeName)) {
          output.add(next.typeName.text);
        } else if (ts.isQualifiedName(next.typeName)) {
          output.add(next.typeName.right.text);
        }
      }
      ts.forEachChild(next, visit);
    };
    visit(node);
  }

  private getJsxTagName(name: ts.JsxTagNameExpression): string | undefined {
    if (ts.isIdentifier(name)) {
      return name.text;
    }
    if (ts.isPropertyAccessExpression(name)) {
      return name.name.text;
    }
    return undefined;
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
