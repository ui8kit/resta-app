# Workflow (commands)

Short sequence of commands from setup to pre-commit checks. No code examples.

For a no-skip CRM onboarding and release path (`apps/dsl-crm`), use **[.project/CRM_PLAYBOOK.md](.project/CRM_PLAYBOOK.md)** together with this file.

---

## 1. Setup

From the monorepo root:

- `bun install`

Run once after cloning or after `git pull` when dependencies have changed.

---

## 2. Development

Switch to the target app and start the dev server:

- **Main app (restaurant):** `cd apps/dsl` → `bun run dev`
- **Design system (token/component preview):** `cd apps/dsl-design` → `bun run dev`

The server runs at the URL from the config (e.g. localhost:3020).

---

## 3. Pre-commit checks

All commands below are run **from the app directory**: `apps/dsl` or `apps/dsl-design`. **apps/dsl-design** has no `lint:gen` or `test:contracts` scripts.
For **maintain**: in `apps/dsl-design` the enabled checkers are `invariants`, `viewExports`, `contracts`, `clean`, `lockedDirs`, `viewHooks`, `utilityPropLiterals`, `orphanFiles`, `blockNesting` (checkers `dataClassConflicts`, `componentTag`, `colorTokens`, `genLint` are not enabled).

### 3.1 Required check order

1. **DSL lint** — If/Var/Loop instead of JS conditionals and loops
   - `bun run lint:dsl`

2. **Generator lint** — rules for blocks/layouts (genLint)
   - `bun run lint:gen`

3. **App validation** — config, props, component+tag (ui8kit-validate)
   - `bun run validate`

4. **Maintain: validate** — invariants, fixtures, view-exports, contracts
   - `bun run maintain:validate`

5. **TypeScript**
   - `bun run typecheck`

6. **If blocks, templates, or fixtures changed** — rebuild output and optionally verify the React app:
   - `bun run generate`
   - if needed: `bun run finalize`
   - verify generated app: from `apps/dsl` — `bun run typecheck:react` (checks `../react`); from `apps/dsl-design` — `bun run typecheck:react` (checks `../react-design`)

7. **If `src/lib/utility-props.map.ts` changed** — rebuild the class map: `bun run build:map` (or from repo root: `bun run packages/generator/src/cli/generate.ts uikit-map --cwd apps/dsl` / `--cwd apps/dsl-design`). Then verify whitelist: `bun run maintain:props`.

### 3.2 Single command (full pipeline)

Full pipeline of lint, validation, blueprint, generation, and React checks:

- `bun run dist:app`

- **apps/dsl:** lint:dsl, lint:gen, validate, blueprint:scan, blueprint:validate, test:contracts, generate, finalize, typecheck in `../react`.
- **apps/dsl-design:** lint:dsl, validate, blueprint:scan, blueprint:validate, maintain:check, generate, finalize, typecheck in `../react-design`.

No new CLI commands were added to `maintain`/`generator`; the above reflects the current set of enabled checkers in `maintain.config.json`.

### 3.3 All maintain checkers (before merge)

Run all checkers from `maintain.config.json` (including dataClassConflicts, componentTag, colorTokens, genLint):

- `bun run maintain:check`

---

## 4. Additional commands

- **Blueprint:** `bun run blueprint:scan`, `bun run blueprint:validate`, `bun run blueprint:graph`
- **Contracts:** `bun run test:contracts` (only in **apps/dsl**; dsl-design has no such script)
- **General lint:** `bun run lint` (ui8kit-lint)
- **Refactor audit:** `bun run audit:refactor`
- **Props map generation (ui8kit.map.json):** `bun run build:map` — from the app directory (`apps/dsl` or `apps/dsl-design`). Syncs `src/ui8kit.map.json` with `src/lib/utility-props.map.ts` (UiKitMapService).
- **Props map whitelist check:** `bun run maintain:props` — runs only the `utility-props-whitelist` checker (values in `utility-props.map.ts` must exist in tw-css-extended + shadcn + grid). Suggests nearest allowed classes.
- **From repo root** (for scripts/CI):
  - `bun run packages/generator/src/cli/generate.ts uikit-map --cwd apps/dsl`
  - `bun run packages/generator/src/cli/generate.ts uikit-map --cwd apps/dsl-design`
- **Clean generated output:** `bun run clean:dist`
- **Full clean (including node_modules):** `bun run clean`

---

## 5. Pre-commit checklist (short)

- `bun run lint:dsl`
- `bun run lint:gen`
- `bun run validate`
- `bun run maintain:validate`
- `bun run typecheck`
- If blocks/fixtures changed — `bun run generate` (and if needed `bun run finalize`)
- If `utility-props.map.ts` changed — `bun run build:map` and `bun run maintain:props`

Or run once: `bun run dist:app` (when you need the full pipeline up to generated React).

For full command options and CLI references, see **[CLI_COMMANDS.md](CLI_COMMANDS.md)**.
