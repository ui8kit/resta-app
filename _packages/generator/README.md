# @ui8kit/generator

Static HTML/CSS generator for UI8Kit with orchestrator pipeline.

## Runtime Scope

The active pipeline is:

- `Orchestrator -> ReactSsrStage -> CssStage -> HtmlStage -> PostCssStage`
- React SSR renders components from `registry.json` to raw HTML
- CssService extracts classes from rendered HTML
- HtmlService wraps HTML fragments in full documents
- PostCssStage runs Tailwind + optional UnCSS

## Installation

```bash
bun add @ui8kit/generator
```

## Quick Start (CLI)

Create `dist.config.json` in project root:

```json
{
  "app": { "name": "My App", "lang": "en" },
  "ssr": {
    "registryPath": "dist/react/_temp/registry.json",
    "reactDistDir": "dist/react",
    "outputDir": "dist/html"
  },
  "css": { "outputDir": "dist/css", "pureCss": true },
  "html": {
    "routes": { "/": { "title": "Home" }, "/menu": { "title": "Menu" } },
    "outputDir": "dist/html",
    "mode": "tailwind"
  },
  "postcss": { "enabled": true, "outputDir": "dist/html/css" },
  "fixtures": { "dir": "fixtures", "collections": ["menu", "recipes", "blog"] }
}
```

Run:

```bash
bunx ui8kit-generate static      # full pipeline
bunx ui8kit-generate html         # SSR + HTML only
bunx ui8kit-generate styles       # PostCSS only
```

## Quick Start (API)

```ts
import { generate } from '@ui8kit/generator';

await generate({
  app: { name: 'My App', lang: 'en' },
  css: { routes: ['/'], outputDir: './dist/css', pureCss: true },
  html: {
    routes: { '/': { title: 'Home' } },
    outputDir: './dist/html',
    mode: 'tailwind',
  },
  ssr: {
    registryPath: './dist/react/_temp/registry.json',
    reactDistDir: './dist/react',
    outputDir: './dist/html',
  },
});
```

## Common Commands (Root)

| Command | Description |
|---------|-------------|
| `bun run generate:static` | Full pipeline via CLI |
| `bun run generate:html` | SSR + HTML only |
| `bun run generate:styles` | PostCSS + UnCSS only |

## Common Commands (Generator Dev)

| Command | Description |
|---------|-------------|
| `bun run test` | Run all tests |
| `bun run typecheck` | TypeScript checks |
| `bun run test:coverage` | Coverage report |

## Full Documentation

See [GUIDE.md](./GUIDE.md) for complete architecture, configuration, and troubleshooting.
