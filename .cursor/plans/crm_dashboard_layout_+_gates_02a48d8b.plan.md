---
name: CRM Dashboard Layout + Gates
overview: Создать CrmLayout с desktop-сайдбаром слева и мобильным Sheet, применить его ко всем CRM-страницам, затем пройти все оставшиеся PLAYBOOK-gates (maintain, blueprint, generate, finalize).
todos:
  - id: crm-layout
    content: "Create src/layouts/CrmLayout.tsx: desktop aside-left + mobile Sheet burger, useLocation for active links, ghost variants"
    status: pending
  - id: layouts-index
    content: Export CrmLayout from src/layouts/index.ts
    status: pending
  - id: theme-toggle
    content: "Update ThemeToggle: change variant from link to ghost for both buttons"
    status: pending
  - id: page-views
    content: Update DashboardPageView, TasksPageView, KanbanPageView, ReportsPageView to use CrmLayout instead of MainLayout
    status: pending
  - id: journal-layout
    content: Log layout stage in JOURNAL.md (what happened, any obstacles, decisions)
    status: pending
  - id: gate-critical
    content: "Run critical gates: lint:dsl, validate, maintain:validate, maintain:check, typecheck, blueprint:scan, blueprint:validate — fix all errors, log in JOURNAL.md"
    status: pending
  - id: gate-high
    content: "Run high gates: build:map, maintain:props, blueprint:graph, lint — fix errors, log in JOURNAL.md"
    status: pending
  - id: gate-release
    content: "Run release gates: generate, finalize, cd ../react-crm && typecheck — fix errors, log in JOURNAL.md"
    status: pending
isProject: false
---

# CRM Dashboard Layout + All PLAYBOOK Gates

## Current state

- CRM pages (Dashboard, Tasks, Kanban, Reports) use `MainLayout mode="full"` — sidebar отсутствует, навигация в шапке
- `AdminLayout` уже реализует нужный паттерн: desktop aside + mobile Sheet через `beforeThemeToggle`
- `context.domains.crm.sidebarLinks` содержит готовые ссылки: Dashboard `/`, Tasks `/tasks`, Kanban `/kanban`, Reports `/reports`
- `ThemeToggle` использует `variant="link"` — нужен `"ghost"`
- Из PLAYBOOK gates пройдены только: `lint:dsl`, `validate`, `typecheck`

---

## Track 1 — CRM Dashboard Layout

### Target layout structure

```
Desktop:
┌──────────────── header (logo + theme ghost) ────────────────┐
│ aside (w-64)  │         main (flex-1)                        │
│ DashSidebar   │         {children}                           │
└───────────────┴──────────────────────────────────────────────┘

Mobile header:
┌─── logo ─────────────── [burger ghost] [theme ghost] ────────┐
Sheet (left): DashSidebar nav
```

### File 1 — NEW `src/layouts/CrmLayout.tsx`

Pattern: mirrors `AdminLayout` but takes `sidebarLinks` (from `context.domains.crm.sidebarLinks`) and uses `useLocation` for active state.

```tsx
// Desktop: hidden md:flex aside w-64 + flex-1 main
// Mobile: burger via Header beforeThemeToggle → Sheet(side="left")
// Sheet triggerVariant="ghost", ThemeToggle variant="ghost"
```

Key props:

- `children: ReactNode`
- `sidebar?: ReactNode` — defaults to `DashSidebar` built inside

Inside `CrmLayout`:

- `const location = useLocation()` — compute `active` for each link
- Map `context.domains.crm.sidebarLinks` → `DashboardSidebarLink[]` with `active: location.pathname === link.href`
- Pass mapped links to `DashSidebar`
- `beforeThemeToggle` slot in Header renders the Sheet burger trigger (ghost, `className="flex md:hidden"`)

### File 2 — EDIT `src/layouts/index.ts`

Add `export { CrmLayout } from './CrmLayout'` and its type.

### File 3 — EDIT `src/partials/ThemeToggle.tsx`

Change both `variant="link"` → `variant="ghost"`. Size stays `"icon"` / `"sm"`.

### File 4–7 — EDIT all 4 CRM PageViews

Replace `<MainLayout navItems={context.navItems} mode="full">` with `<CrmLayout>` (no props needed, layout reads context internally):

- `[apps/dsl-crm/src/blocks/landing/DashboardPageView.tsx](apps/dsl-crm/src/blocks/landing/DashboardPageView.tsx)`
- `[apps/dsl-crm/src/blocks/tasks/TasksPageView.tsx](apps/dsl-crm/src/blocks/tasks/TasksPageView.tsx)`
- `[apps/dsl-crm/src/blocks/kanban/KanbanPageView.tsx](apps/dsl-crm/src/blocks/kanban/KanbanPageView.tsx)`
- `[apps/dsl-crm/src/blocks/reports/ReportsPageView.tsx](apps/dsl-crm/src/blocks/reports/ReportsPageView.tsx)`

---

## Track 2 — PLAYBOOK Gates (not yet passed)

Run from `apps/dsl-crm` in order. Log each result in `JOURNAL.md`.

### Stage 3 — Critical gates

```
bun run lint:dsl
bun run validate
bun run maintain:validate   ← not yet run
bun run maintain:check      ← not yet run
bun run typecheck
bun run blueprint:scan      ← not yet run
bun run blueprint:validate  ← not yet run
```

### Stage 4 — High gates

```
bun run build:map           ← not yet run
bun run maintain:props      ← not yet run
bun run blueprint:graph     ← not yet run
bun run lint                ← not yet run
```

### Stage 5 — Release

```
bun run generate            ← not yet run
bun run finalize            ← not yet run
cd ../react-crm && bun run typecheck  ← not yet run
```

---

## JOURNAL entries

Append to `[.project/JOURNAL.md](.project/JOURNAL.md)` after:

- Layout created and dev server verified
- Each gate result (pass or fail + fix)
- Any structural decision or unexpected error

