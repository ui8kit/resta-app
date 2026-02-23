#!/usr/bin/env bun
/**
 * Generate styles.css from HTML views via PostCSS + Tailwind.
 *
 * Run after: bun run generate:html
 *
 * Prerequisites:
 *   - dist/css/ — tailwind.apply.css, variants.apply.css
 *   - dist/html-views/ — HTML pages with actual classes
 *
 * Uses @source to scan HTML files for real class usage, then builds
 * a single styles.css with Tailwind processing.
 *
 * Output:
 *   - dist/html/css/styles.css (full CSS)
 *   - dist/html/css/unused.css (UnCSS trimmed, used-only)
 */

import { resolve, dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DIST_CSS = resolve(ROOT, 'dist', 'css');
const DIST_HTML_VIEWS = resolve(ROOT, 'dist', 'html-views');
const DIST_HTML_CSS = resolve(ROOT, 'dist', 'html', 'css');
const ENTRY_CSS = resolve(DIST_CSS, 'entry.css');
const OUTPUT_CSS = resolve(DIST_HTML_CSS, 'styles.css');
const UNUSED_CSS = resolve(DIST_HTML_CSS, 'unused.css');

const ENTRY_CONTENT = `/* Auto-generated entry for PostCSS. Do not edit. */
@import "tailwindcss";

/* Design tokens and base styles */
@import "../../src/assets/css/shadcn.css";

/* Scan HTML views for actual class usage */
@source "../html-views";
`;

const DIST_HTML = resolve(ROOT, 'dist', 'html');

/** Convert path to file:// URL for uncss (fixes Windows drive letters) */
function toFileUrl(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
}

/** Collect all .html files under dir recursively */
function collectHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

async function main(): Promise<void> {
  console.log('\n  UI8Kit — Generate styles.css via PostCSS\n');
  console.log('  ─────────────────────────────────────────────────────\n');

  if (!existsSync(resolve(DIST_CSS, 'tailwind.apply.css'))) {
    console.error('  dist/css/tailwind.apply.css not found.');
    console.error('  Run: bun run generate:html');
    process.exit(1);
  }

  if (!existsSync(DIST_HTML_VIEWS)) {
    console.error('  dist/html-views/ not found.');
    console.error('  Run: bun run generate:html');
    process.exit(1);
  }

  // Write entry CSS
  mkdirSync(DIST_CSS, { recursive: true });
  writeFileSync(ENTRY_CSS, ENTRY_CONTENT, 'utf-8');
  console.log('  ✓ Created entry:', 'dist/css/entry.css');

  // Ensure output dir exists
  mkdirSync(DIST_HTML_CSS, { recursive: true });

  // Run PostCSS with @tailwindcss/postcss
  const css = readFileSync(ENTRY_CSS, 'utf-8');
  const result = await postcss([tailwindPostcss()]).process(css, {
    from: ENTRY_CSS,
    to: OUTPUT_CSS,
  });
  writeFileSync(OUTPUT_CSS, result.css, 'utf-8');

  let size = statSync(OUTPUT_CSS).size;
  let sizeKb = (size / 1024).toFixed(1);
  console.log('  ✓ Generated:', 'dist/html/css/styles.css', `(${sizeKb} KB)`);

  // UnCSS: input styles.css, output unused.css (trimmed, used-only)
  const htmlFiles = collectHtmlFiles(DIST_HTML);
  if (htmlFiles.length > 0) {
    try {
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      const uncss = require('uncss');
      // Relative paths from cwd (script runs from ROOT), file:// for stylesheets per uncss docs
      const htmlPaths = htmlFiles.map((f) => f.slice(ROOT.length).replace(/\\/g, '/').replace(/^\//, ''));
      const optimized = await new Promise<string>((res, rej) => {
        uncss(
          htmlPaths,
          {
            stylesheets: [toFileUrl(OUTPUT_CSS)],
            media: true,
            timeout: 15000,
          },
          (err: Error | null, out: string) => (err ? rej(err) : res(out))
        );
      });
      writeFileSync(UNUSED_CSS, optimized, 'utf-8');
      const unusedSize = statSync(UNUSED_CSS).size;
      const unusedKb = (unusedSize / 1024).toFixed(1);
      console.log('  ✓ UnCSS → dist/html/css/unused.css', `(${unusedKb} KB)`);
    } catch (err) {
      console.warn('  ⚠ UnCSS failed:', err instanceof Error ? err.message : err);
    }
  }

  console.log('\n  Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
