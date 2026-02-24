# AGENTS.md

Instructions for AI coding agents working on the UI8Kit resta-app project. This file contains two instruction sets: **Development & Validation** and **Generation**.

---

## 1. Development, Testing & Validation

### Project Overview

- **Type:** Single app (`@ui8kit/resta-app`) — restaurant web app. Vite + React. No monorepo.
- **Runtime:** Node.js `>=18` or Bun
- **Config:** `ui8kit.config.json` in project root

### Setup Commands

```bash
bun install          # Install dependencies
bun run dev          # Start Vite dev server (port 3020)
bun run build        # Production build
bun run preview      # Preview production build
```

### Mandatory Validation (Before Final Answer)

Always run these checks before completing any task that touches `src/`:

```bash
bun run validate     # ui8kit-validate — config + DSL validation
bun run lint:dsl     # ui8kit-lint-dsl src — DSL control flow enforcement
```

**Report pass/fail.** If skipped, state why.

### Validation Workflow

1. **Inspect config** (optional): `bunx ui8kit-inspect`
2. **Validate project**: `bun run validate` — checks paths, DSL syntax, exits 0 on success
3. **Lint DSL**: `bun run lint:dsl` — enforces `<Loop>`, `<If>`, `<Var>` instead of `.map()`, ternary, `&&`

### DSL Rules (Engine Constraints)

- **No hardcode:** Data from `context` or props only
- **DSL only:** Use `<If>`, `<Loop>`, `<Var>` from `@ui8kit/dsl` — no `.map()`, `?:`, `&&` in JSX
- **Semantic props:** No `className`, `style`, raw HTML
- **Comments:** English only

### DSL Error Codes (ui8kit-lint-dsl)

| Code | Fix |
|------|-----|
| `NON_DSL_LOOP` | Replace `.map()` with `<Loop collection={items}>` |
| `NON_DSL_CONDITIONAL` | Replace ternary/`&&` with `<If condition={x}>` |
| `UNWRAPPED_VAR` | Wrap `<Var>` in `<If>` when value is optional |
| `VAR_DIRECT_CHILD_OF_IF` | Add wrapper element between `<If>` and `<Var>` |

### Code Style

- **Components:** PascalCase (`HeroBlock`, `FeatureCard`)
- **Props:** Semantic only (`gap="6"`, `bg="primary"`) — no `className`/`style`
- **data-class:** Required on every semantic element (`data-class="hero-section"`)
- **Imports:** `@ui8kit/core` for UI, `@ui8kit/dsl` for If/Var/Loop

### Project Structure (Where to Put Code)

| Type | Location |
|------|----------|
| UI primitives/composites | `src/components/` |
| CVA variants | `src/variants/` |
| Page sections/views | `src/blocks/` |
| Reusable fragments | `src/partials/` |
| Page layouts | `src/layouts/` |
| Route components | `src/routes/` |
| Fixture data | `fixtures/` |

### Common Validation Errors

| Error | Solution |
|-------|----------|
| `gap="5"` invalid | Use `gap="4"` or `gap="6"` |
| `fontSize="huge"` invalid | Use `fontSize="4xl"` |
| `bg="red"` invalid | Use `bg="destructive"` or semantic token |
| Config not found | Ensure `ui8kit.config.json` exists; use `--cwd` if needed |
| DSL artifacts | Replace raw JS with `<Loop>`, `<If>`, `<Var>` |

### Related Rules

- `.cursor/rules/engine-dsl-enforcement.mdc` — DSL constraints
- `.cursor/rules/best-practices.mdc` — patterns, anti-patterns
- `.cursor/rules/project-structure.mdc` — architecture
- `.cursor/rules/ui8kit-architecture.mdc` — components, props reference

---

## 2. Generation

### When to Use

Use generation instructions when:
- Generating templates from DSL components
- Outputting to React, Liquid, Handlebars, Twig, or Latte
- Building static output for CMS, e-commerce, or static sites

### Prerequisites

- Valid `ui8kit.config.json` with `blocksDir`, `layoutsDir`, `partialsDir`
- DSL-compliant components (run `bun run lint:dsl` and `bun run validate` first)

### Generation Workflow

1. **Validate** before generating:
   ```bash
   bun run validate
   bun run lint:dsl
   ```

2. **Generate templates**:
   ```bash
   bun run generate                    # Uses target from config (react)
   bunx ui8kit-generate --target react
   bunx ui8kit-generate --target liquid
   bunx ui8kit-generate --target handlebars
   ```

3. **Output:** `dist/<target>/` (or `outDir` from config)

### Supported Engines

| Engine | Use Case |
|--------|----------|
| `react` | JS runtime, keep as React/JSX |
| `liquid` | Shopify, Jekyll, Eleventy |
| `handlebars` | Express.js, static sites |
| `twig` | Symfony, PHP |
| `latte` | Nette Framework |

### DSL → Template Mapping

| DSL | React | Liquid | Handlebars |
|-----|-------|--------|------------|
| `<If condition={x}>` | `{x ? <>...</> : null}` | `{% if x %}...{% endif %}` | `{{#if x}}...{{/if}}` |
| `<Loop collection={items}>` | `{items.map(...)}` | `{% for item in items %}...{% endfor %}` | `{{#each items}}...{{/each}}` |
| `<Var name="title" value={x} />` | `{x ?? "default"}` | `{{ x \| default: "default" }}` | `{{ x }}` |
| `<Include name="Header" />` | `<Header />` | `{% render 'Header' %}` | `{{> Header }}` |

### Post-Generation Checklist

- If templates changed: `bun run generate` must pass
- Fix any DSL artifacts in source (run `lint:dsl` again)
- Output files go to `dist/<target>/` — use or copy into CMS/static site

### Custom Paths (generate-templates)

For one-off conversions without config:

```bash
bunx generate-templates --source ./src/blocks,./src/layouts --output ./dist/tpl --engine liquid
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| No source directories | Ensure `blocksDir`, `layoutsDir`, `partialsDir` exist in config |
| DSL artifacts in output | Run `bun run lint:dsl`, replace raw JS with `<Loop>`, `<If>`, `<Var>` |
| Config not found | Run from project root or use `--cwd` |

---

## Quick Reference

| Task | Command |
|------|---------|
| Dev server | `bun run dev` |
| Validate config + DSL | `bun run validate` |
| Lint DSL (src/) | `bun run lint:dsl` |
| Generate templates | `bun run generate` |
| Inspect config | `bunx ui8kit-inspect` |
