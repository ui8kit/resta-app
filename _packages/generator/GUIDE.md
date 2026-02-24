# @ui8kit/generator — Comprehensive Practical Guide

This guide describes the current generator runtime following the transition to an `Orchestrator + Stage + Service` architecture with React SSR and PostCSS integration.

## 1) What the Generator Does

`@ui8kit/generator` handles static build tasks:

- Input: React components (via `registry.json`) + fixture data;
- Output: Static HTML pages + CSS artifacts + optimized styles;
- Core pipeline: `ReactSsrStage -> CssStage -> HtmlStage -> PostCssStage`.

Key Points:

- React SSR renders components to static HTML using `renderToStaticMarkup()`;
- `dist/html-views` and `viewsDir/viewsPagesSubdir` are no longer used;
- The source for pages is `registry.json` which maps components to routes;
- PostCSS + Tailwind produces optimized `styles.css` with UnCSS support.

## 2) Configuration

### 2.1 dist.config.json

The CLI reads configuration from `dist.config.json` in the project root:

```json
{
  "app": { "name": "App Name", "lang": "en" },
  "ssr": {
    "registryPath": "dist/react/_temp/registry.json",
    "reactDistDir": "dist/react",
    "outputDir": "dist/html"
  },
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
  "mappings": { "ui8kitMap": "src/lib/ui8kit.map.json" },
  "fixtures": {
    "dir": "fixtures",
    "collections": ["menu", "recipes", "blog", "promotions"]
  }
}
```

### 2.2 Single Source of Truth for Routes

Base routes are defined statically in `html.routes`. Fixture-based routes (e.g., `/menu/grill-salmon-steak`) are loaded automatically from `fixtures/*.json` and merged at runtime.

### 2.3 HTML Output Modes

| Mode | Description |
|------|-------------|
| `tailwind` | Keeps Tailwind utility classes + `data-class` attributes |
| `semantic` | Replaces `data-class` -> `class`, strips utility classes |
| `inline` | Same as semantic + embeds minified CSS in `<style>` tag |

## 3) Pipeline Architecture

```
ReactSsrStage (order=0)  -> renders React components to raw HTML fragments
CssStage      (order=1)  -> extracts classes from HTML, generates tailwind.apply.css
HtmlStage     (order=2)  -> wraps HTML in document, applies mode processing
PostCssStage  (order=3)  -> runs PostCSS/Tailwind, generates styles.css + unused.css
```

### 3.1 ReactSsrStage

- Reads `registry.json` to discover component names and source paths
- Maps routes to components (e.g., `/menu` -> `MenuPageView`)
- Imports components from `dist/react/src/` and renders via `renderToStaticMarkup()`
- Writes raw HTML fragments to `outputDir`

### 3.2 CssStage

- Reads rendered HTML from `html.outputDir`
- Extracts CSS classes using `HtmlConverterService`
- Generates `tailwind.apply.css`, `ui8kit.local.css`, `variants.apply.css`

### 3.3 HtmlStage

- Reads raw HTML fragments from `html.outputDir`
- Wraps in full HTML document (DOCTYPE, head, meta, body)
- Applies mode processing (tailwind/semantic/inline)
- Overwrites files in place

### 3.4 PostCssStage

- Generates `entry.css` with `@import "tailwindcss"` and `@source`
- Runs PostCSS with `@tailwindcss/postcss`
- Outputs `styles.css`
- Optionally runs UnCSS to produce `unused.css`

## 4) CLI Commands

```bash
# Full pipeline (default)
bunx ui8kit-generate static

# SSR + HTML only (no PostCSS)
bunx ui8kit-generate html

# PostCSS only (requires existing HTML)
bunx ui8kit-generate styles

# Custom working directory
bunx ui8kit-generate static --cwd ./my-project

# Custom config path
bunx ui8kit-generate static --config my-config.json

# Override fixtures directory
bunx ui8kit-generate html --fixtures ./custom-fixtures
```

## 5) Fixture-Based Routes

The `loadFixtureRoutes()` utility reads JSON files from the fixtures directory:

- `fixtures/menu.json` -> `/menu/{id}` routes
- `fixtures/recipes.json` -> `/recipes/{slug}` routes
- `fixtures/blog.json` -> `/blog/{slug}` routes (uses `posts` key)
- `fixtures/promotions.json` -> `/promotions/{id}` routes

Each item's `id` or `slug` field becomes the route segment, and `title` becomes the page title.

## 6) Services

| Service | Responsibility |
|---------|---------------|
| `ReactSsrService` | Render React components to static HTML |
| `CssService` | Extract and generate CSS from HTML |
| `HtmlService` | Wrap HTML in documents, apply modes |
| `HtmlConverterService` | Parse HTML elements, generate @apply CSS |
| `PostCssService` | PostCSS processing + UnCSS optimization |

## 7) Common Problems

### SSR renders empty content

Components using React context (ThemeProvider, AdminAuthProvider) render empty during SSR. Use SSR-safe component variants or provide mock data via `routeConfig.data`.

### PostCSS generates too much CSS

Ensure `@source` points to the directory with rendered HTML so Tailwind only includes used classes.

### Component not found in registry

Verify the component name in `routeComponentMap` matches the `name` field in `registry.json`.

## 8) Testing

```bash
cd _packages/generator
bun run test          # all tests
bun run test:watch    # watch mode
bun run test:coverage # coverage report
bun run typecheck     # TypeScript checks
```

## 9) Related Documentation

- [README.md](./README.md) - Quick overview
- [PLUGINS.md](./PLUGINS.md) - Template plugins (legacy track)
- [docs/transformer.md](./docs/transformer.md) - JSX transformer
