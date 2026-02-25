# Scripts Guide

Reference for all scripts in the `scripts/` directory. Describes what each script does, when to use it, and how to run it.

---

## Overview

| Script | npm Command | Purpose |
|--------|------------|---------|
| `finalize-dist.ts` | `bun run finalize` | Assemble `dist/react/` into a standalone runnable Vite app |
| `validate-invariants.ts` | `bun run validate:invariants` | Check architectural invariants (routes, fixtures, blocks, context) |
| `contract-tests.ts` | `bun run test:contracts` | Blueprint-driven contract checks between fixtures, types, views, and routes |
| `refactor-audit.ts` | `bun run audit:refactor` | Scan for residual old brand terms after a brand refactor |
| `build-props-classlist.ts` | `bun run build:props` | Extract all prop→class combinations from `utility-props.map.ts` |
| `clean-workspace.sh` | `bun run clean` | Full cleanup: `node_modules`, `dist`, `*.tsbuildinfo` |
| `clean-engine.sh` | `bun run clean:dist` | Clean only `dist/react/` before re-generation |
| `scaffold-app.ts` | _(manual)_ | Scaffold a new app directory (monorepo-style, kept for reference) |
| `scaffold-config.ts` | _(manual)_ | Read scaffold config fields from `app-scaffold.config.json` |
| `installer.sh` | _(manual)_ | Orchestrate full scaffold + install + generate + sync pipeline |
| `smoke-parity.mjs` | _(manual)_ | Verify src/dist parity for CLI packages (kept for reference) |

---

## Core Workflow Scripts

### `finalize-dist.ts`

**Command:** `bun run finalize`  
**Also:** `bun run dist:app` (runs `generate` + `finalize` together)

Transforms `dist/react/` (raw generator output) into a fully working standalone Vite + React application that can be run with `bun install && bun run dev`.

**When to run:** After `bun run generate`, when you need a deployable/distributable version of the app without DSL components.

**What it does:**
1. Moves generated `dist/react/blocks|layouts|partials` into `dist/react/src/`
2. Fixes a known generator issue in `MainLayout.tsx` (missing props parameter)
3. Generates `index.ts` barrel files for blocks, layouts, partials
4. Copies app shell from `src/`: `components`, `variants`, `lib`, `routes`, `providers`, `data`, `css`
5. Copies `fixtures/` into `dist/react/fixtures/`
6. Generates `package.json`, `vite.config.ts`, `tsconfig.json`, `postcss.config.js`
7. Copies `index.html`
8. Removes `dist/react/_temp/` (registry metadata, not needed at runtime)

**Result structure:**
```
dist/react/
├── src/
│   ├── blocks/       ← generated (no DSL — If/Var/Loop → plain React)
│   ├── layouts/      ← generated
│   ├── partials/     ← generated
│   ├── components/   ← @ui8kit/core alias (src/components/)
│   ├── routes/       ← real routes with context data (src/routes/)
│   ├── providers/    ← ThemeProvider, AdminAuthProvider
│   ├── data/         ← context.ts with real fixtures
│   ├── css/          ← Tailwind v4 + shadcn CSS
│   └── variants/     ← CVA configs
├── fixtures/         ← JSON data (copied from project root)
├── package.json      ← standalone (port 3021)
├── vite.config.ts
├── tsconfig.json
├── postcss.config.js
└── index.html
```

**To run the result:**
```bash
cd dist/react
bun install
bun run dev   # → http://localhost:3021
```

---

### `validate-invariants.ts`

**Command:** `bun run validate:invariants`

Checks that the project structure is internally consistent. Produces a report in `.cursor/reports/invariants-*.json`.

**Checks performed:**
1. `fixtures/shared/page.json` — exists, has `website` and `admin` arrays
2. `src/App.tsx` — contains all required routes: `/`, `/menu`, `/menu/:slug`, `/recipes`, `/recipes/:slug`, `/blog`, `/blog/:slug`, `/promotions`, `/promotions/:slug`, `/admin`, `/admin/dashboard`
3. `src/routes/` — every route component referenced in `App.tsx` has a corresponding `.tsx` file
4. `src/blocks/index.ts` — all `.tsx` files in `src/blocks/` are exported
5. `src/data/context.ts` — all fixture JSON files imported in `context.ts` actually exist on disk
6. `dist/react/` — if present, checks that blocks/layouts/partials are generated and `package.json` exists (i.e. `finalize` was run)

**Exit codes:** `1` if any error-level check fails; `0` on success (warnings are non-blocking).

---

## Brand Refactor Scripts

### `refactor-audit.ts`

**Command:** `bun run audit:refactor`

Scans `src/` and `fixtures/` for residual occurrences of old brand terms defined in `scripts/schemas/brand-mapping.json`. Produces a report in `.cursor/reports/refactor-audit-*.json`.

**When to run:** After a brand refactor to verify no old brand terms remain in the codebase.

**How it works:**
- Reads `brand-mapping.json` entries (each has `from`, `to`, `severity`)
- Scans all `.ts`, `.tsx`, `.json`, `.css`, `.md` files in the defined scope
- Counts residual matches of `from` terms
- Reports files, line numbers, and excerpts for any remaining occurrences
- Exits with code `1` if any `severity: "error"` entries have residual matches

