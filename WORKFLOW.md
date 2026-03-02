# Workflow (commands)

Short sequence of commands from setup to release. No code examples.

For the full stage-by-stage pipeline tracker with checklists, use **[.project/PLAYBOOK.md](.project/PLAYBOOK.md)** — paste it into an agent chat to check what is not yet done.

---

## 1. Setup

From the monorepo root:

```bash
bun install
```

Run once after cloning or after `git pull` when dependencies have changed.

---

## 2. Development

Switch to the target app and start the dev server:

```bash
cd apps/dsl          # or apps/dsl-crm, apps/dsl-design
bun run dev
```

The server runs at the URL from the Vite config (e.g. `localhost:3020`).

---

## 3. Config files (new app only)

Before running gates on a new app, ensure three config files exist in the app root:

| File | Purpose | Source |
|---|---|---|
| `ui8kit.config.json` | Generator, validate, lint config | Copy from `apps/dsl`, update `brand`, `outDir` |
| `maintain.config.json` | Checker config (routes, fixtures, dirs) | Copy from `apps/dsl`, update routes and domain names |
| `blueprint.json` | Entity/route contract | Write seed manually, then run `blueprint:scan` |

See **[ONBOARDING.md § 9](ONBOARDING.md)** for full config structure and annotated examples.

---

## 4. Gate chain (pre-commit / pre-release)

All commands run **from the app directory**. Run in order — stop and fix on any failure.

### Stage 3 — Critical gates

```bash
bun run lint:dsl           # DSL rules: no .map()/.&&/ternary; every <Var> in <If>
bun run lint:gen           # Generator lint for blocks/layouts (skip in dsl-design)
bun run validate           # ui8kit.config.json, props, component+tag
bun run maintain:validate  # Invariants, fixtures, view-exports, contracts
bun run maintain:check     # Full checker set (data-class, colorTokens, genLint, orphans...)
bun run typecheck          # TypeScript
bun run blueprint:scan     # Scan code → update blueprint.json
bun run blueprint:validate # Validate project against blueprint
```

### Stage 4 — High gates (run when relevant)

```bash
# When utility-props.map.ts changes:
bun run build:map          # Regenerate ui8kit.map.json from utility-props.map.ts
bun run maintain:props     # Verify all prop values exist in Tailwind/shadcn whitelist

# Optional — for structure inspection:
bun run blueprint:graph    # Build dependency graph from blueprint
bun run lint               # General lint (ui8kit-lint, overlaps with maintain)
```

### Stage 5 — Release

```bash
bun run generate           # DSL → React (output: ../react-{APP_NAME})
bun run finalize           # Assemble final generated app

# Verify generated React app:
cd ../react-{APP_NAME}
bun run typecheck

# HTML/CSS pipeline (requires dist.config.json or ui8kit.config.json dist section):
cd apps/{APP_NAME}
bunx ui8kit-generate static --cwd .   # Full: render + CSS + HTML + PostCSS
bunx ui8kit-generate html --cwd .     # Render + HTML only
bunx ui8kit-generate styles --cwd .   # CSS extraction only
```

### Single command (full pipeline)

```bash
bun run dist:app
```

**apps/dsl:** lint:dsl, lint:gen, validate, blueprint:scan, blueprint:validate, test:contracts, generate, finalize, typecheck:react.
**apps/dsl-design:** lint:dsl, validate, blueprint:scan, blueprint:validate, maintain:check, generate, finalize, typecheck:react.

---

## 5. Additional commands

| Command | Purpose |
|---|---|
| `bun run maintain:validate` | Fast validate-only run (invariants, fixtures, view-exports, contracts) |
| `bun run maintain:check` | Full checker set from maintain.config.json |
| `bun run maintain:props` | Props whitelist check only |
| `bun run blueprint:scan` | Scan → update blueprint.json |
| `bun run blueprint:validate` | Validate project vs blueprint |
| `bun run blueprint:graph` | Dependency graph |
| `bun run build:map` | Regenerate ui8kit.map.json |
| `bun run test:contracts` | Contract tests (apps/dsl only) |
| `bun run audit:refactor` | Refactor/branding audit |
| `bun run inspect` | ui8kit-inspect (config debug) |
| `bun run clean:dist` | Remove generated output |
| `bun run clean` | Full clean including node_modules |

---

## 6. Pre-commit checklist (short)

- [ ] `bun run lint:dsl`
- [ ] `bun run lint:gen` (skip in dsl-design)
- [ ] `bun run validate`
- [ ] `bun run maintain:validate`
- [ ] `bun run maintain:check`
- [ ] `bun run typecheck`
- [ ] `bun run blueprint:scan`
- [ ] `bun run blueprint:validate`
- [ ] If blocks/fixtures changed — `bun run generate` then `bun run finalize`
- [ ] If blocks changed — `cd ../react-{APP_NAME} && bun run typecheck`
- [ ] If `utility-props.map.ts` changed — `bun run build:map` then `bun run maintain:props`

For full CLI options, see **[CLI_COMMANDS.md](CLI_COMMANDS.md)**.
For the stage-by-stage pipeline with `[ ]` trackers, see **[.project/PLAYBOOK.md](.project/PLAYBOOK.md)**.
