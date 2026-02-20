#!/usr/bin/env bun
/**
 * Sync _packages/generator/dist/ → node_modules/@ui8kit/generator/dist/
 * Ensures bunx ui8kit-generate picks up freshly built code.
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SRC = join(import.meta.dir, '..', '_packages', 'generator', 'dist');
const DEST = join(import.meta.dir, '..', 'node_modules', '@ui8kit', 'generator', 'dist');

function syncDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      syncDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

syncDir(SRC, DEST);
console.log('Synced generator dist to node_modules.');
