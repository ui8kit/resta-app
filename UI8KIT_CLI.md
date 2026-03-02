# UI8Kit CLI Reference

Reference for **specialized NPM packages** only: `@ui8kit/sdk` and `@ui8kit/lint`. Run with `bunx` or `npx` from the project root.

For **project-specific CLIs** (`maintain`, `ui8kit-generate` from workspace packages), see [./CLI_COMMANDS.md](./CLI_COMMANDS.md).

---

## @ui8kit/sdk

### `ui8kit-inspect`

Shows the resolved UI8Kit configuration. Use to verify config loads and paths resolve correctly.

| Option | Description |
|--------|--------------|
| `--cwd <dir>` | Working directory (default: current) |

**Examples:**

```bash
bunx ui8kit-inspect
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
bunx ui8kit-validate
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
bunx ui8kit-lint-dsl src
bunx ui8kit-lint-dsl src/blocks src/layouts src/partials
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
bunx ui8kit-lint
bunx ui8kit-lint --json
bunx ui8kit-lint --stats
bunx ui8kit-lint --cwd ./my-app
```

**Requirements:** `ui8kit.map.json` and `utility-props.map.ts` (paths configurable via `ui8kit.config.json` → `lint.ui8kitMapPath`, `lint.utilityPropsMapPath`).

---

## Package summary

| Package | Binaries | Purpose |
|---------|----------|---------|
| `@ui8kit/sdk` | `ui8kit-inspect`, `ui8kit-validate` | Config inspection, validation |
| `@ui8kit/lint` | `ui8kit-lint-dsl`, `ui8kit-lint` | DSL flow validation, whitelist sync |

**Project CLIs** (`maintain`, `ui8kit-generate`): see [./CLI_COMMANDS.md](./CLI_COMMANDS.md).
