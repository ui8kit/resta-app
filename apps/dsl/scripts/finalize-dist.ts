#!/usr/bin/env bun
/**
 * Finalize apps/react into a standalone runnable Vite app.
 *
 * Run after `bun run generate`:
 *   bun run scripts/finalize-dist.ts
 *   bun run finalize
 *
 * Or run both steps at once:
 *   bun run dist:app
 *
 * What this does:
 *   1. Moves generated blocks/layouts/partials from apps/react/ into apps/react/src/
 *   2. Fixes MainLayout.tsx (generator emits `any` for spread props — replace with ComponentProps)
 *   3. Generates index.ts for blocks, layouts, partials
 *   4. Copies app shell: components, variants, lib, css, routes, providers, data
 *   5. Generates design support files (design/previews, design/fixtures) — DSL-transformed via generator
 *   6. Copies fixtures/ into apps/react/fixtures/
 *   7. Generates project config: package.json, vite.config.ts, tsconfig.json,
 *      postcss.config.js, index.html
 *
 * Result: apps/react/ is a self-contained Vite+React app with real context data,
 * no DSL components (If/Var/Loop replaced with plain React), ready to run with:
 *   cd apps/react && bun install && bun run dev
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { dirname, extname, join, relative } from "path";
import { fileURLToPath } from "url";
import { transformJsxFile } from "../../../packages/generator/src/transformer/transform";
import { ReactPlugin } from "../../../packages/generator/src/plugins/template/built-in/ReactPlugin";
import { getFallbackCoreComponents } from "../../../packages/generator/src/core/scanner/core-component-scanner";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST_REACT = join(ROOT, "..", "react");
const SRC = join(ROOT, "src");
const FIXTURES = join(ROOT, "fixtures");

function log(msg: string): void {
  console.log(`  ${msg}`);
}

function writeFile(targetPath: string, content: string): void {
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, "utf-8");
  log(`+ ${relative(ROOT, targetPath).replace(/\\/g, "/")}`);
}

function copyFile(src: string, dest: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  log(`+ ${relative(ROOT, dest).replace(/\\/g, "/")}`);
}

function copyDir(srcDir: string, destDir: string, skip?: (name: string) => boolean): void {
  if (!existsSync(srcDir)) return;
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    if (skip && skip(entry.name)) continue;
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    entry.isDirectory() ? copyDir(src, dest, skip) : copyFile(src, dest);
  }
}


function moveDir(srcDir: string, destDir: string): void {
  copyDir(srcDir, destDir);
  rmSync(srcDir, { recursive: true, force: true });
}

/** Recursively list exportable files (supports subdirs like blocks/landing/PageView) */
function listExportableFiles(dir: string, baseDir = dir): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(baseDir, fullPath).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      results.push(...listExportableFiles(fullPath, baseDir));
    } else if (
      (extname(entry.name) === ".tsx" || extname(entry.name) === ".ts") &&
      entry.name !== "index.ts"
    ) {
      results.push(relPath.replace(/\.(tsx|ts)$/, ""));
    }
  }
  return results.sort();
}

function generateExportsIndex(names: string[]): string {
  return names.map((n) => `export * from './${n}';`).join("\n") + "\n";
}

