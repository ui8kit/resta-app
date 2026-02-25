#!/usr/bin/env bun
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST_REACT = join(ROOT, '..', 'react-design');
const SRC = join(ROOT, 'src');
const FIXTURES = join(ROOT, 'fixtures');
const DSL_SRC = join(ROOT, '..', 'dsl', 'src');

function log(message: string): void {
  console.log(`  ${message}`);
}

function writeFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf-8');
  log(`+ ${relative(ROOT, path).replace(/\\/g, '/')}`);
}

function copyFile(source: string, target: string): void {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  log(`+ ${relative(ROOT, target).replace(/\\/g, '/')}`);
}

function copyDir(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) return;
  mkdirSync(targetDir, { recursive: true });
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const source = join(sourceDir, entry.name);
    const target = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, target);
    } else {
      copyFile(source, target);
    }
  }
}

function listExportableFiles(dir: string, baseDir = dir): string[] {
  if (!existsSync(dir)) return [];
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      result.push(...listExportableFiles(fullPath, baseDir));
      continue;
    }
    if ((extname(entry.name) === '.ts' || extname(entry.name) === '.tsx') && entry.name !== 'index.ts') {
      result.push(relPath.replace(/\.(ts|tsx)$/, ''));
    }
  }
  return result.sort();
}

function generateIndexExports(files: string[]): string {
  if (files.length === 0) return 'export {};\n';
  return files.map((file) => `export * from './${file}';`).join('\n') + '\n';
}

async function main(): Promise<void> {
  console.log('\n  UI8Kit — Finalize apps/react-design\n');
  console.log('  ───────────────────────────────────\n');

  if (!existsSync(DIST_REACT)) {
    console.error('  apps/react-design/ not found. Run: bun run generate');
    process.exit(1);
  }

  const distSrc = join(DIST_REACT, 'src');
  if (!existsSync(join(distSrc, 'blocks')) || !existsSync(join(distSrc, 'layouts'))) {
    console.error('  Generated blocks/layouts are missing in apps/react-design/src. Run: bun run generate');
    process.exit(1);
  }

  console.log('  [1/5] Generating indexes for generated folders...\n');
  for (const dir of ['blocks', 'layouts', 'partials']) {
    const targetDir = join(distSrc, dir);
    mkdirSync(targetDir, { recursive: true });
    const exports = listExportableFiles(targetDir);
    writeFile(join(targetDir, 'index.ts'), generateIndexExports(exports));
  }

  console.log('\n  [2/5] Copying app shell files...\n');
  copyDir(join(SRC, 'routes'), join(distSrc, 'routes'));
  copyDir(join(SRC, 'data'), join(distSrc, 'data'));
  copyDir(join(SRC, 'types'), join(distSrc, 'types'));
  copyDir(join(SRC, 'assets'), join(distSrc, 'assets'));
  copyFile(join(SRC, 'App.tsx'), join(distSrc, 'App.tsx'));
  copyFile(join(SRC, 'main.tsx'), join(distSrc, 'main.tsx'));

  console.log('\n  [3/5] Copying shared core runtime from apps/dsl...\n');
  copyDir(join(DSL_SRC, 'lib'), join(distSrc, 'lib'));
  copyDir(join(DSL_SRC, 'variants'), join(distSrc, 'variants'));

  console.log('\n  [4/5] Copying fixtures...\n');
  copyDir(FIXTURES, join(DIST_REACT, 'fixtures'));

  console.log('\n  [5/5] Writing standalone project config...\n');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  const dependencies = Object.fromEntries(
    Object.entries(pkg.dependencies).filter(([name]) => name !== '@ui8kit/dsl')
  );

  writeFile(
    join(DIST_REACT, 'package.json'),
    JSON.stringify(
      {
        name: '@ui8kit/resta-design-dist',
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          typecheck: 'tsc --noEmit',
          preview: 'vite preview',
        },
        dependencies,
        devDependencies: {
          '@tailwindcss/postcss': pkg.devDependencies['@tailwindcss/postcss'],
          '@types/node': pkg.devDependencies['@types/node'],
          '@types/react': pkg.devDependencies['@types/react'],
          '@types/react-dom': pkg.devDependencies['@types/react-dom'],
          '@vitejs/plugin-react-swc': pkg.devDependencies['@vitejs/plugin-react-swc'],
          postcss: pkg.devDependencies.postcss,
          tailwindcss: pkg.devDependencies.tailwindcss,
          typescript: pkg.devDependencies.typescript,
          vite: pkg.devDependencies.vite,
        },
      },
      null,
      2
    ) + '\n'
  );

  writeFile(
    join(DIST_REACT, 'vite.config.ts'),
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3023,
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

  writeFile(
    join(DIST_REACT, 'tsconfig.json'),
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

  writeFile(
    join(DIST_REACT, 'postcss.config.js'),
    `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`
  );

  copyFile(join(ROOT, 'index.html'), join(DIST_REACT, 'index.html'));

  const tempDir = join(DIST_REACT, '_temp');
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
    log('removed: apps/react-design/_temp');
  }

  console.log(`
  ───────────────────────────────────
  Done. Standalone design app is ready.

  To run:
    cd apps/react-design
    bun install
    bun run dev       → http://localhost:3023
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
