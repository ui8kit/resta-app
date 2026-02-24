#!/usr/bin/env bun
/**
 * Scaffold a new UI8Kit app (vite, tsconfig, postcss, css, etc.).
 * Reads scripts/app-scaffold.config.json.
 *
 * Run from repo root:
 *   bun run scripts/scaffold-app.ts
 *
 * Creates target directory with full infrastructure. Does NOT run bun install or pipeline.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadScaffoldConfig } from "./scaffold-config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

function writeFile(targetPath: string, content: string): void {
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, "utf-8");
  console.log("  +", targetPath.replace(REPO_ROOT, ".").replace(/\\/g, "/"));
}

async function main(): Promise<void> {
  const config = await loadScaffoldConfig();
  const targetRoot = join(REPO_ROOT, config.target);
  const appName = config.appName;
  const packageName = config.packageName;
  const description = config.description;
  const port = config.port ?? 5174;
  const title = config.title ?? `UI8Kit ${appName}`;

  console.log(`Scaffolding app: ${appName} → ${config.target}\n`);

  if (existsSync(targetRoot)) {
    console.warn(`Target exists: ${config.target}. Overwriting files.\n`);
  }

  // package.json
  writeFile(
    join(targetRoot, "package.json"),
    JSON.stringify(
      {
        name: packageName,
        description,
        private: true,
        version: "0.1.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview",
        },
        dependencies: {
          "@ui8kit/core": "workspace:*",
          "@ui8kit/contracts": "workspace:*",
          "@ui8kit/dsl": "workspace:*",
          "lucide-react": "^0.460.0",
          "react": "^19.1.0",
          "react-dom": "^19.1.0",
          "react-router-dom": "^7.0.1",
        },
        devDependencies: {
          "@tailwindcss/cli": "^4.1.9",
          "@tailwindcss/postcss": "^4.1.13",
          "@types/react": "^19.1.0",
          "@types/react-dom": "^19.1.0",
          "@vitejs/plugin-react-swc": "^3.11.0",
          "class-variance-authority": "^0.7.0",
          "clsx": "^2.1.1",
          "postcss": "^8.5.6",
          "tailwind-merge": "^2.5.4",
          "tailwindcss": "^4.1.9",
          "typescript": "~5.8.3",
          "vite": "^6.3.5",
        },
      },
      null,
      2
    )
  );

  // vite.config.ts
  writeFile(
    join(targetRoot, "vite.config.ts"),
    `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: ${port} },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@ui8kit/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@ui8kit/dsl': path.resolve(__dirname, '../../packages/dsl/src/index.ts'),
      '@ui8kit/data': path.resolve(__dirname, '../engine/src/data/index.ts'),
      '@ui8kit/blocks': path.resolve(__dirname, '../engine/src/blocks/website/index.ts')
    }
  },
})
`
  );

  // tsconfig.json
  writeFile(
    join(targetRoot, "tsconfig.json"),
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
      "@ui8kit/core": ["../../packages/core/src/index.ts"],
      "@ui8kit/dsl": ["../../packages/dsl/src/index.ts"],
      "@ui8kit/blocks": ["../engine/src/blocks/website/index.ts"],
      "@ui8kit/data": ["../engine/src/data/index.ts"]
    }
  },
  "include": ["src"]
}
`
  );

  // postcss.config.mjs
  writeFile(
    join(targetRoot, "postcss.config.mjs"),
    `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  }
}
`
  );

  // index.html
  writeFile(
    join(targetRoot, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      #app[data-class="main-layout"]:has(> aside) { flex-direction: row; }
    </style>
  </head>
  <body>
    <div id="app" class="flex flex-col min-h-screen" data-class="main-layout"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
  );

  // src/main.tsx
  writeFile(
    join(targetRoot, "src", "main.tsx"),
    `import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import '@/css/index.css';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
`
  );

  // src/lib/utils.ts
  writeFile(
    join(targetRoot, "src", "lib", "utils.ts"),
    `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
  );

  // src/css/index.css
  writeFile(
    join(targetRoot, "src", "css", "index.css"),
    `@import "tailwindcss";

@import "./shadcn.css";

@source "../**/*.{ts,tsx}";
@source "../../../../packages/generator/src/lib/ui8kit.map.json";
@source "../../../../packages/core/src/**/*.{ts,tsx}";

@layer base {
  body {
    @apply bg-background text-foreground font-sans;
  }
  button {
    cursor: pointer;
  }
  [class*="border-"] {
    border-color: var(--color-border);
  }
  .prose {
    @apply !text-[.925rem];
  }
}
`
  );

  // src/css/shadcn.css - copy from dev (or use template)
  const shadcnSrc = join(REPO_ROOT, "apps", "dev", "src", "css", "shadcn.css");
  if (existsSync(shadcnSrc)) {
    const shadcn = await Bun.file(shadcnSrc).text();
    writeFile(join(targetRoot, "src", "css", "shadcn.css"), shadcn);
  } else {
    // Minimal fallback
    writeFile(
      join(targetRoot, "src", "css", "shadcn.css"),
      `:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(210 25% 7.8431%);
  --card: hsl(180 6.6667% 97.0588%);
  --card-foreground: hsl(210 25% 7.8431%);
  --primary: hsl(203.8863 88.2845% 53.1373%);
  --primary-foreground: hsl(0 0% 100%);
  --muted: hsl(240 1.9608% 90%);
  --muted-foreground: hsl(210 25% 7.8431%);
  --border: hsl(201.4286 30.4348% 90.9804%);
  --radius: 1.3rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --radius-lg: var(--radius);
}
`
    );
  }

  // Placeholder App.tsx (will be overwritten by copy-templates)
  writeFile(
    join(targetRoot, "src", "App.tsx"),
    `export function App() {
  return <div className="p-8">Loading...</div>;
}
`
  );

  console.log("\nDone. Run: bun install && bun run generate (in apps/engine) && TARGET_APP=" + appName + " DOMAIN=" + (config.domain ?? "website") + " bun run scripts/copy-templates-to-dev.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
