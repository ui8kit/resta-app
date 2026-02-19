#!/usr/bin/env bun
/**
 * Finalize dist/react into a standalone runnable Vite app.
 *
 * Run after `bun run generate`:
 *   bun run scripts/finalize-dist.ts
 *   bun run finalize
 *
 * Or run both steps at once:
 *   bun run dist:app
 *
 * What this does:
 *   1. Moves generated blocks/layouts/partials from dist/react/ into dist/react/src/
 *   2. Fixes MainLayout.tsx (generated without props parameter — known issue)
 *   3. Generates index.ts for blocks, layouts, partials
 *   4. Copies app shell: components, variants, lib, css, routes, providers, data
 *   5. Copies fixtures/ into dist/react/fixtures/
 *   6. Generates project config: package.json, vite.config.ts, tsconfig.json,
 *      postcss.config.js, index.html
 *
 * Result: dist/react/ is a self-contained Vite+React app with real context data,
 * no DSL components (If/Var/Loop replaced with plain React), ready to run with:
 *   cd dist/react && bun install && bun run dev
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST_REACT = join(ROOT, "dist", "react");
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

function listExportableFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && (extname(e.name) === ".tsx" || extname(e.name) === ".ts") && e.name !== "index.ts")
    .map((e) => e.name.replace(/\.(tsx|ts)$/, ""))
    .sort();
}

function generateExportsIndex(names: string[]): string {
  return names.map((n) => `export * from './${n}';`).join("\n") + "\n";
}

function main(): void {
  console.log("\n  UI8Kit — Finalize dist/react\n");
  console.log("  ─────────────────────────────\n");

  if (!existsSync(DIST_REACT)) {
    console.error("  dist/react/ not found. Run: bun run generate");
    process.exit(1);
  }

  const hasBlocks = existsSync(join(DIST_REACT, "blocks"));
  const hasLayouts = existsSync(join(DIST_REACT, "layouts"));
  if (!hasBlocks || !hasLayouts) {
    console.error("  dist/react/blocks/ or dist/react/layouts/ missing. Run: bun run generate");
    process.exit(1);
  }

  const distSrc = join(DIST_REACT, "src");

  // Step 1: Move generated dirs into src/
  console.log("  [1/6] Reorganizing generated files into src/...\n");

  for (const dir of ["blocks", "layouts", "partials"]) {
    const from = join(DIST_REACT, dir);
    const to = join(distSrc, dir);
    if (existsSync(to)) rmSync(to, { recursive: true, force: true });
    if (existsSync(from)) {
      moveDir(from, to);
      log(`moved: dist/react/${dir} → dist/react/src/${dir}`);
    }
  }

  // Step 2: Fix MainLayout.tsx (generated without props parameter)
  console.log("\n  [2/6] Fixing generated layouts...\n");

  const mainLayoutPath = join(distSrc, "layouts", "MainLayout.tsx");
  if (existsSync(mainLayoutPath)) {
    writeFile(
      mainLayoutPath,
      `import type { ComponentProps } from 'react';
import { MainLayoutView } from './views/MainLayoutView';

export type MainLayoutProps = ComponentProps<typeof MainLayoutView>;

export function MainLayout(props: MainLayoutProps) {
  return (
    <MainLayoutView {...props} />
  );
}
`
    );
  }

  // Step 3: Generate index.ts for blocks, layouts, partials
  console.log("\n  [3/6] Generating index files...\n");

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
  console.log("\n  [4/6] Copying app shell...\n");

  for (const dir of ["components", "variants", "lib", "routes", "providers"]) {
    copyDir(join(SRC, dir), join(distSrc, dir));
  }

  // CSS — copy as-is (relative @source paths work identically in dist/react/src/css/)
  copyDir(join(SRC, "css"), join(distSrc, "css"));

  // App shell root files
  for (const file of ["App.tsx", "main.tsx", "ui8kit.map.json"]) {
    const src = join(SRC, file);
    if (existsSync(src)) copyFile(src, join(distSrc, file));
  }

  // data/context.ts — relative fixture paths (../../fixtures/) are identical
  const dataSrc = join(SRC, "data");
  const dataDest = join(distSrc, "data");
  copyDir(dataSrc, dataDest);

  // Step 5: Copy fixtures/
  console.log("\n  [5/6] Copying fixtures...\n");
  copyDir(FIXTURES, join(DIST_REACT, "fixtures"));

  // Step 6: Generate project config files
  console.log("\n  [6/6] Generating project config files...\n");

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
          preview: "vite preview",
        },
        dependencies: rootPkg.dependencies,
        devDependencies: {
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
    "strict": true,
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

  // Remove _temp/ (registry metadata, not needed in the dist app)
  const tempDir = join(DIST_REACT, "_temp");
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
    log(`- dist/react/_temp (removed)`);
  }

  console.log(`
  ─────────────────────────────
  Done. Standalone app is ready.

  To run:
    cd dist/react
    bun install
    bun run dev       → http://localhost:3021

  Structure:
    dist/react/
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

main();
