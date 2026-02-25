#!/usr/bin/env bun
/**
 * Validate architectural invariants for the standalone resta-app.
 *
 * Checks:
 *   1. fixtures/shared/page.json — has website and admin arrays
 *   2. src/App.tsx — routes match page.json entries
 *   3. Route files — each route component has a file in src/routes/
 *   4. src/blocks/index.ts — all .tsx files in src/blocks/ are exported
 *   5. src/data/context.ts — all fixture JSON files referenced actually exist
 *   6. ../react/ — generated blocks/layouts/partials exist (if app is generated)
 *
 * Usage:
 *   bun run scripts/validate-invariants.ts
 *   bun run validate:invariants
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, extname, join, relative } from "path";
import { fileURLToPath } from "url";

interface CheckIssue {
  level: "error" | "warn";
  code: string;
  message: string;
  path?: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const reportsDir = join(ROOT, ".cursor", "reports");

function readText(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

function addIssue(issues: CheckIssue[], issue: CheckIssue): void {
  issues.push(issue);
}

function extractRouteComponents(appContent: string): string[] {
  const matches = [...appContent.matchAll(/element=\{<(\w+)\s*\//g)];
  return matches.map((m) => m[1]!);
}

function extractRoutes(appContent: string): string[] {
  const matches = [...appContent.matchAll(/path="([^"]+)"/g)];
  return matches.map((m) => m[1]!);
}

function extractFixtureImports(contextContent: string): string[] {
  const matches = [...contextContent.matchAll(/from ['"]([^'"]*fixtures[^'"]*\.json)['"]/g)];
  return matches.map((m) => m[1]!);
}

function listBlockFiles(blocksDir: string): string[] {
  if (!existsSync(blocksDir)) return [];
  return readdirSync(blocksDir, { withFileTypes: true })
    .filter((e) => e.isFile() && extname(e.name) === ".tsx")
    .map((e) => e.name.replace(".tsx", ""));
}

async function main(): Promise<void> {
  const issues: CheckIssue[] = [];
  const runId = `invariants_${Date.now()}`;

  // ── 1. fixtures/shared/page.json ─────────────────────────────────────────
  const pageFixturePath = "fixtures/shared/page.json";
  if (!existsSync(join(ROOT, pageFixturePath))) {
    addIssue(issues, {
      level: "error",
      code: "PAGE_FIXTURE_MISSING",
      message: "fixtures/shared/page.json does not exist.",
      path: pageFixturePath,
    });
  } else {
    const pageFixture = JSON.parse(readText(pageFixturePath)) as {
      page?: { website?: unknown[]; admin?: unknown[] };
    };

    if (!pageFixture.page) {
      addIssue(issues, { level: "error", code: "PAGE_FIXTURE_NO_PAGE_KEY", message: "page.json missing top-level 'page' key.", path: pageFixturePath });
    } else {
      if (!Array.isArray(pageFixture.page.website)) {
        addIssue(issues, { level: "error", code: "PAGE_WEBSITE_MISSING", message: "page.json missing 'page.website' array.", path: pageFixturePath });
      }
      if (!Array.isArray(pageFixture.page.admin)) {
        addIssue(issues, { level: "error", code: "PAGE_ADMIN_MISSING", message: "page.json missing 'page.admin' array.", path: pageFixturePath });
      }
    }
  }

  // ── 2. src/App.tsx ───────────────────────────────────────────────────────
  const appPath = "src/App.tsx";
  if (!existsSync(join(ROOT, appPath))) {
    addIssue(issues, { level: "error", code: "APP_MISSING", message: "src/App.tsx does not exist.", path: appPath });
  } else {
    const appContent = readText(appPath);
    const routePaths = extractRoutes(appContent);
    const routeComponents = extractRouteComponents(appContent);

    if (routePaths.length === 0) {
      addIssue(issues, { level: "error", code: "APP_NO_ROUTES", message: "src/App.tsx has no <Route> entries.", path: appPath });
    }

    // Required routes for resta-app
    const requiredRoutes = ["/", "/menu", "/menu/:slug", "/recipes", "/recipes/:slug", "/blog", "/blog/:slug", "/promotions", "/promotions/:slug", "/admin", "/admin/dashboard"];
    for (const route of requiredRoutes) {
      if (!routePaths.includes(route)) {
        addIssue(issues, { level: "error", code: "ROUTE_MISSING", message: `Required route not wired in App.tsx: ${route}`, path: appPath });
      }
    }

    // ── 3. Route files exist ──────────────────────────────────────────────
    for (const component of routeComponents) {
      const routeFile = `src/routes/${component}.tsx`;
      if (!existsSync(join(ROOT, routeFile))) {
        addIssue(issues, { level: "error", code: "ROUTE_FILE_MISSING", message: `Route component file missing: ${routeFile}`, path: routeFile });
      }
    }
  }

  // ── 4. src/blocks/index.ts exports ───────────────────────────────────────
  const blocksDir = join(ROOT, "src", "blocks");
  const blocksIndexPath = "src/blocks/index.ts";
  if (!existsSync(join(ROOT, blocksIndexPath))) {
    addIssue(issues, { level: "error", code: "BLOCKS_INDEX_MISSING", message: "src/blocks/index.ts does not exist.", path: blocksIndexPath });
  } else {
    const indexContent = readText(blocksIndexPath);
    const blockFiles = listBlockFiles(blocksDir);
    for (const name of blockFiles) {
      if (!indexContent.includes(name)) {
        addIssue(issues, { level: "warn", code: "BLOCK_NOT_EXPORTED", message: `Block not exported from index.ts: ${name}`, path: blocksIndexPath });
      }
    }
  }

  // ── 5. context.ts fixture imports ────────────────────────────────────────
  const contextPath = "src/data/context.ts";
  if (!existsSync(join(ROOT, contextPath))) {
    addIssue(issues, { level: "error", code: "CONTEXT_MISSING", message: "src/data/context.ts does not exist.", path: contextPath });
  } else {
    const contextContent = readText(contextPath);
    const fixtureImports = extractFixtureImports(contextContent);
    for (const importPath of fixtureImports) {
      // Resolve relative to src/data/
      const resolved = join(ROOT, "src", "data", importPath);
      if (!existsSync(resolved)) {
        addIssue(issues, { level: "error", code: "FIXTURE_IMPORT_MISSING", message: `Fixture referenced in context.ts not found: ${importPath}`, path: contextPath });
      }
    }

    // Check required context exports
    const requiredSymbols = ["context", "navItems", "sidebarLinks", "adminSidebarLinks"];
    for (const sym of requiredSymbols) {
      if (!contextContent.includes(sym)) {
        addIssue(issues, { level: "warn", code: "CONTEXT_SYMBOL_MISSING", message: `Expected symbol not found in context.ts: ${sym}`, path: contextPath });
      }
    }
  }

  // ── 6. ../react/ generated structure ──────────────────────────────────────
  const distReact = join(ROOT, "..", "react");
  if (existsSync(distReact)) {
    const distSrc = join(distReact, "src");
    const hasSrc = existsSync(distSrc);
    const baseDir = hasSrc ? distSrc : distReact;

    for (const dir of ["blocks", "layouts", "partials"]) {
      if (!existsSync(join(baseDir, dir))) {
        addIssue(issues, {
          level: "warn",
          code: `DIST_${dir.toUpperCase()}_MISSING`,
          message: `apps/react/${hasSrc ? "src/" : ""}${dir}/ not found — run: bun run generate`,
        });
      }
    }

    if (!existsSync(join(distReact, "package.json"))) {
      addIssue(issues, {
        level: "warn",
        code: "DIST_NOT_FINALIZED",
        message: "apps/react/package.json missing — regenerate apps/react output",
      });
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  mkdirSync(reportsDir, { recursive: true });
  const reportPath = join(reportsDir, `invariants-${runId}.json`);
  const report = {
    runId,
    generatedAt: new Date().toISOString(),
    errors: issues.filter((i) => i.level === "error"),
    warnings: issues.filter((i) => i.level === "warn"),
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`\nInvariant report: ${relative(ROOT, reportPath).replace(/\\/g, "/")}`);
  console.log(`Errors:   ${report.errors.length}`);
  console.log(`Warnings: ${report.warnings.length}`);

  if (report.errors.length > 0) {
    console.log("");
    for (const issue of report.errors) {
      console.error(`  [${issue.code}] ${issue.message}${issue.path ? ` (${issue.path})` : ""}`);
    }
    console.log("");
    process.exit(1);
  }

  if (report.warnings.length > 0) {
    console.log("");
    for (const issue of report.warnings) {
      console.warn(`  [${issue.code}] ${issue.message}${issue.path ? ` (${issue.path})` : ""}`);
    }
  }

  console.log("\nAll invariants OK.\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
