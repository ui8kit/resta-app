# @ui8kit/generator

Static HTML/CSS generator for UI8Kit.

The package now focuses on one runtime path only:

- `Orchestrator -> CssStage -> HtmlStage -> (optional) ClassLogStage`
- React views in `views/pages/*.html`
- output: static HTML and CSS artifacts

## Installation

```bash
bun add @ui8kit/generator
```

## Quick Start

```ts
import { generate } from '@ui8kit/generator';

await generate({
  app: { name: 'My App', lang: 'en' },
  css: {
    routes: ['/', '/blog'],
    outputDir: './dist/html/css',
    pureCss: true,
  },
  html: {
    viewsDir: './dist/react/views',
    viewsPagesSubdir: 'pages',
    routes: {
      '/': { title: 'Home' },
      '/blog': { title: 'Blog' },
    },
    outputDir: './dist/html',
    mode: 'tailwind', // 'tailwind' | 'semantic' | 'inline'
    cssHref: '/css/styles.css',
  },
});
```

## Supported HTML Modes

- `tailwind`: keeps class-based markup
- `semantic`: converts `data-class` to `class` and strips raw utility classes
- `inline`: same as semantic + inlines generated CSS into `<style>`

## Active Services and Stages

### Services
- `HtmlConverterService`
- `CssService`
- `HtmlService`
- `ClassLogService` (optional)

### Stages
- `CssStage`
- `HtmlStage`
- `ClassLogStage` (optional, enabled by `config.classLog.enabled`)

## Important Changes

- Legacy runtime services removed from generator pipeline:
  - `LayoutService`
  - `RenderService`
  - `ViewService`
  - `AssetService`
  - `TemplateService`
  - `ViteBundleService`
- `css.entryPath` removed from generator config
- `generate-templates` CLI removed from generator runtime
- Legacy template plugins are no longer exported from the main entrypoint

## Optional Postprocessing

- `uncss` can still be used as optional postprocess through `runUncssPostprocess`
- class logs are supported through `classLog` config and `ClassLogStage`

## License

MIT
