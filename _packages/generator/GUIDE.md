# @ui8kit/generator — Comprehensive Practical Guide

This guide describes the current generator's runtime following the transition to an `Orchestrator + Stage + Service` architecture, without the Liquid pipeline.

## 1) What the Generator Does

`@ui8kit/generator` handles static build tasks:

- Input: Pre-prepared HTML view files;
- Output: Static HTML pages + CSS artifacts;
- Core pipeline: `CssStage -> HtmlStage` (+ optionally `ClassLogStage`).

Important Notes:

- `dist/html-views` is no longer a mandatory part of the pipeline;
- The source for pages is `dist/html/pages` (or any other directory specified via `html.viewsDir` + `html.viewsPagesSubdir`);
- Generation of variant elements (`generateVariantElements`) has been removed.

## 2) Key Configuration Principles

### 2.1 Single Source of Truth for Routes

Use a single route object for both `css.routes` and `html.routes` to ensure:

- CSS is generated only for necessary pages;
- HTML and CSS remain synchronized;
- Avoidance of redundant/empty pages.

### 2.2 Predictable Inputs/Outputs

- `html.viewsDir` + `html.viewsPagesSubdir` specify the location of source views;
- `html.outputDir` indicates where to write the final pages;
- `css.outputDir` indicates where to write intermediate CSS artifacts (`tailwind.apply.css`, `ui8kit.local.css`, `variants.apply.css`).

### 2.3 HTML Modes Depend on Publication Scenario

- `tailwind`: Retains classes, suitable for external `styles.css`;
- `semantic`: Replaces utility classes with semantic classes from `data-class`;
- `inline`: Similar to `semantic`, but embeds CSS directly into the page (convenient for email/isolated deliveries).

### 2.4 Post-processing is Optional

- `uncss` is enabled only with explicit configuration;
- Class logging (`classLog.enabled`) is enabled separately and is not mandatory for the build.

## 3) `generate()` Configuration by Blocks

```ts
import { generate } from '@ui8kit/generator';

const routes = {
  '/': { title: 'Home' },
  '/menu': { title: 'Menu' },
  '/blog': { title: 'Blog' },
  '/menu/grill-salmon-steak': { title: 'Grill Salmon Steak' },
};

const result = await generate({
  app: { name: 'Resta App', lang: 'en' },

  mappings: {
    ui8kitMap: './src/lib/ui8kit.map.json',
    shadcnMap: './src/lib/shadcn.map.json',
  },

  css: {
    routes: Object.keys(routes),
    outputDir: './dist/css',
    pureCss: true,
    outputFiles: {
      applyCss: 'tailwind.apply.css',
      pureCss: 'ui8kit.local.css',
      variantsCss: 'variants.apply.css',
    },
  },

  html: {
    viewsDir: './dist/html',
    viewsPagesSubdir: 'pages',
    routes,
    outputDir: './dist/html',
    mode: 'tailwind', // 'tailwind' | 'semantic' | 'inline'
    cssHref: '/css/styles.css',
    stripDataClassInTailwind: false,
  },

  classLog: {
    enabled: false,
    outputDir: './dist/maps',
    baseName: 'ui8kit',
  },

  // Optional:
  // uncss: {
  //   enabled: true,
  //   htmlFiles: ['./dist/html/index.html'],
  //   cssFile: './dist/html/css/styles.css',
  //   outputDir: './dist/html/css',
  //   outputFileName: 'unused.css',
  // },
});

console.log(result.success, result.generated, result.errors);
```

## 4) Execution Scenarios (from Project Root)

### 4.1 Full `dist/react` Preparation Cycle

```bash
bun run dist:app
```

What it does:

- Linting/validations;
- Generation of `dist/react`;
- Finalization step;
- Type checking in `dist/react`.

### 4.2 Static HTML Generation (from React Artifacts)

```bash
bun run generate:html
```

Expected result:

- Pages in `dist/html/.../index.html`;
- Nested dynamic routes in subfolders (`/menu/item` -> `dist/html/menu/item/index.html`);
- Source views in `dist/html/pages`.

### 4.3 Final CSS Generation and UnCSS Optimization

```bash
bun run generate:styles
```

Expected result:

- `dist/html/css/styles.css` — full generated CSS;
- `dist/html/css/unused.css` — optimized CSS after UnCSS (if the step is successful).

### 4.4 Full Static Generation

```bash
bun run generate:static
```

Equivalent to:

```bash
bun run generate:html && bun run generate:styles
```

## 5) Execution Scenarios (from Generator Package)

Use these for developing the generator itself:

```bash
cd _packages/generator
bun run typecheck
bun run test
bun run test:watch
bun run test:coverage
```

## 6) Quality and Stability Checks

### 6.1 Minimum Checklist After Generator Changes

1. `bun run typecheck` in `_packages/generator`.
2. `bun run test` in `_packages/generator`.
3. `bun run generate:static` in the project root.
4. Check target files:
   - `dist/html/index.html`
   - `dist/html/menu/index.html`
   - `dist/html/menu/grill-salmon-steak/index.html`
   - `dist/html/css/styles.css`
   - `dist/html/css/unused.css` (if UnCSS is enabled/successful)

### 6.2 What to Verify Visually/Logically

- Pages contain content (not an empty `<body>`);
- CSS link corresponds to `html.cssHref`;
- No duplicate paths between source views and final output;
- Single item routes are written to subfolders via `index.html`.

## 7) Testing Strategy (Principles)

### Unit Tests (Fast and Isolated)

- `CssService`: CSS artifact generation, resilience to missing `src/variants`;
- `HtmlService`: Correct handling of `tailwind`/`semantic`/`inline` modes;
- `HtmlConverterService`: Deterministic selectors, stable conversion.

### Integration Tests (End-to-End within the Package)

- Verification of full `generate()` on a set of routes;
- Control of output file structure;
- Verification that stage errors are correctly propagated to `GenerateResult.errors`.

### E2E Tests (Application Level)

- `bun run generate:static` in the root;
- Smoke testing of critical pages and CSS artifacts.

## 8) Common Problems and Diagnostics

### Problem: Empty page in `dist/html/.../index.html`

Verify:

- Corresponding source view exists in `dist/html/pages`;
- Route is present in `html.routes`;
- Keys in `css.routes` and `html.routes` match.

### Problem: `styles.css` is too large

Verify:

- `generate:styles` scans `dist/html` (the actual source of classes);
- The UnCSS step has been executed and `unused.css` is created;
- No unnecessary pages are included in the routes.

### Problem: UnCSS failure

Verify:

- Validity of `uncss.htmlFiles` and `uncss.cssFile` paths;
- The CSS file exists when the post-processing step starts.

## 9) Current Limitations

- `css.entryPath` has been removed from the generator configuration;
- `generate-templates` CLI has been removed from the runtime flow;
- `buildProject()` is retained only as a compatibility stub and returns an explicit error message;
- The legacy template-engine track (Liquid/Twig/Handlebars/Latte) is not part of the main static runtime.