**Options:**
```bash
# Use a custom mapping file
bun run scripts/refactor-audit.ts --mapping .manual/custom-mapping.json

# Scan a specific subdirectory
bun run scripts/refactor-audit.ts --scope src/blocks,fixtures
```

**Mapping file:** `scripts/schemas/brand-mapping.json`  
**Refactor guide:** `.project/REFACTOR.md`

**Expected result after successful refactor:** all `severity: "error"` entries show `residualCount: 0`.

---

### `build-props-classlist.ts`

**Command:** `bun run build:props`

Parses `src/lib/utility-props.map.ts` and extracts every valid prop→Tailwind class combination. Writes the result to `src/lib/ui8kit.list.props.json`.

**When to run:** When `utility-props.map.ts` is updated (new props or values added), to keep the class list in sync for Tailwind content scanning.

**Input:** `src/lib/utility-props.map.ts`  
**Output:** `src/lib/ui8kit.list.props.json`

---

## Cleanup Scripts

### `clean-workspace.sh`

**Command:** `bun run clean`

Full project cleanup. Removes all generated and installed artifacts.

**Removes:**
- `node_modules/`
- `dist/`
- `**/*.tsbuildinfo`

**Use when:** Starting fresh, switching branches with dependency changes, or troubleshooting stale build artifacts.

---

### `clean-engine.sh`

**Command:** `bun run clean:dist`

Removes only the generated `dist/react/` output. Useful when you need to re-run `generate` + `finalize` without reinstalling dependencies.

**Removes:**
- `dist/react/`
- `node_modules/.vite` (Vite cache)
- `**/*.tsbuildinfo`

**Typical usage:**
```bash
bun run clean:dist
bun run generate
bun run finalize
```

---

## Reference Scripts (Kept, Not Wired to npm)

### `scaffold-app.ts`

Scaffolds a new UI8Kit app directory (package.json, vite.config.ts, tsconfig.json, postcss.config.js, CSS, main.tsx, App.tsx skeleton). Reads config from `app-scaffold.config.json`.

**When:** Starting a brand-new app variant, typically run via `installer.sh`.

**Config:** `scripts/app-scaffold.config.json`

---

### `scaffold-config.ts`

Utility that reads a single field from `app-scaffold.config.json` and outputs it to stdout. Used internally by `installer.sh` to extract `appName`, `domain`, `dataMode`.

```bash
bun run scripts/scaffold-config.ts --field appName
bun run scripts/scaffold-config.ts --field domain
```

---

### `installer.sh`

Full pipeline orchestrator for creating a new standalone app:
1. Run `scaffold-app.ts`
2. `bun install`
3. Run `generate` (engine)
4. Run `copy-templates + bundle-data` (sync pipeline)

> **Note:** Steps 3–4 are monorepo-style and may need adaptation for standalone workflows. Currently kept as reference.

---

### `smoke-parity.mjs`

Verifies that `src/` and `dist/` builds of CLI packages produce identical output for a set of test cases. Kept as a reference for SDK/CLI development.

> **Note:** Not relevant for the standalone app workflow. Only useful if developing `@ui8kit/*` packages locally.

---

## Schemas

### `schemas/brand-mapping.json`

Brand entity mapping used by `refactor-audit.ts`. Lists all brand-specific terms in the current project (`RestA` restaurant app), their expected replacements (as `{PLACEHOLDER}` descriptors), and severity level.

- `severity: "error"` — must be replaced (code references, routes, component names)
- `severity: "warn"` — should be reviewed (content text, port numbers)

Each entry has a `note` field describing which files the term appears in.

See `.project/REFACTOR.md` for the complete brand refactor workflow.

---

### `schemas/refactor-audit.schema.json`

JSON Schema for the refactor audit report file. Describes the structure of reports generated by `refactor-audit.ts` and saved to `.cursor/reports/refactor-audit-*.json`.

---

## Full Workflow Reference

### Development
```bash
bun run dev                   # Vite dev server → http://localhost:3020
bun run validate              # Validate props + DSL syntax
bun run lint:dsl              # Enforce DSL rules in src/
bun run blueprint:scan        # Generate blueprint.json
bun run blueprint:validate    # Validate blueprint integrity + write report
bun run test:contracts        # Contract checks driven by blueprint
bun run validate:invariants   # Check routes, fixtures, exports, context
```

### Generate Standalone Dist
```bash
bun run dist:app              # = generate + finalize in one command

# Or step by step:
bun run clean:dist            # Remove previous dist/react/
bun run generate              # Generate blocks/layouts/partials → dist/react/
bun run finalize              # Assemble complete app → dist/react/

# Run the result:
cd dist/react && bun install && bun run dev   # → http://localhost:3021
```

### Brand Refactor
```bash
# 1. Fill in .project/REFACTOR.md with new brand values
# 2. Apply all changes (per REFACTOR.md checklist)
# 3. Verify:
bun run lint:dsl
bun run validate
bun run validate:invariants
bun run audit:refactor        # Must show 0 error-level residual matches
```

### Cleanup
```bash
bun run clean                 # Full: node_modules + dist + tsbuildinfo
bun run clean:dist            # Dist only: dist/react/ + vite cache
```

### Utilities
```bash
bun run audit:refactor        # Scan for old brand terms
bun run build:props           # Rebuild ui8kit.list.props.json from utility-props.map.ts
bunx ui8kit-inspect           # Inspect ui8kit.config.json
```
