#!/usr/bin/env bun
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

type ExportIssue = {
  line: number;
  message: string;
};

const ROOT = join(import.meta.dir, '..');
const SRC_DIR = join(ROOT, 'src');

function listViewFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listViewFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('View.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function getLine(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const mods = ts.getModifiers(node);
  return !!mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function validateFile(filePath: string): ExportIssue[] {
  const source = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues: ExportIssue[] = [];

  let exportedInterfaces = 0;
  let exportedFunctions = 0;
  let totalExports = 0;

  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement) || (ts.isExportDeclaration(statement) && !statement.isTypeOnly)) {
      totalExports++;
      issues.push({
        line: getLine(sourceFile, statement),
        message: 'Unsupported export form. Use only `export interface` and `export function` in View files.',
      });
      continue;
    }

    if (!hasExportModifier(statement)) continue;
    totalExports++;

    if (ts.isInterfaceDeclaration(statement)) {
      exportedInterfaces++;
      continue;
    }

    if (ts.isFunctionDeclaration(statement)) {
      exportedFunctions++;
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      issues.push({
        line: getLine(sourceFile, statement),
        message:
          'Found `export type`. Move it to shared types (e.g. `src/types/`) or replace with `export interface` if appropriate.',
      });
      continue;
    }

    issues.push({
      line: getLine(sourceFile, statement),
      message:
        'Unexpected exported declaration. View files must export only one interface and one function.',
    });
  }

  if (totalExports !== 2 || exportedInterfaces !== 1 || exportedFunctions !== 1) {
    issues.push({
      line: 1,
      message:
        `Invalid export shape: expected exactly 2 exports (1 interface + 1 function), got ${totalExports} ` +
        `(interfaces: ${exportedInterfaces}, functions: ${exportedFunctions}).`,
    });
  }

  return issues;
}

function main() {
  const viewFiles = listViewFiles(SRC_DIR);
  let hasErrors = false;

  for (const file of viewFiles) {
    const issues = validateFile(file);
    if (issues.length === 0) continue;

    hasErrors = true;
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    console.error(`\n[FAIL] ${rel}`);
    for (const issue of issues) {
      console.error(`  L${issue.line}: ${issue.message}`);
    }
  }

  if (hasErrors) {
    console.error('\nView export validation failed.\n');
    process.exit(1);
  }

  console.log(`View export validation passed for ${viewFiles.length} file(s).`);
}

main();
