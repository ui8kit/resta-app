# Report: JS Usage in Project

> Log of where JavaScript is involved for business logic. Used to plan a minimal JS bundle for pure HTML + CSS export.

## Package Scripts (package.json)

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | vite | Dev server |
| `build` | vite build | Production build |
| `preview` | vite preview | Preview build |
| `download-fonts` | bun run scripts/download-fonts.ts | Download Nunito fonts (build-time) |
| `generate` | bunx ui8kit-generate | Generate static output |
| `finalize` | bun run scripts/finalize-dist.ts | Finalize dist for standalone app |
| `dist:app` | generate + finalize | Full dist pipeline |
| `validate` | bunx ui8kit-validate | Validate props + DSL |
| `validate:fixtures` | bun run scripts/validate-fixtures.ts | Validate fixtures against schemas |
| `validate:invariants` | bun run scripts/validate-invariants.ts | Invariant checks |
| `lint:dsl` | bunx ui8kit-lint-dsl | Lint DSL usage |
| `lint` | bunx ui8kit-lint | General lint |
| `audit:refactor` | bun run scripts/refactor-audit.ts | Refactor audit |
| `build:props` | bun run scripts/build-props-classlist.ts | Build props classlist |
| `clean` | bash scripts/clean-workspace.sh | Clean workspace |
| `clean:dist` | bash scripts/clean-engine.sh | Clean dist |

## Scripts in scripts/

| File | Purpose | JS for |
|------|---------|--------|
| `download-fonts.ts` | Fetch Nunito woff2 from Google Fonts | Build-time only |
| `validate-fixtures.ts` | Validate fixtures vs JSON schemas (Ajv) | Build-time only |
| `finalize-dist.ts` | Post-process generated dist | Build-time only |
| `build-props-classlist.ts` | Generate props → classlist map | Build-time only |
| `validate-invariants.ts` | Invariant validation | Build-time only |
| `refactor-audit.ts` | Refactor audit | Build-time only |
| `scaffold-app.ts` | Scaffold app | Build-time only |
| `scaffold-config.ts` | Scaffold config | Build-time only |

## Runtime JS (business logic in src/)

### Auth & Session

| Location | Hook / Handler | Purpose |
|----------|----------------|---------|
| `providers/AdminAuthContext.tsx` | `useState`, `useEffect`, `useCallback` | Auth state, localStorage persistence |
| `providers/AdminAuthContext.tsx` | `login()`, `logout()` | Credentials check, session clear |
| `blocks/admin/LoginPageView.tsx` | `useState` (username, password, error) | Form state |
| `blocks/admin/LoginPageView.tsx` | `onSubmit`, `onChange` | Form submit, input binding |
| `blocks/admin/LoginPageView.tsx` | `useNavigate` | Redirect after login |
| `blocks/admin/DashboardPageView.tsx` | `useNavigate`, `handleLogout` | Logout + redirect |
| `blocks/admin/DashboardPageView.tsx` | `handleExport`, `handleImportClick`, `handleFileChange` | Export/import JSON |
| `partials/Header.tsx` | `useAdminAuth`, `useNavigate`, `handleLogout` | Logout icon + action when authenticated |

### Theme (dark/light)

| Location | Hook / Handler | Purpose |
|----------|----------------|---------|
| `providers/theme.tsx` | `useState`, `useEffect` | Theme state, localStorage, class on `<html>` |
| `partials/ThemeToggle.tsx` | `onClick={toggleDarkMode}` | Toggle theme |

### UI Interactivity

| Location | Hook / Handler | Purpose |
|----------|----------------|---------|
| `partials/Header.tsx` | `onClick` (mobile sheet) | Close sheet after nav click |
| `components/Accordion.tsx` | `useState`, `useCallback`, `onClick` | Accordion expand/collapse |
| `layouts/AdminLayout.tsx` | `onClick` | Sheet trigger / close |

### Routing

| Location | Purpose |
|----------|---------|
| `react-router-dom` | Client-side routing (Routes, Route, useNavigate, useParams) |
| `main.tsx` | BrowserRouter wrapper |

## Minimal JS Bundle (for pure HTML + CSS)

To produce a static HTML + CSS site with minimal JS:

1. **Remove** (or replace with static):
   - Auth flow (login/logout) → static content or server-side auth
   - Theme toggle → CSS-only (prefers-color-scheme) or static class
   - Accordion → CSS `details/summary` or static expanded
   - Sheet (mobile menu) → CSS-only hamburger or static nav
   - React Router → static pages, no SPA

2. **Keep** (if needed):
   - Theme toggle (localStorage + class) — ~50 lines
   - Accordion (expand/collapse) — ~30 lines
   - Mobile sheet (open/close) — ~20 lines

3. **Build-time scripts** stay as-is (run during build, not in browser).
