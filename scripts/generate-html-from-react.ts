#!/usr/bin/env bun
/**
 * Generate clean HTML + CSS from dist/react (pure React, no Liquid).
 *
 * Run after: bun run dist:app
 *
 * Prerequisites:
 *   - dist/react/ must exist (run: bun run generate && bun run finalize)
 *   - dist/react/src/App.tsx must exist
 *
 * Output:
 *   - dist/html/pages/ — source page views for generator
 *   - dist/css/ — tailwind.apply.css, ui8kit.local.css, variants.apply.css
 *   - dist/html/ — final HTML pages (index.html, menu/index.html, menu/grill-salmon-steak/index.html, etc.)
 *
 * Single-item routes (e.g. GET /menu/grill-salmon-steak) are generated from fixtures
 * and output to subfolders: menu/grill-salmon-steak/index.html
 *
 * Note: Components that use React context (ThemeProvider, AdminAuthProvider, etc.)
 * may render empty during SSR. For full content, wrap routes in providers or use
 * SSR-safe component variants.
 */

import { generate } from '../_packages/generator/src/generate';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

const ROOT = resolve(import.meta.dir, '..');
const DIST_REACT = resolve(ROOT, 'dist', 'react');
const DIST_REACT_APP = resolve(DIST_REACT, 'src', 'App.tsx');
const DIST_HTML = resolve(ROOT, 'dist', 'html');
const FIXTURES = resolve(ROOT, 'fixtures');

const BASE_ROUTES: Record<string, { title: string }> = {
  '/': { title: 'Home' },
  '/menu': { title: 'Menu' },
  '/recipes': { title: 'Recipes' },
  '/blog': { title: 'Blog' },
  '/promotions': { title: 'Promotions' },
  '/admin': { title: 'Admin Login' },
  '/admin/dashboard': { title: 'Admin Dashboard' },
};

/** Load single-item routes from fixtures (menu/:id, recipes/:slug, blog/:slug, promotions/:id) */
function loadSingleItemRoutes(): Record<string, { title: string }> {
  const routes: Record<string, { title: string }> = {};

  const menuPath = resolve(FIXTURES, 'menu.json');
  if (existsSync(menuPath)) {
    const menu = JSON.parse(readFileSync(menuPath, 'utf-8'));
    for (const item of menu.items ?? []) {
      const id = item.id ?? item.slug;
      if (id) routes[`/menu/${id}`] = { title: item.title ?? id };
    }
  }

  const recipesPath = resolve(FIXTURES, 'recipes.json');
  if (existsSync(recipesPath)) {
    const recipes = JSON.parse(readFileSync(recipesPath, 'utf-8'));
    for (const item of recipes.items ?? []) {
      const slug = item.slug ?? item.id;
      if (slug) routes[`/recipes/${slug}`] = { title: item.title ?? slug };
    }
  }

  const blogPath = resolve(FIXTURES, 'blog.json');
  if (existsSync(blogPath)) {
    const blog = JSON.parse(readFileSync(blogPath, 'utf-8'));
    for (const post of blog.posts ?? []) {
      const slug = post.slug ?? post.id;
      if (slug) routes[`/blog/${slug}`] = { title: post.title ?? slug };
    }
  }

  const promotionsPath = resolve(FIXTURES, 'promotions.json');
  if (existsSync(promotionsPath)) {
    const promotions = JSON.parse(readFileSync(promotionsPath, 'utf-8'));
    for (const item of promotions.items ?? []) {
      const id = item.id ?? item.slug;
      if (id) routes[`/promotions/${id}`] = { title: item.title ?? id };
    }
  }

  return routes;
}

function buildRoutes(): Record<string, { title: string }> {
  const single = loadSingleItemRoutes();
  return { ...BASE_ROUTES, ...single };
}

async function main(): Promise<void> {
  console.log('\n  UI8Kit — Generate HTML+CSS from dist/react (no Liquid)\n');
  console.log('  ─────────────────────────────────────────────────────\n');

  const { existsSync } = await import('fs');
  if (!existsSync(DIST_REACT_APP)) {
    console.error('  dist/react/src/App.tsx not found.');
    console.error('  Run: bun run dist:app');
    process.exit(1);
  }

  const ROUTES = buildRoutes();
  const routeCount = Object.keys(ROUTES).length;
  const singleCount = routeCount - Object.keys(BASE_ROUTES).length;
  if (singleCount > 0) {
    console.log(`  Routes: ${routeCount} total (${singleCount} single-item from fixtures)\n`);
  }

  const result = await generate({
    app: { name: 'Resta App', lang: 'en' },
    css: {
      entryPath: DIST_REACT_APP,
      routes: Object.keys(ROUTES),
      outputDir: resolve(ROOT, 'dist', 'css'),
      pureCss: true,
    },
    html: {
      viewsDir: DIST_HTML,
      viewsPagesSubdir: 'pages',
      routes: ROUTES,
      outputDir: DIST_HTML,
      mode: 'tailwind',
    },
    mappings: {
      ui8kitMap: resolve(ROOT, 'src', 'lib', 'ui8kit.map.json'),
    },
  });

  if (!result.success) {
    console.error('\n  Generation failed:');
    for (const { stage, error } of result.errors) {
      console.error(`    [${stage}] ${error.message}`);
    }
    process.exit(1);
  }

  console.log('\n  Done.');
  console.log(`  Views: ${result.generated.views}, Partials: ${result.generated.partials}`);
  console.log(`  CSS files: ${result.generated.cssFiles}, HTML pages: ${result.generated.htmlPages}`);
  console.log(`  Output: dist/html/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
