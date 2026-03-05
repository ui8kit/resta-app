#!/usr/bin/env bun
/**
 * @ui8kit/create-app — Scaffold a minimal Vite + React app.
 *
 * Usage:
 *   bunx @ui8kit/create-app my-app
 *   bunx @ui8kit/create-app my-app --template react
 *   bunx @ui8kit/create-app my-app --template react-resta
 *   bunx @ui8kit/create-app my-app -i
 *
 * Options:
 *   -t, --template NAME   template (default: react)
 *   -i, --immediate       install deps and run dev
 *   -h, --help            show help
 */

import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES: Record<string, string> = {
  react: 'template-react',
  'react-resta': 'template-react-resta',
};
const RENAME: Record<string, string> = { _gitignore: '.gitignore' };

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv: string[]): { target?: string; template?: string; immediate?: boolean; help?: boolean } {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') out.help = true;
    else if (arg === '-i' || arg === '--immediate') out.immediate = true;
    else if (arg === '-t' || arg === '--template') out.template = argv[++i] ?? 'react';
    else if (!arg.startsWith('-')) out.target = arg;
  }
  return out as { target?: string; template?: string; immediate?: boolean; help?: boolean };
}

function formatTargetDir(dir: string): string {
  return dir
    .trim()
    .replace(/[<>:"\\|?*]/g, '')
    .replace(/\/+$/g, '');
}

function toValidPackageName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-');
}

function copyDir(srcDir: string, destDir: string): void {
  if (!existsSync(srcDir)) return;
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else {
      const destName = RENAME[entry.name] ?? entry.name;
      const destPath = join(destDir, destName);
      copyFileSync(src, destPath);
    }
  }
}

function main(): void {
  if (args.help) {
    console.log(`
Usage: create-app [OPTION]... [DIRECTORY]

Create a new UI8Kit Vite + React app.

Options:
  -t, --template NAME   template (default: react)
  -i, --immediate       install deps and run dev
  -h, --help            show help

Examples:
  bunx @ui8kit/create-app my-app
  bunx @ui8kit/create-app my-app --template react -i
  bunx @ui8kit/create-app my-app --template react-resta
`);
    return;
  }

  const targetDir = args.target ? formatTargetDir(args.target) : 'my-app';
  const root = join(process.cwd(), targetDir);

  if (existsSync(root)) {
    const files = readdirSync(root).filter((f) => f !== '.git');
    if (files.length > 0) {
      console.error(`Error: Directory "${targetDir}" is not empty.`);
      process.exit(1);
    }
  }

  const packageName = toValidPackageName(targetDir);
  const template = args.template ?? 'react';
  const templateDir = TEMPLATES[template] ?? TEMPLATES.react;
  const srcDir = join(__dirname, '..', templateDir);

  if (!existsSync(srcDir)) {
    console.warn(`Template "${template}" not found, using "react".`);
  }

  console.log(`\n  Creating UI8Kit app in ${root}...\n`);

  copyDir(existsSync(srcDir) ? srcDir : join(__dirname, '..', TEMPLATES.react), root);

  const pkgPath = join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = packageName;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

  const indexHtmlPath = join(root, 'index.html');
  let html = readFileSync(indexHtmlPath, 'utf-8');
  html = html.replace(/<title>.*?<\/title>/, `<title>${packageName}</title>`);
  writeFileSync(indexHtmlPath, html, 'utf-8');

  if (args.immediate) {
    console.log(`  Installing and starting dev server...\n`);
    mkdirSync(root, { recursive: true });
    const install = spawn('bun', ['install'], { cwd: root, stdio: 'inherit' });
    install.on('close', (code: number) => {
      if (code === 0) spawn('bun', ['run', 'dev'], { cwd: root, stdio: 'inherit' });
    });
  } else {
    console.log(`  Done. Next steps:\n`);
    console.log(`  cd ${targetDir}`);
    console.log(`  bun install`);
    console.log(`  bun run dev`);
  }
  console.log('');
}

main();
