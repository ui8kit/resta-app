#!/usr/bin/env bun
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

type Issue = {
  code: string;
  message: string;
  file: string;
  line: number;
};

const ROOT = join(import.meta.dir, '..');
const TARGET_DIRS = ['src/blocks', 'src/partials', 'src/layouts'];
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

function getTsxFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getTsxFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineFor(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function addIssue(issues: Issue[], sourceFile: ts.SourceFile, node: ts.Node, code: string, message: string) {
  issues.push({
    code,
    message,
    file: relative(ROOT, sourceFile.fileName).replace(/\\/g, '/'),
    line: lineFor(sourceFile, node),
  });
}

function isExported(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  return !!modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
}

function getJsxTagName(name: ts.JsxTagNameExpression): string | null {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isPropertyAccessExpression(name)) return name.name.text;
  return null;
}

function collectTypeReferences(node: ts.Node, output: Set<string>) {
  function visit(n: ts.Node) {
    if (ts.isTypeReferenceNode(n)) {
      if (ts.isIdentifier(n.typeName)) {
        output.add(n.typeName.text);
      } else if (ts.isQualifiedName(n.typeName)) {
        output.add(n.typeName.right.text);
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(node);
}

function lintFile(filePath: string): Issue[] {
  const issues: Issue[] = [];
  const source = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const importedFromTypes = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const importPath = statement.moduleSpecifier.getText(sourceFile).slice(1, -1);

      if (importPath === '@ui8kit/sdk' || importPath.startsWith('@ui8kit/sdk/')) {
        addIssue(issues, sourceFile, statement, 'GEN007', "Import from '@ui8kit/sdk' is not allowed in generatable files");
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
  }

  function validatePropsType(typeNode: ts.TypeNode, propsName: string, containerNode: ts.Node) {
    if (ts.isTypeLiteralNode(typeNode)) {
      for (const member of typeNode.members) {
        if (ts.isIndexSignatureDeclaration(member)) {
          addIssue(issues, sourceFile, member, 'GEN005', `Props '${propsName}' must not contain index signatures`);
        }
      }
    }

    const refs = new Set<string>();
    collectTypeReferences(typeNode, refs);
    for (const ref of refs) {
      if (ALLOWED_PRIMITIVES.has(ref)) continue;
      if (importedFromTypes.has(ref)) continue;
      addIssue(
        issues,
        sourceFile,
        containerNode,
        'GEN008',
        `Props '${propsName}' uses '${ref}', which should be primitive/inline or imported from '@/types'`
      );
    }
  }

  function inspectComponentBody(fn: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction) {
    const body = fn.body;
    if (!body || !ts.isBlock(body)) return;

    for (const statement of body.statements) {
      if (ts.isFunctionDeclaration(statement)) {
        addIssue(issues, sourceFile, statement, 'GEN001', 'Local function declarations are not allowed inside components');
      }
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
            addIssue(issues, sourceFile, declaration, 'GEN002', 'Arrow function constants are not allowed inside components');
          }
        }
      }
    }
  }

  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node)) {
      const name = node.name.text;
      if (!name.endsWith('Props')) {
        addIssue(issues, sourceFile, node, 'GEN003', `Local type '${name}' is not allowed (extract to '@/types')`);
      } else {
        validatePropsType(node.type, name, node);
      }
    }

    if (ts.isInterfaceDeclaration(node)) {
      const name = node.name.text;
      if (!name.endsWith('Props')) {
        addIssue(issues, sourceFile, node, 'GEN003', `Local interface '${name}' is not allowed (extract to '@/types')`);
      } else {
        for (const member of node.members) {
          if (ts.isIndexSignatureDeclaration(member)) {
            addIssue(issues, sourceFile, member, 'GEN005', `Props '${name}' must not contain index signatures`);
          }
        }
        const refs = new Set<string>();
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && member.type) {
            collectTypeReferences(member.type, refs);
          }
        }
        for (const ref of refs) {
          if (ALLOWED_PRIMITIVES.has(ref)) continue;
          if (importedFromTypes.has(ref)) continue;
          addIssue(
            issues,
            sourceFile,
            node,
            'GEN008',
            `Props '${name}' uses '${ref}', which should be primitive/inline or imported from '@/types'`
          );
        }
      }
    }

    if (ts.isFunctionDeclaration(node) && isExported(node)) {
      for (const param of node.parameters) {
        if (param.dotDotDotToken) {
          addIssue(issues, sourceFile, param, 'GEN004', 'Rest params are not allowed in component signatures');
        }
      }
      inspectComponentBody(node);
    }

    if (ts.isVariableStatement(node) && isExported(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!declaration.initializer) continue;
        if (!ts.isArrowFunction(declaration.initializer) && !ts.isFunctionExpression(declaration.initializer)) continue;
        for (const param of declaration.initializer.parameters) {
          if (param.dotDotDotToken) {
            addIssue(issues, sourceFile, param, 'GEN004', 'Rest params are not allowed in component signatures');
          }
        }
        inspectComponentBody(declaration.initializer);
      }
    }

    if (ts.isJsxElement(node)) {
      const tagName = getJsxTagName(node.openingElement.tagName);
      if (tagName === 'Else' || tagName === 'ElseIf') {
        const parentJsx = ts.findAncestor(node.parent, (ancestor) => ts.isJsxElement(ancestor)) as ts.JsxElement | undefined;
        const parentTagName = parentJsx ? getJsxTagName(parentJsx.openingElement.tagName) : null;
        if (parentTagName !== 'If') {
          addIssue(issues, sourceFile, node, 'GEN006', `<${tagName}> must be nested inside <If>, not a sibling`);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}

function main() {
  const files = TARGET_DIRS.flatMap((dir) => getTsxFiles(join(ROOT, dir)));
  const issues = files.flatMap((file) => lintFile(file));

  if (issues.length === 0) {
    console.log('lint:gen passed');
    return;
  }

  for (const issue of issues) {
    console.error(`${issue.file}:${issue.line} [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

main();
