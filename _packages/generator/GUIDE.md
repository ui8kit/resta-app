# @ui8kit/generator — Practical Guide

This generator currently supports two independent workflows:

1. `react` command: DSL/TSX transformation to a runnable SPA in `dist/react`.
2. Static pipeline (`static` / `html` / `styles`): CSS/HTML/PostCSS processing for prepared HTML input.

There is no SSR runtime in the current generator architecture.

## 1) DSL -> React (SPA) Workflow

Use this flow when you need a runnable Vite app in `dist/react`:

```bash
bun run generate
bun run finalize
bun run typecheck:dist
```

`generate` runs:

```bash
bun run _packages/generator/src/cli/generate.ts react
```

What it does:

- reads `ui8kit.config.json` via `@ui8kit/sdk/config`;
- scans `componentsDir`, `blocksDir`, `layoutsDir`, `partialsDir`;
- transforms source files using `transformJsx()` + `ReactPlugin`;
- writes generated output directly to `dist/react/src/*`;
- generates `dist/react/_temp/registry.json`.

Then `finalize` copies app shell and config files so `dist/react` is ready for:

```bash
cd dist/react
bun install
bun run dev
```

## 2) Static HTML/CSS Workflow (No SSR)

This flow expects HTML fragments to already exist in `html.outputDir`.

Pipeline:

```
CssStage -> HtmlStage -> PostCssStage
```

Commands:

```bash
bun run generate:static   # CSS + HTML + PostCSS
bun run generate:html     # CSS + HTML
bun run generate:styles   # PostCSS only
```

## 3) dist.config.json

Example:

```json
{
  "app": { "name": "App Name", "lang": "en" },
  "css": { "outputDir": "dist/css", "pureCss": true },
  "html": {
    "routes": {
      "/": { "title": "Home" },
      "/menu": { "title": "Menu" }
    },
    "outputDir": "dist/html",
    "mode": "tailwind"
  },
  "postcss": {
    "enabled": true,
    "entryImports": ["../../src/assets/css/shadcn.css"],
    "sourceDir": "../html",
    "outputDir": "dist/html/css",
    "uncss": { "enabled": true }
  },
  "mappings": { "ui8kitMap": "src/ui8kit.map.json" },
  "fixtures": {
    "dir": "fixtures",
    "collections": ["menu", "recipes", "blog", "promotions"]
  }
}
```

## 4) HTML Output Modes

| Mode | Description |
|------|-------------|
| `tailwind` | Keeps Tailwind utility classes + `data-class` attributes |
| `semantic` | Replaces `data-class` -> `class`, strips utility classes |
| `inline` | Same as semantic + embeds minified CSS in `<style>` tag |

## 5) Troubleshooting

### `registry.json` missing

Run `bun run generate` before using any flow that expects `dist/react/_temp/registry.json`.

### `generate:html` fails with missing source HTML

`html` command wraps existing HTML files. It does not render React components.
Ensure raw fragments are already in `html.outputDir`.

### PostCSS output too large

Set `postcss.sourceDir` to the directory with final HTML so Tailwind scans only used classes.

## 6) Development Commands

```bash
cd _packages/generator
bun run typecheck
bun run test
```

## 7) Related Documentation

- [README.md](./README.md)
- [PLUGINS.md](./PLUGINS.md)
- [docs/transformer.md](./docs/transformer.md)
