# @ui8kit/generator — CLI Guide for Standalone Apps

This guide explains how to use the generator CLI tools in a **standalone application** when developing UI8Kit DSL templates. These commands convert your React components into target templates (React, Liquid, Handlebars, Twig, Latte) for use in CMS, e-commerce, or static sites.

## Prerequisites

- Node.js `>=18` or Bun
- A project with `ui8kit.config.ts` or `ui8kit.config.json`
- DSL components in `blocks`, `layouts`, `partials` (paths from config)

## Installation

```bash
bun add @ui8kit/generator
# or
npm install @ui8kit/generator
```

The generator depends on `@ui8kit/sdk` for config loading. It is installed automatically.

## CLI Commands

### `ui8kit-generate` — Generate Templates from Config

Reads your `ui8kit.config` and generates templates from your blocks, layouts, and partials. Output format depends on the `target` engine.

**What it does:**
- Loads config (`blocksDir`, `layoutsDir`, `partialsDir`)
- Scans components, builds a registry
- Transforms React/DSL to the target engine
- Writes output to `outDir` (default: `dist/<target>`)

**Supported engines:** `react` | `liquid` | `handlebars` | `twig` | `latte`

**Examples:**

```bash
# Generate React templates (default from config)
bunx ui8kit-generate

# Generate for a specific engine
bunx ui8kit-generate --target react
bunx ui8kit-generate --target liquid
bunx ui8kit-generate --target handlebars

# Custom output directory
bunx ui8kit-generate --target liquid --out-dir ./dist/shopify

# From another directory
bunx ui8kit-generate --cwd ./my-app --target react
```

**Typical output:**
```
Generation completed.
Engine: react
Output: /path/to/my-app/dist/react
Files: 24
```

**When to use each engine:**
- **react** — Keep components as React/JSX for a JS runtime
- **liquid** — Shopify, Jekyll, Eleventy
- **handlebars** — Express.js, static sites
- **twig** — Symfony, PHP
- **latte** — Nette Framework

---

### `generate-templates` — Generate from Custom Paths

A lower-level command that lets you specify source and output directories directly, without relying on `ui8kit.config`. Useful for one-off conversions or custom project layouts.

**What it does:**
- Scans `--source` directories for `.tsx` files
- Transforms to the chosen engine
- Writes to `--output`

**Examples:**

```bash
# Default: ./src/components → ./dist/templates (liquid)
bunx generate-templates

# Custom source and output
bunx generate-templates --source ./src/blocks,./src/layouts --output ./dist/tpl

# Handlebars engine
bunx generate-templates --engine handlebars -s ./src/components -o ./dist/hbs

# Verbose logging
bunx generate-templates --verbose
```

**Options:**
| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--engine` | `-e` | liquid | Target engine |
| `--source` | `-s` | ./src/components | Comma-separated source dirs |
| `--output` | `-o` | ./dist/templates | Output directory |
| `--verbose` | `-v` | false | Enable verbose logging |

---

## Typical Workflow for DSL Development

1. **Validate config and DSL** (SDK):
   ```bash
   bunx ui8kit-validate
   ```

2. **Lint DSL** (optional, from `@ui8kit/lint`):
   ```bash
   bunx ui8kit-lint-dsl src
   ```

3. **Generate templates**:
   ```bash
   bunx ui8kit-generate --target react
   ```

4. **Use output** — Generated files go to `dist/<target>/` (or your `outDir`). For React, you can import them directly. For Liquid/Handlebars, copy into your CMS or static site.

---

## How DSL Translates to Templates

| DSL Component | React | Liquid | Handlebars |
|---------------|-------|--------|------------|
| `<If condition={x}>` | `{x ? <>...</> : null}` | `{% if x %}...{% endif %}` | `{{#if x}}...{{/if}}` |
| `<Loop collection={items}>` | `{items.map(...)}` | `{% for item in items %}...{% endfor %}` | `{{#each items}}...{{/each}}` |
| `<Var name="title" value={x} />` | `{x ?? "default"}` | `{{ x \| default: "default" }}` | `{{ x }}` |
| `<Include name="Header" />` | `<Header />` | `{% render 'Header' %}` | `{{> Header }}` |

Using DSL ensures your components generate clean, engine-specific output.

---

## Programmatic Usage

```typescript
import { buildProject } from "@ui8kit/generator";
import { loadAppConfig } from "@ui8kit/sdk/config";

const config = await loadAppConfig(process.cwd());
const result = await buildProject(config, process.cwd());

if (!result.ok) {
  console.error(result.errors);
} else {
  console.log(`Generated ${result.generated} files to ${result.outputDir}`);
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No source directories | Ensure `blocksDir`, `layoutsDir`, `partialsDir` are set in `ui8kit.config` and exist. |
| DSL artifacts in output | Run `ui8kit-lint-dsl src` and replace raw JS with `<Loop>`, `<If>`, `<Var>`. |
| Config not found | Run from project root or use `--cwd`. Ensure `ui8kit.config.ts` or `ui8kit.config.json` exists. |

---

## Related Packages

| Package | Commands | Purpose |
|---------|----------|---------|
| `@ui8kit/generator` | `ui8kit-generate`, `generate-templates` | Template generation |
| `@ui8kit/sdk` | `ui8kit-validate`, `ui8kit-inspect` | Config validation |
| `@ui8kit/lint` | `ui8kit-lint-dsl` | DSL flow validation |
