# Tools Review — Unused Tools & Significance

Review after completing `apps/dsl-crm`: which CLI tools were not used and their significance for data/entity consistency and release quality.

See `CLI_COMMANDS.md` for full command reference.

---

## Tools not used (per JOURNAL.md)

**maintain (@ui8kit/maintain):**
- `maintain run` (script: `maintain:check`)
- `maintain validate` (script: `maintain:validate`)
- `maintain audit`
- `maintain clean` / `clean:dist`

**ui8kit-generate (@ui8kit/generator):**
- `react` (script: `generate`)
- `static`, `html`, `render`, `styles`
- `uikit-map` (script: `build:map`)
- `blueprint:scan`, `blueprint:validate`, `blueprint:graph`
- `scaffold entity` (script: `scaffold:entity`)

**App scripts not run:**
- `finalize`, `typecheck:react` (generated app verification)
- `maintain:props`

**External CLIs (bunx):**
- `ui8kit-lint` (script: `lint`)
- `ui8kit-inspect` (script: `inspect`)

---

## Significance table (most → least significant)

| # | Tool | Script / command | Significance | Comment |
|---|------|------------------|--------------|---------|
| 1 | **maintain validate** | `maintain:validate` | Critical | Validates invariants (routes, fixtures, blocks, context), fixture schemas, *View exports, contracts with blueprint. Core tool for data/entity consistency; without it, routes/fixtures/page.json can drift from code. |
| 2 | **maintain run** | `maintain:check` | Critical | Runs full checker set from maintain.config.json (fixtures, contracts, data-class, component-tag, utility-props, etc.). Full project consistency check. |
| 3 | **blueprint:scan + blueprint:validate** | `blueprint:scan`, `blueprint:validate` | Critical | Scans app → blueprint.json; validates project against blueprint. Controls entity/structure consistency; without it, code may not match declared blueprint. |
| 4 | **generate + finalize + typecheck:react** | `generate`, `finalize`, `typecheck:react` | Critical | Actual React release: generate DSL → React app, finalize artifacts, typecheck generated app. Journal only recorded DSL-side gates, not the generated `../react-crm` verification. |
| 5 | **build:map + maintain:props** | `build:map`, `maintain:props` | High | Regenerates ui8kit.map.json from utility-props.map.ts and syncs with Tailwind/shadcn whitelist. Required when changing props/design tokens; avoids invalid classes in generated output. |
| 6 | **ui8kit-generate static / html / render / styles** | (no scripts in dsl-crm) | High | Second release track: HTML/CSS. Playbook expects this pipeline to be verified; not wired or run for dsl-crm. |
| 7 | **blueprint:graph** | `blueprint:graph` | Medium | Builds dependency graph from blueprint. Useful for understanding structure; does not block data/entity correctness. |
| 8 | **ui8kit-lint** | `lint` | Medium | General lint against whitelist (including props). Overlaps with some maintain checks; important when touching components/props. |
| 9 | **ui8kit-inspect** | `inspect` | Low | Inspects app/config for debugging. Does not affect build quality or entity consistency. |
| 10 | **scaffold entity** | `scaffold:entity` | Low | Scaffolds new entity (routes, views, fixtures). Convenient when adding entities; optional if building by hand. |
| 11 | **maintain clean** | `clean`, `clean:dist` | Low | Cleans generated dirs, node_modules, etc. Operational only; not about data validity. |
| 12 | **maintain audit** | `audit:refactor` (in dsl) | Low | Refactor/branding audit against mapping file. Specialized checker; not for routine entity consistency. |

---

Last update: 2026-03
