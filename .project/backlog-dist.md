# dist/react Build Backlog

Backlog of improvements for the source app and generator to make `dist/react` a fully standalone, runnable app.

## Completed

- [x] **Generator: fix component name mismatch** — `TemplateService` now passes `item.name` as `componentName` to `transformJsxFile`; all 29 registry items generated (was 16)
- [x] **Generator: passthroughComponents** — `build-project.ts` now uses `getFallbackCoreComponents()` to populate passthrough list (`Block`, `Stack`, etc.)
- [x] **Generator: verbose logging** — `TemplateService` now logs `SKIP [reason] name` for every skipped item so causes are visible
- [x] **ReactPlugin: sibling If fragment** — `transform()` now wraps multiple root children in `<>...</>` fragment
- [x] **ReactPlugin: spread props (MainLayout)** — `extractPropsFromParams` handles `Identifier` params; emits `(props: any)` for non-destructured components
- [x] **Finalize: MainLayout type** — Overrides generator's `any` with proper `ComponentProps<typeof MainLayoutView>`
- [x] **Finalize: design support files** — `design/previews/*.tsx` transformed via generator (DSL removed); `design/fixtures/*.ts` copied as-is
- [x] **Finalize: package.json cleanup** — Excludes `@ui8kit/dsl`, `@ui8kit/generator`, `@ui8kit/lint`, `@ui8kit/sdk`, `@ui8kit/contracts` from dist dependencies
- [x] **Source: Icon.tsx DSL removed** — `If/Else` replaced with plain React ternary
- [x] **Source: Sheet.tsx DSL removed** — `If/Else` replaced with plain React conditionals
- [x] **Finalize: removed copyMissingFiles** — No longer needed; generator produces all files without DSL

## Current state

- Generator: **29/29** registry items produced, all DSL-free
- dist/react: **no `@ui8kit/dsl` imports** in any src file
- `bun run dist:app` → `cd dist/react && bun run build` → **succeeds** ✓

## Remaining (optional improvements)

1. **Generator: MainLayout type precision** — Currently emits `(props: any)`; finalize overrides with proper type. Could enhance `hast-builder.ts` to resolve local type aliases for better out-of-the-box output.
2. **Post-finalize validation** — Add a step to run `tsc --noEmit` inside dist/react to catch type errors before `bun run build`.
3. **Generator: verbose flag** — Add `--verbose` CLI option to `ui8kit-generate` to show skip logs only when requested (currently always on).
1. **Produce all registry items** — Generator produces 16 files but registry has 27+ items. Some blocks (LandingPageView, admin/*, design/*, Detail pages) are skipped. Investigate:
   - `transformJsxFile` errors for certain components
   - `tree.children.length === 0` skip condition
   - Add `--verbose` to ui8kit-generate for debugging

2. **ReactPlugin: sibling If/Else output** — When multiple `<If>` siblings are transformed, output is invalid JSX:
   ```jsx
   return (
     {cond1 ? (...) : null}
     {cond2 ? (...) : null}
   );
   ```
   Should wrap in fragment:
   ```jsx
   return (
     <>
       {cond1 ? (...) : null}
       {cond2 ? (...) : null}
     </>
   );
   ```
   Affects: ThemeToggle, any component with multiple sibling If blocks.

3. **MainLayout props** — Generator produces MainLayout without props; finalize has a hardcoded fix. Consider fixing in ReactPlugin so MainLayout gets proper `ComponentProps<typeof MainLayoutView>`.

## Finalize script improvements

1. **Post-finalize validation** — Add a step to verify all route imports resolve (e.g. run `tsc --noEmit` or vite build in dry-run).

2. **Exclude design from copy** — If design blocks always use DSL, consider excluding them from copy and documenting that design pages are dev-only (or require generator fix first).


## Verification

- `bun run dist:app` — generate + finalize (29 files, no DSL)
- `cd dist/react && bun install && bun run build` — production build succeeds
- `cd dist/react && bun run dev` — dev server (manual check)
