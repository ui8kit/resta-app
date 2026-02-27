# Plan: Improving code quality and syntax validation

This document summarizes the **audit of relevant code** and a **concrete plan** for improving validation. It aligns with [BACKLOG.md](./BACKLOG.md) (BACKLOG-001, BACKLOG-002) and the existing toolchain.

---

## Part 1 — Code areas audited (where changes are needed)

### 1. HtmlConverterService (`packages/generator/src/services/html-converter/HtmlConverterService.ts`)

| Area | Current behaviour | Change needed (BACKLOG-001) |
|------|-------------------|-----------------------------|
| **groupBySelectors** (lines 363–377) | Groups elements by `selector` (data-class or hash); merges all classes into one set per selector. No detection of conflicting class sets. | **Add validation:** Before/after grouping, detect when the same `data-class` appears with different class sets (e.g. `hero-title` with `gap-4` vs `gap-6`). Emit **warnings** into a structured report (not only `logger.warn`). |
| **mergeDuplicateClassSets** (382–406) | Merges selectors with identical class sets. Does not distinguish “same data-class, different props”. | No logic change; duplicate detection is orthogonal. The conflict detection belongs in **groupBySelectors** or in a new step that compares `(selector, classSet)` pairs. |
| **execute()** (107–195) | Already validates **component+tag** via `getComponentByDataClass` + `validateComponentTag` and logs `context.logger.warn`. | Keep as is; optionally **also** push these into an output `warnings[]` so the CLI can aggregate and print them (see generator CLI below). |
| **Output type** `HtmlConverterOutput` (23–32) | Has `applyCss`, `pureCss`, `elementsCount`, `selectorsCount`. No `warnings`. | **Extend:** Add optional `warnings?: string[]` (or structured `{ code, message, file? }[]`) so pipeline/CLI can surface them. |

**Data flow:** `extractElementsFromHtml` builds `ElementData[]` with `selector` = `data-class` or hash; `groupBySelectors` key is that selector. To detect “same data-class, different class sets”, group by `data-class` only (ignore hash-backed selectors) and compare class sets per selector.

---

### 2. Generator CLI and pipeline (`packages/generator/src/cli/generate.ts`, build/orchestrator)

| Area | Current behaviour | Change needed |
|------|-------------------|----------------|
| **generate.ts** | Has `result.warnings` and prints them (e.g. lines 359–362). Warnings come from build/transform, not from HtmlConverterService. | **Wire:** Ensure HTML conversion step (when used) returns its warnings and merge them into the same `warnings` array so one place prints all warnings. |
| **Pipeline** | HtmlConverterService is used in the HTML generation path. Its result is used for CSS/output; warnings are not collected. | **Collect** `HtmlConverterOutput.warnings` (once added) and pass to the same reporting path as other generator warnings. |

---

### 3. Maintain package (`packages/maintain`)

| Area | Current behaviour | Change needed (BACKLOG-001 / BACKLOG-002) |
|------|-------------------|-------------------------------------------|
| **Checkers** (`commands/shared.ts`) | Registered: RefactorAudit, Invariants, Fixtures, ViewExports, ContractTests, Clean. No **data-class** or **component** checker. | **Optional (BACKLOG-001 D):** New checker e.g. `DataClassConflictChecker` — scan TSX (or built HTML), collect `(data-class, classSet/propsHash)`, report conflicts. Medium effort. |
| **component validation** | Not in Maintain. HtmlConverterService already uses `component-tag-map` + `validateComponentTag` for HTML. | **Optional (BACKLOG-002):** Add checker e.g. `ComponentTagChecker` that uses `@ui8kit/generator/lib` (`loadComponentTagMap`, `validateComponentTag`) on TSX (or generated HTML). Requires TSX parsing or relying on generator output. |
| **IMaintainConfig** (`core/interfaces/IMaintainConfig.ts`) | `checkers` has no `dataClassConflicts` or `componentTag`. | **If new checkers added:** Extend `checkers` and schema with optional `dataClassConflicts?: {...}`, `componentTag?: {...}`. |
| **Schema** (`schemas/maintain.config.schema.json`) | Same; no new checker keys. | Add properties for new checkers when implemented. |

---

### 4. component-tag-map (`packages/generator/src/lib/component-tag-map.ts` + `.json`)

| Area | Current behaviour | Change needed |
|------|-------------------|----------------|
| **component-tag-map.json** | Block: `section`, `article`, `aside`, `header`, `footer`, `nav`, `main`, `figure`, `address`, `form`. Box: `div`, `form`, `blockquote`. Field: `input`, `textarea`, `select`, `button`. Text, Stack, Group, Icon have allowed lists. | **BACKLOG-002:** Already aligns with “Block = section-style; Box = no form controls; Field = form controls”. Optional: tighten or document Stack/Group/Text rules if needed. |
| **Usage** | HtmlConverterService uses it for **component+tag** validation on extracted HTML. | No code change required for current BACKLOG; optional Maintain checker would reuse the same map. |

---

### 5. utility-props and colors (BACKLOG-001 — “colors only from tokens”)

| Area | Current behaviour | Change needed |
|------|-------------------|----------------|
| **utility-props.map.ts** (e.g. `apps/dsl/src/lib/utility-props.map.ts`) | Whitelist for `bg`, `textColor`, `border`, etc. (semantic tokens). | Already the source of truth. |
| **ui8kit-validate** (external) | Validates props against this map (e.g. `bg="red"` → invalid). | No change in this repo. |
| **HtmlConverterService** | No check for color classes outside tokens. | **Optional:** After extracting classes, filter color-like classes (`bg-*`, `text-*`, `border-*`) and validate against a whitelist from generator config or from utility-props.map (parser needed). |
| **Maintain checker** | None for “colors from tokens”. | **Optional:** New checker or part of DataClassConflictChecker that validates color usage from TSX/props. |

