# UI8Kit CLI Reference

Complete list of available CLI commands from `@ui8kit/sdk`, `@ui8kit/lint`, and `@ui8kit/generator`. Run with `bunx` or `npx` from the project root.

---

## @ui8kit/sdk

### `ui8kit-inspect`

Shows the resolved UI8Kit configuration. Use to verify config loads and paths resolve correctly.

| Option | Description |
|--------|--------------|
| `--cwd <dir>` | Working directory (default: current) |

**Examples:**

```bash
# From project root
bunx ui8kit-inspect

# From another directory
bunx ui8kit-inspect --cwd ./my-app

npx ui8kit-inspect --cwd ./apps/engine
```

**Output:** Config path, brand, framework, target, blocks/layouts/partials paths, fixtures, tokens, registry, and any compatibility warnings.

---

### `ui8kit-validate`

Validates app configuration and DSL usage. Exits 0 on success, 1 on failure (CI-friendly).

| Option | Description |
|--------|--------------|
| `--cwd <dir>` | Working directory (default: current) |

**Examples:**

```bash
# Validate from project root
bunx ui8kit-validate

# Validate a specific project
bunx ui8kit-validate --cwd ./my-app

npx ui8kit-validate --cwd ./apps/engine
```

**Checks:** Required paths exist, DSL syntax in components, diagnostics (missing paths, invalid props, DSL errors).

---

## @ui8kit/lint

### `ui8kit-lint-dsl`

Scans `.tsx`/`.jsx` files and enforces DSL components (`<Loop>`, `<If>`, `<Var>`) instead of raw JS control flow.

| Argument | Description |
|----------|--------------|
| `<paths...>` | Directories or files to scan (e.g. `src`, `src/blocks src/layouts`) |
| `--json` | JSON output for CI or tooling |

**Examples:**

```bash
# Scan src/
bunx ui8kit-lint-dsl src

# Scan specific directories
bunx ui8kit-lint-dsl src/blocks src/layouts src/partials

# JSON output for scripts or LLMs
bunx ui8kit-lint-dsl src --json
```

**Error codes:** `NON_DSL_LOOP`, `NON_DSL_CONDITIONAL`, `UNWRAPPED_VAR`, `VAR_DIRECT_CHILD_OF_IF`

---

### `ui8kit-lint`

Validates whitelist (`ui8kit.map.json`) sync with utility props map (`utility-props.map.ts`).

| Option | Description |
|--------|--------------|
| `--cwd <dir>` | Working directory |
| `--json` | JSON output |
| `--stats` | Show whitelist statistics |

**Examples:**

```bash
# From project root
bunx ui8kit-lint

# JSON output
bunx ui8kit-lint --json

# Show statistics (classes, props, coverage)
bunx ui8kit-lint --stats

# From another directory
bunx ui8kit-lint --cwd ./my-app
```

**Requirements:** `ui8kit.map.json` and `utility-props.map.ts` (paths configurable via `ui8kit.config.json` → `lint.ui8kitMapPath`, `lint.utilityPropsMapPath`).

---

## @ui8kit/generator

### `ui8kit-generate`

Reads `ui8kit.config` and generates templates from blocks, layouts, partials. Output format depends on target engine.

| Option | Description |
|--------|--------------|
| `--cwd <dir>` | Working directory |
| `--target <engine>` | Target engine: `react` \| `liquid` \| `handlebars` \| `twig` \| `latte` |
| `--out-dir <dir>` | Output directory override (default: `dist/<target>`) |

**Examples:**

```bash
# Use target from config (react)
bunx ui8kit-generate

# Generate for specific engine
bunx ui8kit-generate --target react
bunx ui8kit-generate --target liquid
bunx ui8kit-generate --target handlebars
bunx ui8kit-generate --target twig
bunx ui8kit-generate --target latte

# Custom output directory
bunx ui8kit-generate --target liquid --out-dir ./dist/shopify

# From another directory
bunx ui8kit-generate --cwd ./my-app --target react
bunx ui8kit-generate --cwd ./apps/engine --target liquid --out-dir ./dist/liquid
```

**Engines:**

| Engine | Use case |
|--------|----------|
| `react` | JS runtime, React/JSX |
| `liquid` | Shopify, Jekyll, Eleventy |
| `handlebars` | Express.js, static sites |
| `twig` | Symfony, PHP |
| `latte` | Nette Framework |

---

### `generate-templates`

Lower-level command: specify source and output directly, without `ui8kit.config`. For one-off conversions or custom layouts.

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--engine` | `-e` | liquid | Target engine: `react` \| `liquid` \| `handlebars` \| `twig` \| `latte` |
| `--source` | `-s` | ./src/components | Comma-separated source directories |
| `--output` | `-o` | ./dist/templates | Output directory |
| `--include` | `-i` | **/*.tsx | File patterns to include |
| `--exclude` | `-x` | **/*.test.tsx,**/*.spec.tsx,**/node_modules/** | File patterns to exclude |
| `--verbose` | `-v` | false | Verbose logging |
| `--help` | `-h` | — | Show help |

**Examples:**

```bash
# Default: ./src/components → ./dist/templates (liquid)
bunx generate-templates

# Custom source and output
bunx generate-templates --source ./src/blocks,./src/layouts --output ./dist/tpl

# Short form
bunx generate-templates -s ./src/blocks,./src/layouts -o ./dist/hbs

# Handlebars engine
bunx generate-templates --engine handlebars -s ./src/components -o ./dist/hbs

# Twig with verbose output
bunx generate-templates -e twig -v

# React output
bunx generate-templates -e react -s ./src/blocks -o ./dist/react

# Custom include/exclude
bunx generate-templates -s ./src -i "**/*.tsx" -x "**/*.test.tsx,**/stories/**"

# Help
bunx generate-templates --help
```

---

## Package Scripts (package.json)

| Script | Command | Purpose |
|--------|---------|---------|
| `validate` | `bunx ui8kit-validate` | Config + DSL validation |
| `lint:dsl` | `bunx ui8kit-lint-dsl src` | DSL control flow check |
| `generate` | `bunx ui8kit-generate` | Template generation (target from config) |

```bash
bun run validate
bun run lint:dsl
bun run generate
```

---

## Typical Workflows

### 1. Inspect and validate

```bash
bunx ui8kit-inspect
bunx ui8kit-validate
```

### 2. DSL development (before generate)

```bash
bunx ui8kit-lint-dsl src
bunx ui8kit-validate
bunx ui8kit-generate --target react
```

### 3. Multi-engine output

```bash
bunx ui8kit-validate
bunx ui8kit-generate --target react
bunx ui8kit-generate --target liquid --out-dir ./dist/shopify
bunx ui8kit-generate --target handlebars --out-dir ./dist/hbs
```

### 4. Whitelist maintenance

```bash
bunx ui8kit-lint --stats
bunx ui8kit-lint --json
```

### 5. Standalone conversion (no config)

```bash
bunx generate-templates -s ./src/blocks,./src/layouts,./src/partials -o ./dist/liquid -e liquid
```

---

## Package Summary

| Package | Binaries | Purpose |
|---------|----------|---------|
| `@ui8kit/sdk` | `ui8kit-inspect`, `ui8kit-validate` | Config inspection, validation |
| `@ui8kit/lint` | `ui8kit-lint-dsl`, `ui8kit-lint` | DSL flow validation, whitelist sync |
| `@ui8kit/generator` | `ui8kit-generate`, `generate-templates` | Template generation |
