# @ui8kit/generator

Static HTML/CSS generator for UI8Kit with orchestrator pipeline.

## Runtime Scope

The active runtime path is:

- `Orchestrator -> CssStage -> HtmlStage -> (optional) ClassLogStage`
- source views from `html.viewsDir` + `html.viewsPagesSubdir` (recommended: `dist/html/pages`)
- final output in `html.outputDir` (recommended: `dist/html`)

Legacy Liquid runtime flow is not part of this pipeline.

## Installation

```bash
bun add @ui8kit/generator
```

## Quick Start

```ts
import { generate } from '@ui8kit/generator';

const routes = {
  '/': { title: 'Home' },
  '/blog': { title: 'Blog' },
  '/menu/grill-salmon-steak': { title: 'Grill Salmon Steak' },
};

await generate({
  app: { name: 'My App', lang: 'en' },
  css: {
    routes: Object.keys(routes),
    outputDir: './dist/css',
    pureCss: true,
  },
  html: {
    viewsDir: './dist/html',
    viewsPagesSubdir: 'pages',
    routes,
    outputDir: './dist/html',
    mode: 'tailwind', // 'tailwind' | 'semantic' | 'inline'
    cssHref: '/css/styles.css',
  },
});
```

## HTML Modes

- `tailwind`: keeps class attributes
- `semantic`: converts `data-class` to semantic classes and removes utility-only class output
- `inline`: semantic transform + inlined CSS in `<style>`

## Common Commands (root project)

```bash
bun run dist:app
bun run generate:html
bun run generate:styles
bun run generate:static
```

## Generator Development Commands

```bash
cd _packages/generator
bun run typecheck
bun run test
bun run test:coverage
```

## Full Guide

For complete scenarios, configuration principles, validations, and troubleshooting, see:

- `GUIDE.md`

## License

MIT
