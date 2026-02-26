# @ui8kit/maintain

Maintenance CLI and orchestration package for UI8Kit-based projects.

`@ui8kit/maintain` helps you keep a project healthy over time by running repeatable checks, producing machine-readable reports, and supporting safe cleanup flows.

---

## What this package does

`maintain` provides:

- **A configurable checker orchestrator**
  - Register checkers
  - Run sequentially or in parallel
  - Continue on error when desired
- **Built-in maintenance checkers**
  - `refactor-audit` — detect residual legacy terms
  - `invariants` — verify key project structure invariants
  - `fixtures` — validate JSON fixtures against schemas
  - `view-exports` — enforce view export shape rules
  - `contracts` — validate blueprint/fixture/type/route contracts
  - `clean` — dry-run and execute cleanup tasks
- **Report pipeline**
  - Human-friendly console summary (`[OK]` / `[FAIL]`)
  - JSON report output in `.cursor/reports`

---

## CLI commands

```bash
maintain run
maintain validate
maintain audit
maintain clean
```

### `maintain run`
Run checkers defined in `maintain.config.json`.

Common options:

- `--cwd <dir>` (default: `.`)
- `--config <path>` (default: `maintain.config.json`)
- `--check <names>` comma-separated checker names
- `--max-parallel <number>` override config parallelism

Example:

```bash
maintain run --config maintain.config.json --check invariants,fixtures
```

### `maintain validate`
Runs the validation checker set by default:

- `invariants`
- `fixtures`
- `view-exports`
- `contracts`

You can override with `--check`.

### `maintain audit`
Runs `refactor-audit` only.

Options:

- `--mapping <path>`
- `--scope <paths>` (comma-separated)

Example:

```bash
maintain audit --mapping scripts/schemas/brand-mapping.json --scope src,fixtures
```

### `maintain clean`
Runs clean checker in **dry-run** mode by default.

Options:

- `--mode <full|dist>` (default: `dist`)
- `--paths <paths>` custom comma-separated target paths
- `--execute` actually delete files

Example:

```bash
# Preview only
maintain clean --mode dist

# Apply deletion
maintain clean --mode dist --execute
```

---

## Configuration

Default config file name:

- `maintain.config.json`

Minimal example:

```json
{
  "root": ".",
  "reportsDir": ".cursor/reports",
  "checkers": {
    "invariants": {
      "routes": {
        "appFile": "src/App.tsx",
        "required": ["/"]
      },
      "fixtures": {
        "pageFile": "fixtures/shared/page.json",
        "requiredPageDomains": ["website", "admin"]
      },
      "blocks": {
        "dir": "src/blocks",
        "indexFile": "src/blocks/index.ts"
      },
      "context": {
        "file": "src/data/adapters/fixtures.adapter.ts"
      }
    }
  }
}
```

For full schema, see:

- `schemas/maintain.config.schema.json`

---

## Output and exit behavior

- Console output uses checker-level statuses:
  - `[OK] <checker>`
  - `[FAIL] <checker>`
- A summary line is printed at the end.
- A JSON report is written to your reports directory:
  - `maintain-<runId>.json`
- Exit code:
  - `0` if the run is successful
  - `1` if any executed checker fails

---

## Typical usage in a monorepo app

In this repository, `apps/dsl/package.json` includes:

```json
{
  "scripts": {
    "maintain:check": "maintain run --config maintain.config.json"
  }
}
```

Run:

```bash
cd apps/dsl
bun run maintain:check
```

---

## Package architecture (high-level)

- `core/interfaces` — checker, config, and report contracts
- `core/orchestrator` — central runner
- `core/pipeline` — sequential/parallel checker execution
- `core/registry` — checker registration and resolution
- `core/report` — writer + console formatting
- `checkers` — built-in checker implementations
- `commands` — CLI command handlers
- `config` — config loader and defaults

---

## Next step

If you are new to this tool, read **`GUIDE.md`** for a practical 101 walkthrough with common scenarios.
