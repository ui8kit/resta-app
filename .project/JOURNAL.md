# JOURNAL.md — Development Log

Format: one entry per significant event. Append chronologically.

---

## Entry template

```md
## YYYY-MM-DD — <Stage>: <Title>

**What happened:** ...
**Obstacle / Error:** ...
**Resolution:** ...
**Gap / LLM pause:** ...
```

---

## 2026-03-02 — Planning: Universal Playbook + dsl-crm initialized

**What happened:** Created plan `universal_playbook_+_dsl-crm_e25c0cee.plan.md`. Defined two tracks: (1) rewrite PLAYBOOK.md as app-agnostic universal guide; (2) implement `apps/dsl-crm` as a live CRM example with Dashboard, Tasks, Kanban, Reports, and Admin auth. Bun v1.3.10 installed. Workspace `bun install` completed (612 packages). Existing typecheck failures in `apps/dsl` and `apps/dsl-design` fixed (DomainNavButton union type narrowing + ColorToken re-export scope bug).

**Obstacle / Error:** `bun run typecheck` failed with two errors:
1. `apps/dsl/src/partials/DomainNavButton.tsx` — `Omit<ButtonProps, ...>` distributes over the union, making `onCopy` incompatible with anchor-only `ClipboardEventHandler<HTMLAnchorElement>`.
2. `apps/dsl-design/src/types/colors.ts` — `export type { ColorToken }` re-exports do not put `ColorToken` in local scope; `export type Color = ColorToken` fails with "Cannot find name 'ColorToken'".

**Resolution:**
1. Changed `DomainNavButtonProps` to `Omit<Extract<ButtonProps, { href: string }>, ...>` — extracts the anchor-only union arm before Omitting, making the resulting event handlers anchor-specific only.
2. Changed `export type Color = ColorToken` to `export type { ColorToken as Color } from './fixtures'` — re-exports the type with an alias, no local binding needed.

**Gap / LLM pause:** None.

---

## 2026-03-02 — Bootstrap: PLAYBOOK.md rewritten as universal guide

**What happened:** Replaced CRM-specific `PLAYBOOK.md` with a universal app-agnostic guide covering: locked/domain/UI layer separation (Section 0), Quick Start Journey mermaid (Section 1), Entity Design Guide with CRM as worked example (Section 2), Quality Gates with full command table (Section 3), JOURNAL format spec (Section 4), Coverage Matrix (Section 5), No-Skip Checklist with `{APP_NAME}` placeholder (Section 6), Quick Rescue Paths (Section 7). JOURNAL.md initialized.

**Obstacle / Error:** None.

**Resolution:** N/A.

**Gap / LLM pause:** None.

---

## 2026-03-02 — Bootstrap: apps/dsl-crm scaffold started

**What happened:** Beginning Stage A — creating `apps/dsl-crm` with: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `postcss.config.js`, `index.html`, `.env.example`, `ui8kit.config.json`. CRM domain: Dashboard / Tasks / Kanban / Reports / Admin.

**Obstacle / Error:** none yet.

**Resolution:** N/A.

**Gap / LLM pause:** None.

---

## 2026-03-02 — Build: apps/dsl-crm full implementation

**What happened:** Completed all layers of `apps/dsl-crm`:
- **Locked layer** copied from `apps/dsl`: `src/components/`, `src/variants/`, `src/lib/`, `src/assets/css/`
- **Fixtures**: `fixtures/shared/{site,navigation,page}.json`, `dashboard.json`, `tasks.json`, `kanban.json`, `reports.json`, `admin.json`
- **Types**: `src/types/{common,navigation,layout,dashboard,tasks,kanban,reports,index}.ts`
- **Adapters**: `src/data/adapters/{types,fixtures.adapter}.ts`
- **Context**: `src/data/context.ts` — `crm` domain (dashboard/tasks/kanban/reports) + `admin` domain
- **Providers**: `src/providers/{AdminAuthContext,theme}.tsx`
- **Hooks**: `useAdminNav`, `useAdminActions`, `useLoginForm`
- **Layouts**: `MainLayout`, `AdminLayout` (with views/MainLayoutView)
- **Partials**: `Header`, `Footer`, `Sidebar`, `DomainNavButton`, `ThemeToggle`
- **Blocks**: `DashboardPageView`, `TasksPageView`, `KanbanPageView`, `ReportsPageView`, `AdminLoginPageView`, `AdminDashboardPageView`, `HeroBlock`, `SidebarContent`, `DashSidebar`
- **Routes**: `landing/DashboardPage`, `tasks/TasksPage`, `kanban/KanbanPage`, `reports/ReportsPage`, `admin/{LoginPage,DashboardPage}`
- **App**: `src/App.tsx` with routes `/`, `/tasks`, `/kanban`, `/reports`, `/admin`, `/admin/dashboard`
- **Config**: `maintain.config.json`, `blueprint.json` seed, `scripts/finalize-dist.ts`

**Obstacle / Error:**
1. `gap="3"` in KanbanPageView — invalid value (allowed: 0,1,2,4,6,8,10,12). Fixed to `gap="4"`.
2. DSL lint (UNWRAPPED_VAR) — 17 warnings: every `<Var>` must be wrapped in `<If>` even for required/loop values. Fixed all 4 page views.
3. Badge `<Var>` for task priority/status also required `<If>` wrapping.

**Resolution:**
1. Changed `gap="3"` → `gap="4"` in KanbanPageView column cards stack.
2. Wrapped all `<Var>` in `<If test="..." value={!!...}>` blocks in DashboardPageView, TasksPageView, KanbanPageView, ReportsPageView.

**Gap / LLM pause:** The DSL linter rule (UNWRAPPED_VAR must always be inside `<If>`) is not documented in the architecture rule file — discovered by running `lint:dsl`. Now documented in this journal entry as a key pattern.

---

## 2026-03-02 — Gates: All mandatory gates passed

**What happened:** Ran full gate chain on `apps/dsl-crm`:

| Gate | Command | Result |
|---|---|---|
| DSL lint | `bun run lint:dsl` | ✅ PASSED — 44 files, 0 violations |
| Semantic validate | `bun run validate` | ✅ PASSED — "Validation passed." |
| TypeScript | `bun run typecheck` | ✅ PASSED — `tsc --noEmit` exit 0 |
| Workspace typecheck | `bun run typecheck` (root) | ✅ PASSED — 6 tasks successful |

**Obstacle / Error:** See previous entry for fixes applied before gates passed.

**Resolution:** All gates pass after fixes.

**Gap / LLM pause:** None.

---
