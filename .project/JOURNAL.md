# JOURNAL.md — Development Log

Format: one entry per significant event. Append chronologically.

---

## 2026-03-03 — Root Biome and Oxlint tooling

**What happened:** Commit `77104504caaa4eff1d72c38f6cb97f44d3bf05da` added Biome and Oxlint at the monorepo root for formatting, general linting, and import-boundary enforcement. Both tools are installed only in root `devDependencies`; apps and packages do not declare them.

**Changes:**
- **Root `package.json`**: Added `@biomejs/biome@^2.4.5` and `oxlint@^1.51.0` to devDependencies. New scripts: `format`, `format:check`, `lint:biome`, `lint:oxlint`, `lint:all`, `prepublish:check`.
- **`biome.json`** (new): Formatter (spaces, indent 2, line width 120, single quotes, trailing commas); linter with `recommended: false` and overrides — JSON files (lint disabled), test files (`noConsole` off), GraphQL files (useGraphqlNamedOperations, noDuplicateFields, useGraphqlNamingConvention). File scope: `apps/**`, `packages/**`, excluding dist, node_modules, ui8kit.map.json, utility-props.map.ts, tw-css-extended.json. VCS integration and Tailwind CSS parser enabled.
- **`.oxlintrc.json`** (new): Import plugin enabled; `no-restricted-imports` with two patterns — (1) packages must not import from apps (paths and package names for resta-dsl, resta-dsl-crm, resta-dsl-design), (2) generator must not import from maintain.
- **`turbo.json`**: Added cacheable tasks `lint:biome`, `lint:oxlint` and `test`.
- **Packages**: `packages/generator` and `packages/maintain` received a `lint:boundaries` script that runs `oxlint --import-plugin .` using the root-installed oxlint.

**Resolution:** Tooling is centralized at root; full pipeline is `bun run lint:all` (Biome → Oxlint → turbo run lint). Pre-publish validation for packages: `bun run prepublish:check`.

**Gap / LLM pause:** None. A 101-level guide was added in `.project/Biome-Oxlint-101.md` for creating, configuring, and managing Biome and Oxlint in this repo.

---

## 2026-03-03 — WPGraphQL connector layer (apps/dsl)

**What happened:** Commit `387b80582a66648b241a0078b812e39f2a46c558` scaffolded the WPGraphQL connector so the app can optionally load data from a GraphQL endpoint instead of JSON fixtures. The data layer remains canonical-shape-first: adapters return `CanonicalContextInput` whether source is fixtures or GraphQL.

**Changes:**
- **`apps/dsl/src/data/graphql/`** (new): `client.ts` (fetch-based GraphQL client), `menu.graphql`, `promotions.graphql`, `site.graphql` (named queries), `mappers.ts` (WPGraphQL response → canonical menu, promotions, site, navigation), `codegen.yml` (GraphQL Code Generator stub).
- **`wpgraphql.adapter.ts`**: Replaced stub with real implementation. If `VITE_GRAPHQL_ENDPOINT` is set, runs three queries in parallel and maps result via `mapWpGraphqlToCanonicalContextInput`; otherwise or on error returns fixture-backed data. Adapter is now async.
- **`context.ts`**: `resolveContextInput()` is async and awaited when source is `wpgraphql`; top-level `input` set with `await resolveContextInput()`.
- **`.env.example`**: Added `VITE_DATA_SOURCE=fixtures` and commented `VITE_GRAPHQL_ENDPOINT` for switching to GraphQL.

**Resolution:** GraphQL is opt-in via env; fixtures remain default. Queries follow platform-map field mapping (wordpress.json). Biome already lints `.graphql` files (named operations, no duplicate fields, naming) from root config.

**Gap / LLM pause:** None. A separate 101 guide was added in `.project/Data-GraphQL-Validation-101.md` covering data setup, GraphQL connector, examples, and how to configure linter and data validation (Biome overrides, maintain.config.json, ui8kit.config.json, canonical/platform schemas).

