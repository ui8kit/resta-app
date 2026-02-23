# @ui8kit/generator — Runtime Guide

This guide reflects the current generator runtime after the orchestrator-only refactor.

## Scope

`@ui8kit/generator` now targets static page generation only:

- input: prepared React-rendered HTML views
- output: static HTML + CSS
- pipeline: `CssStage -> HtmlStage` with optional `ClassLogStage`

Template conversion engines (Liquid/Twig/Handlebars/Latte runtime flow) are not part of this runtime path.

## Programmatic Usage

```ts
import { generate } from '@ui8kit/generator';

const result = await generate({
  app: { name: 'Site', lang: 'en' },
  mappings: {
    ui8kitMap: './src/lib/ui8kit.map.json',
    shadcnMap: './src/lib/shadcn.map.json',
  },
  css: {
    routes: ['/', '/blog'],
    outputDir: './dist/html/css',
    pureCss: true,
    outputFiles: {
      applyCss: 'tailwind.apply.css',
      pureCss: 'ui8kit.local.css',
      variantsCss: 'variants.apply.css',
    },
  },
  html: {
    viewsDir: './dist/react/views',
    viewsPagesSubdir: 'pages',
    routes: {
      '/': { title: 'Home' },
      '/blog': { title: 'Blog' },
    },
    outputDir: './dist/html',
    mode: 'tailwind',
    cssHref: '/css/styles.css',
  },
  classLog: {
    enabled: true,
    outputDir: './dist/maps',
    baseName: 'ui8kit',
  },
});

console.log(result.success, result.generated);
```

## HTML Modes

### `tailwind`
- keeps existing `class` attributes
- optional `stripDataClassInTailwind` removes `data-class` attributes

### `semantic`
- removes raw utility classes
- converts `data-class="x"` into `class="x"`

### `inline`
- same transform as `semantic`
- inlines generated CSS into `<style>` in `<head>`

## Notes

- `css.entryPath` was removed from config.
- `generate-templates` CLI is removed from runtime package flow.
- `buildProject()` is kept only as compatibility stub and returns an explicit error message.