async function main(): Promise<void> {
  console.log("\n  UI8Kit — Finalize apps/react\n");
  console.log("  ─────────────────────────────\n");

  if (!existsSync(DIST_REACT)) {
    console.error("  apps/react/ not found. Run: bun run generate");
    process.exit(1);
  }

  const distSrc = join(DIST_REACT, "src");
  const hasRootBlocks = existsSync(join(DIST_REACT, "blocks"));
  const hasRootLayouts = existsSync(join(DIST_REACT, "layouts"));
  const hasSrcBlocks = existsSync(join(distSrc, "blocks"));
  const hasSrcLayouts = existsSync(join(distSrc, "layouts"));

  const hasLegacyRootLayout = hasRootBlocks && hasRootLayouts;
  const hasModernSrcLayout = hasSrcBlocks && hasSrcLayouts;
  if (!hasLegacyRootLayout && !hasModernSrcLayout) {
    console.error("  Generated blocks/layouts not found in apps/react or apps/react/src. Run: bun run generate");
    process.exit(1);
  }

  // Step 1: Move generated dirs into src/
  console.log("  [1/7] Reorganizing generated files into src/...\n");

  for (const dir of ["blocks", "layouts", "partials"]) {
    const from = join(DIST_REACT, dir);
    const to = join(distSrc, dir);
    if (existsSync(from)) {
      if (existsSync(to)) rmSync(to, { recursive: true, force: true });
      moveDir(from, to);
      log(`moved: apps/react/${dir} → apps/react/src/${dir}`);
    } else if (existsSync(to)) {
      log(`using existing: apps/react/src/${dir}`);
    }
  }
  // Step 2: Normalize generated layout typing (legacy fallback)
  console.log("\n  [2/7] Fixing generated layouts...\n");

  const mainLayoutPath = join(distSrc, "layouts", "MainLayout.tsx");
  if (existsSync(mainLayoutPath)) {
    const content = readFileSync(mainLayoutPath, "utf-8");
    if (content.includes("export function MainLayout(props: any)")) {
      let fixed = content.replace(
        "export function MainLayout(props: any)",
        "export function MainLayout(props: ComponentProps<typeof MainLayoutView>)"
      );
      if (!fixed.includes("import type { ComponentProps } from 'react';")) {
        fixed = fixed.replace(
          "import { MainLayoutView } from './views/MainLayoutView';",
          "import type { ComponentProps } from 'react';\nimport { MainLayoutView } from './views/MainLayoutView';"
        );
      }
      writeFile(mainLayoutPath, fixed);
      log("fixed: layouts/MainLayout.tsx (props any → ComponentProps<typeof MainLayoutView>)");
    }
  }

  // Step 3: Generate index.ts for blocks, layouts, partials
  console.log("\n  [3/7] Generating index files...\n");

  const blockNames = listExportableFiles(join(distSrc, "blocks"));
  writeFile(join(distSrc, "blocks", "index.ts"), generateExportsIndex(blockNames));

  const layoutNames = listExportableFiles(join(distSrc, "layouts"));
  writeFile(join(distSrc, "layouts", "index.ts"), generateExportsIndex(layoutNames));

  // Use src/partials/index.ts as the source of truth (re-exports with types)
  const partialsIndexSrc = join(SRC, "partials", "index.ts");
  if (existsSync(partialsIndexSrc)) {
    writeFile(join(distSrc, "partials", "index.ts"), readFileSync(partialsIndexSrc, "utf-8"));
  } else {
    const partialNames = listExportableFiles(join(distSrc, "partials"));
    writeFile(join(distSrc, "partials", "index.ts"), generateExportsIndex(partialNames));
  }

  // Step 4: Copy app shell from src/
  console.log("\n  [4/7] Copying app shell...\n");

  for (const dir of ["components", "variants", "lib", "routes", "providers", "hooks", "constants", "types"]) {
    copyDir(join(SRC, dir), join(distSrc, dir));
  }

  // Some copied app-shell components still use DSL. Re-generate them to keep dist DSL-free.
  const shellDslCandidates = [
    { src: join(SRC, "components", "Sheet.tsx"), dest: join(distSrc, "components", "Sheet.tsx") },
    { src: join(SRC, "components", "ui", "Icon.tsx"), dest: join(distSrc, "components", "ui", "Icon.tsx") },
  ];
  const shellPassthrough = getFallbackCoreComponents();
  const shellPlugin = new ReactPlugin();
  for (const file of shellDslCandidates) {
    if (!existsSync(file.src)) continue;
    const componentName = file.src.split(/[/\\]/).pop()!.replace(/\.tsx$/, "");
    const transformed = await transformJsxFile(file.src, { passthroughComponents: shellPassthrough, componentName });
    if (transformed.errors.length > 0 || transformed.tree.children.length === 0) continue;
    if (transformed.tree.meta?.imports) {
      transformed.tree.meta.imports = transformed.tree.meta.imports.filter((imp) => imp.source !== "@ui8kit/dsl");
    }
    const output = await shellPlugin.transform(transformed.tree);
    writeFile(file.dest, output.content);
    log(`transformed: ${relative(distSrc, file.dest).replace(/\\/g, "/")} (removed DSL)`);
  }
  // Keep DSL imports in shell files when transform fallback copies source as-is.
  // These files are transformed above when possible; otherwise runtime DSL imports are required.

  // Assets (CSS, fonts) — @/assets/css/index.css etc.
  copyDir(join(SRC, "assets"), join(distSrc, "assets"));

  // App shell root files
  for (const file of ["App.tsx", "main.tsx", "ui8kit.map.json"]) {
    const src = join(SRC, file);
    if (existsSync(src)) copyFile(src, join(distSrc, file));
  }

  // data/context.ts — relative fixture paths (../../fixtures/) are identical
  const dataSrc = join(SRC, "data");
  const dataDest = join(distSrc, "data");
  copyDir(dataSrc, dataDest);

  // Step 5: Generate design support files (previews, fixtures) — they use DSL so we transform them
  console.log("\n  [5/7] Generating design support files...\n");
  const passthroughComponents = getFallbackCoreComponents();
  const plugin = new ReactPlugin();
  // Design sub-directories that contain DSL helpers (not in main registry)
  const designSupportDirs = [
    { src: join(SRC, "blocks", "design", "previews"), dest: join(distSrc, "blocks", "design", "previews") },
  ];
  for (const { src: supportSrc, dest: supportDest } of designSupportDirs) {
    if (!existsSync(supportSrc)) continue;
    mkdirSync(supportDest, { recursive: true });
    for (const entry of readdirSync(supportSrc, { withFileTypes: true })) {
      const srcFile = join(supportSrc, entry.name);
      const destFile = join(supportDest, entry.name);
      if (entry.isDirectory()) continue;
      if (extname(entry.name) === ".ts" && entry.name !== "index.ts") {
        // Non-JSX TypeScript helper — copy as-is (no DSL)
        copyFile(srcFile, destFile);
        continue;
      }
      if (extname(entry.name) === ".ts" && entry.name === "index.ts") {
        // index.ts barrel — copy as-is
        copyFile(srcFile, destFile);
        continue;
      }
      if (extname(entry.name) === ".tsx") {
        const componentName = entry.name.replace(/\.tsx$/, "");
        const transformResult = await transformJsxFile(srcFile, { passthroughComponents, componentName });
        if (transformResult.errors.length === 0 && transformResult.tree.children.length > 0) {
          // Exclude DSL imports before generating output (same as TemplateService excludeDependencies)
          if (transformResult.tree.meta?.imports) {
            transformResult.tree.meta.imports = transformResult.tree.meta.imports.filter(
              (imp) => !["@ui8kit/dsl"].includes(imp.source)
            );
          }
          const output = await plugin.transform(transformResult.tree);
          writeFile(destFile, output.content);
        } else {
          // Fallback: copy as-is (may contain DSL — acceptable for design-only files)
          copyFile(srcFile, destFile);
          log(`warn: could not transform ${entry.name} (${transformResult.errors.join("; ")}), copied as-is`);
        }
      }
    }
  }

  // Design fixtures (plain TS data, no DSL)
  const designFixturesSrc = join(SRC, "blocks", "design", "fixtures");
  const designFixturesDest = join(distSrc, "blocks", "design", "fixtures");
  if (existsSync(designFixturesSrc)) copyDir(designFixturesSrc, designFixturesDest);

  // Step 6: Copy fixtures/
  console.log("\n  [6/7] Copying fixtures...\n");
  copyDir(FIXTURES, join(DIST_REACT, "fixtures"));

  // Step 7: Generate project config files
  console.log("\n  [7/7] Generating project config files...\n");

  const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as {
    name: string;
    version: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  // package.json
  writeFile(
    join(DIST_REACT, "package.json"),
    JSON.stringify(
      {
        name: `${rootPkg.name}-dist`,
        version: rootPkg.version,
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          typecheck: "tsc --noEmit",
          preview: "vite preview",
          "generate:html": "ui8kit-generate html --cwd . --config dist.config.json",
          "generate:styles": "ui8kit-generate styles --cwd . --config dist.config.json",
          "generate:static": "ui8kit-generate static --cwd . --config dist.config.json",
        },
        // Exclude dev/build-only packages that are not needed at runtime in dist
        dependencies: Object.fromEntries(
          Object.entries(rootPkg.dependencies).filter(([pkg]) =>
            !['@ui8kit/dsl', '@ui8kit/generator', '@ui8kit/lint', '@ui8kit/sdk', '@ui8kit/contracts'].includes(pkg) &&
            !pkg.startsWith('file:')
          )
        ),
        devDependencies: {
          "@ui8kit/generator": "workspace:*",
          "@tailwindcss/postcss": rootPkg.devDependencies["@tailwindcss/postcss"],
          "@types/react": rootPkg.devDependencies["@types/react"],
          "@types/react-dom": rootPkg.devDependencies["@types/react-dom"],
          "@types/node": rootPkg.devDependencies["@types/node"],
          "@vitejs/plugin-react-swc": rootPkg.devDependencies["@vitejs/plugin-react-swc"],
          postcss: rootPkg.devDependencies["postcss"],
          tailwindcss: rootPkg.devDependencies["tailwindcss"],
          typescript: rootPkg.devDependencies["typescript"],
          vite: rootPkg.devDependencies["vite"],
        },
      },
      null,
      2
    ) + "\n"
  );

  // vite.config.ts
  writeFile(
    join(DIST_REACT, "vite.config.ts"),
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3021,
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      '@ui8kit/core': path.resolve(process.cwd(), './src/components/index.ts'),
    },
  },
});
`
  );

  // tsconfig.json
  writeFile(
    join(DIST_REACT, "tsconfig.json"),
    `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@ui8kit/core": ["src/components/index.ts"]
    }
  },
  "include": ["src"]
}
`
  );

  // postcss.config.js
  writeFile(
    join(DIST_REACT, "postcss.config.js"),
    `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`
  );

  // index.html (copy from project root)
  copyFile(join(ROOT, "index.html"), join(DIST_REACT, "index.html"));

  // Keep _temp/ with registry.json.
  // It is required by generator SSR commands (generate:html/generate:static)
  // when they run after finalize.

  console.log(`
  ─────────────────────────────
  Done. Standalone app is ready.

  To run:
    cd apps/react
    bun install
    bun run dev       → http://localhost:3021

  Structure:
    apps/react/
    ├── src/
    │   ├── blocks/       ← generated (no DSL)
    │   ├── layouts/      ← generated
    │   ├── partials/     ← generated
    │   ├── components/   ← @ui8kit/core alias
    │   ├── routes/       ← real routes with context data
    │   ├── providers/    ← ThemeProvider, AdminAuthProvider
    │   ├── data/         ← context.ts (real fixtures)
    │   ├── css/          ← Tailwind + shadcn
    │   └── variants/     ← CVA configs
    ├── fixtures/         ← JSON data
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── index.html
`);
}

main().catch((err) => { console.error(err); process.exit(1); });
