# Biome & Oxlint 101 — Setup, Configuration, and Workflow

A beginner-friendly guide to how Biome and Oxlint are set up in this monorepo, how to run them, and how to change their behaviour.

Use together with: [CLI_COMMANDS.md](../CLI_COMMANDS.md), [PLAYBOOK.md](PLAYBOOK.md).

---

## 1. What Was Done (Commit 77104504)

Root-level tooling was added so that **Biome** and **Oxlint** run from the monorepo root. They are **not** installed inside individual apps or packages.

| Change | Purpose |
|--------|--------|
| **Root `package.json`** | Added `@biomejs/biome` and `oxlint` to `devDependencies`; added scripts: `format`, `format:check`, `lint:biome`, `lint:oxlint`, `lint:all`, `prepublish:check`. |
| **`biome.json`** (root) | Single config for the whole repo: formatter (spaces, single quotes, trailing commas), linter (custom rules, no full recommended set), file includes/excludes, overrides for JSON (no lint), test files (allow console), and GraphQL (named operations, no duplicate fields, naming). |
| **`.oxlintrc.json`** (root) | Import plugin enabled; `no-restricted-imports` enforces: packages must not import from apps; generator must not import from maintain. |
| **`turbo.json`** | New tasks: `lint:biome`, `lint:oxlint` (cacheable); `test` task added. |
| **`packages/generator` & `packages/maintain`** | New script `lint:boundaries` that runs `oxlint --import-plugin .` in that package (uses root-installed oxlint via hoisting). |

---

## 2. Creating and Managing the Setup

### 2.1 Where Things Live

- **Config files**: Repo root only.
  - `biome.json` — Biome formatter + linter.
  - `.oxlintrc.json` — Oxlint rules (import plugin + restricted imports).
- **Installation**: Only in root `package.json` under `devDependencies`. Do **not** add Biome or Oxlint to `apps/*` or `packages/*` — they are run from root and, when needed, via workspace hoisting.

### 2.2 Adding or Changing Biome

1. **Edit** `biome.json` at the repo root.
2. **Schema**: The `$schema` URL pins the config to a Biome version; update it when upgrading Biome.
3. **Scope**: `files.includes` lists globs to include; use `!...` to exclude (e.g. `!**/dist/**`, `!**/ui8kit.map.json`).
4. **Formatter**: `formatter` and `javascript.formatter` control indent, quotes, line width, trailing commas.
5. **Linter**: `linter.rules` — turn rules on/off per category. Use `overrides` to apply different rules to specific file patterns (e.g. `**/*.graphql`, `**/*.test.ts`).
6. **Run**: `bun run format` (write) or `bun run format:check` / `bun run lint:biome` (check only).

### 2.3 Adding or Changing Oxlint

1. **Edit** `.oxlintrc.json` at the repo root.
2. **Plugins**: Set `plugins` to `["import"]` (or others if added later). The import plugin enables dependency/boundary checks.
3. **Rules**: Under `rules`, configure e.g. `no-restricted-imports` with `patterns`: each pattern has `group` (list of path/package patterns) and `message` (error text).
4. **Run**: `bun run lint:oxlint` from root (scans `apps/` and `packages/`), or inside a package: `bun run lint:boundaries` (uses root oxlint via hoisting).

### 2.4 Running the Full Pipeline

- **Format (apply)**: `bun run format`
- **Check only (CI-safe)**: `bun run format:check` then `bun run lint:all`
- **Lint all**: `bun run lint:all` — runs Biome check, then Oxlint, then `turbo run lint` (per-package lint scripts).
- **Before publishing packages**: `bun run prepublish:check` — Biome + Oxlint on `packages/`, then typecheck and tests for packages.

---

## 3. Quick Reference

| Goal | Command |
|------|--------|
| Format entire repo | `bun run format` |
| Check format without writing | `bun run format:check` |
| Run Biome (format + lint) | `bun run lint:biome` |
| Run Oxlint (import boundaries) | `bun run lint:oxlint` |
| Run Biome + Oxlint + per-package lint | `bun run lint:all` |
| Validate packages before npm publish | `bun run prepublish:check` |
| Check import boundaries in one package | `cd packages/generator && bun run lint:boundaries` |

---

## 4. Design Choices in This Repo

- **Single root config**: One `biome.json` and one `.oxlintrc.json`; no per-app or per-package configs for these tools (except optional overrides later).
- **Linter rules**: Biome uses `recommended: false` and explicit rule tuning to avoid clashes with domain linters (e.g. ui8kit-lint). Overrides disable lint for JSON and allow `console` in test files; GraphQL files get named operations, no duplicate fields, and naming convention.
- **Oxlint**: Used only for import boundaries (`no-restricted-imports`). Packages cannot import from apps; generator cannot import from maintain. This keeps packages publishable and dependency direction clear.
- **No Rollup**: Vite is used for building; Rollup was not added.

---

Last update: 2026-03-03
