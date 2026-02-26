# @ui8kit/maintain — GUIDE (101)

Beginner-friendly guide for running maintenance checks, understanding reports, and solving common project scenarios.

---

## 1) Quick start (5 minutes)

From an app directory that has `maintain.config.json`:

```bash
maintain run --config maintain.config.json
```

If your repo already defines scripts, you can use those instead (example):

```bash
bun run maintain:check
```

What you get:

1. Checker-by-checker status in terminal (`[OK]` / `[FAIL]`)
2. Final summary with error/warning counts
3. JSON report path (usually under `.cursor/reports`)

---

## 2) Mental model

Think in three layers:

1. **Config** (`maintain.config.json`)  
   Decides which checkers are enabled and their parameters.
2. **Run command** (`maintain run/validate/audit/clean`)  
   Chooses a checker set and runtime options.
3. **Report** (`.cursor/reports/maintain-*.json`)  
   Source of truth for automation and troubleshooting.

---

## 3) Command cheat sheet

### Run all configured checkers

```bash
maintain run --config maintain.config.json
```

### Run only selected checkers

```bash
maintain run --config maintain.config.json --check invariants,fixtures
```

### Increase parallelism for large projects

```bash
maintain run --config maintain.config.json --max-parallel 4
```

### Run validation-only suite

```bash
maintain validate --config maintain.config.json
```

### Run refactor audit only

```bash
maintain audit --config maintain.config.json
```

### Override audit mapping/scope on the fly

```bash
maintain audit \
  --config maintain.config.json \
  --mapping scripts/schemas/brand-mapping.json \
  --scope src,fixtures
```

### Clean in safe preview mode (default)

```bash
maintain clean --config maintain.config.json --mode dist
```

### Actually clean files

```bash
maintain clean --config maintain.config.json --mode dist --execute
```

---

## 4) Common scenarios

## Scenario A: “I want a quick project health check before commit”

Run:

```bash
maintain validate --config maintain.config.json
```

Why:

- Fast confidence on structure, fixtures, view exports, and contracts
- Good default pre-commit signal

---

## Scenario B: “I only changed fixture data”

Run:

```bash
maintain run --config maintain.config.json --check fixtures
```

Why:

- Short feedback loop
- Avoids unrelated checkers

---

## Scenario C: “We are doing a rebrand/refactor migration”

Run:

```bash
maintain audit --config maintain.config.json
```

Use overrides when needed:

```bash
maintain audit --config maintain.config.json --scope src,fixtures,docs
```

Why:

- Finds residual legacy terms quickly
- Provides file/line-level issues in report

---

## Scenario D: “I need to clean generated artifacts safely”

Step 1 (preview):

```bash
maintain clean --config maintain.config.json --mode dist
```

Step 2 (execute if preview looks correct):

```bash
maintain clean --config maintain.config.json --mode dist --execute
```

Why:

- Dry-run prevents accidental deletions
- Can still force specific paths with `--paths`

---

## Scenario E: “I need one CI command with failing exit code”

Run:

```bash
maintain run --config maintain.config.json
```

Behavior:

- Exits with `1` if any checker fails
- Exits with `0` when all selected checkers pass

This is CI-friendly by default.

---

## 5) How to read failures

Sample output:

```text
[FAIL] fixtures: 2 errors, 0 warnings
  - [FIXTURE_SCHEMA_INVALID] fixtures/menu.json /items/0/price: must be number
  Hint: Fix fixture data and re-run.
```

Recommended workflow:

1. Read the checker name (`fixtures`, `invariants`, etc.)
2. Fix the first concrete issue in file/path order
3. Re-run only that checker for fast confirmation
4. Re-run `maintain validate` (or `maintain run`) before finalizing

---

## 6) Basic config patterns

## Enable only what you need

A checker runs only if its section exists under `checkers`.

Example:

```json
{
  "checkers": {
    "fixtures": {
      "targets": [
        { "file": "fixtures/landing.json", "schema": "schemas/canonical/landing.schema.json" }
      ]
    }
  }
}
```

## Keep report output consistent

```json
{
  "reportsDir": ".cursor/reports"
}
```

## Control run strategy

```json
{
  "continueOnError": true,
  "maxParallel": 2
}
```

## Clean paths from config (no hardcoding)

Paths are defined in `maintain.config.json`. Each app (DSL, design system, etc.) declares its own outDir and paths:

```json
{
  "checkers": {
    "clean": {
      "paths": ["../react-design", "node_modules/.vite"],
      "pathsByMode": {
        "full": ["node_modules", "../react-design"],
        "dist": ["../react-design", "node_modules/.vite"]
      },
      "includeTsBuildInfo": true
    }
  }
}
```

- `paths` — fallback when `pathsByMode` doesn't define the mode
- `pathsByMode.full` — full cleanup (node_modules, outDir)
- `pathsByMode.dist` — dist-only (generated output, .vite cache)
- Use `--paths` to override on the fly

---

## 7) Recommended team workflow

For day-to-day development:

1. `maintain validate` during local work
2. `maintain run` before merging
3. `maintain audit` for migration/refactor streams
4. `maintain clean` only when regeneration/build caches are broken or stale

---

## 8) Troubleshooting

### “Config file not found”

- Ensure your command uses correct `--cwd` and `--config`
- Validate path relative to `--cwd`

### “Checker is not running”

- Confirm checker section exists in `checkers` config
- For `maintain run --check ...`, verify checker name spelling

### “Unexpected cleanup candidates”

- Do not pass `--execute` first
- Inspect dry-run output/report
- Use explicit `--paths` if needed

### “Validation errors from schemas”

- Check fixture JSON path and schema path in config
- Fix data first, then schema references
- Re-run only `fixtures` checker for quick feedback

---

## 9) What to read next

- `README.md` — high-level package overview
- `schemas/maintain.config.schema.json` — exact config contract
- `apps/dsl/maintain.config.json` (in this repo) — real project example