---

### 6. Existing validation pipeline (apps)

| App | Scripts | Notes |
|-----|---------|--------|
| **dsl** | `lint:dsl` → `validate` (ui8kit-validate) → `blueprint:validate` → `maintain:validate` (invariants, fixtures, view-exports, contracts) → `generate` → `typecheck:react` | Full chain; no data-class or component check in Maintain yet. |
| **dsl-design** | Similar; `maintain:check` in dist:app. | Same. |

Adding new Maintain checkers would be run via `maintain validate --check ...,dataClassConflicts,componentTag` once implemented.

---

## Part 2 — Plan for improving validation (phased)

### Phase 1 — Low effort, high impact (recommended first)

1. **HtmlConverterService: data-class conflict detection (BACKLOG-001 B)**  
   - In `groupBySelectors` or in a dedicated step after `extractElementsFromHtml`:  
     - Group elements by **data-class** only (selector that does not look like a hash-based one).  
     - For each data-class, compute a canonical “class set key” (e.g. sorted class list).  
     - If the same data-class appears with different class set keys → append a warning (e.g. “data-class 'hero-title' used with conflicting class sets: …”).  
   - Add `warnings?: Array<{ code: string; message: string; sourceFile?: string }>` to `HtmlConverterOutput` and fill it from this step and from existing component-tag validation.  
   - Keep using `context.logger.warn` for backward compatibility; ensure CLI also receives these warnings.

2. **Generator CLI: surface HtmlConverterService warnings**  
   - Where the generator runs the HTML conversion step, collect `output.warnings` and merge into the existing `result.warnings` (or equivalent) so the same “Warnings” section in the CLI shows them.

3. **Optional: colors from tokens in HtmlConverterService (BACKLOG-001)**  
   - If desired in Phase 1: after extracting classes, check color-related classes against a whitelist (from generator config or from utility-props.map). Emit warnings for non-whitelisted color classes. Depends on having a simple way to get the list of allowed color values (e.g. from UiKitMapService or a new small helper).

### Phase 2 — Maintain checkers (medium effort)

4. **DataClassConflictChecker (BACKLOG-001 D)**  
   - New checker in `packages/maintain/src/checkers/DataClassConflictChecker.ts`.  
   - Config: e.g. `scope: ['src'], pattern: '**/*.tsx'`, optional `utilityPropsMapPath` for props-based hash.  
   - Logic: scan TSX files, parse JSX for `data-class` and props (or class lists); build `Map<dataClass, Set<classSetKey>>`; report when one data-class has more than one class set.  
   - Register in `shared.ts`, add config key and schema.

5. **ComponentTagChecker (BACKLOG-002)**  
   - New checker that uses `@ui8kit/generator/lib` (`loadComponentTagMap`, `validateComponentTag`).  
   - Input: either generated HTML (if available) or TSX scan. If TSX: parse `component` prop and tag from JSX (e.g. `<Block component="section">`).  
   - Report issues via `createIssue('warn', 'COMPONENT_TAG_INVALID', message, { file, line })`.  
   - Register in `shared.ts`, add config key and schema.

### Phase 3 — Syntax and quality (existing tools + small tweaks)

6. **TypeScript and lint**  
   - Already: `tsc --noEmit` in generator and maintain; `typecheck` / `typecheck:react` in apps; `lint:dsl` (ui8kit-lint-dsl), `lint` (ui8kit-lint).  
   - Ensure `dist:app` (or CI) always runs: `lint:dsl` → `validate` → `blueprint:validate` → `maintain:validate` → `generate` → `typecheck:react`.  
   - No code change required; document in README or CONTRIBUTING.

7. **Maintain report and CI**  
   - Maintain already writes reports to `.cursor/reports` and prints to console.  
   - Optional: fail CI when `maintain validate` has errors (or when new checkers report errors).  
   - Optional: add a `--strict` mode that treats data-class conflict warnings as errors.

---

## Summary table

| Item | Location | Effort | BACKLOG |
|------|----------|--------|---------|
| data-class conflict detection + output warnings | HtmlConverterService | Low | 001 B |
| Surface HTML conversion warnings in CLI | generator CLI/pipeline | Low | — |
| Colors-from-tokens in HtmlConverterService | HtmlConverterService + config | Low–Medium | 001 |
| DataClassConflictChecker (TSX scan) | Maintain | Medium | 001 D |
| ComponentTagChecker | Maintain + generator/lib | Medium | 002 |
| Document/ensure validation pipeline | README / CI | Low | — |

Recommended order: **Phase 1 (1–2)** first, then Phase 2 if you want earlier (TSX-level) feedback, then Phase 3 for documentation and CI.

---

## Files to touch (quick reference)

- `packages/generator/src/services/html-converter/HtmlConverterService.ts` — conflict detection, `HtmlConverterOutput.warnings`, optional color check.
- `packages/generator/src/cli/generate.ts` (or the place that calls HtmlConverterService) — collect and merge `output.warnings`.
- `packages/generator/src/services/html-converter/` — types for `HtmlConverterOutput` (and input if needed).
- `packages/maintain/src/checkers/DataClassConflictChecker.ts` — new (Phase 2).
- `packages/maintain/src/checkers/ComponentTagChecker.ts` — new (Phase 2).
- `packages/maintain/src/commands/shared.ts` — register new checkers.
- `packages/maintain/src/core/interfaces/IMaintainConfig.ts` — new checker config types.
- `packages/maintain/schemas/maintain.config.schema.json` — new checker config keys.
