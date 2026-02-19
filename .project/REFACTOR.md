# Brand Refactor Guide

This guide is for AI agents performing a full brand/domain refactor of the `@ui8kit/resta-app` project. After cloning, all brand-specific entities listed below must be replaced. The `audit:refactor` script is used to verify no legacy terms remain.

---

## Step 0 — Fill in Brand Variables

Before starting, define all values in the table below. These are the substitution targets referenced throughout this guide and in `scripts/schemas/brand-mapping.json`.

### Identity

| Variable | Current (RestA) | New Brand Value |
|----------|-----------------|-----------------|
| `{BRAND_NAME}` | `RestA` | _(fill in)_ |
| `{brand_slug}` | `resta` | _(fill in, lowercase-hyphen)_ |
| `{BRAND_TAGLINE}` | `Restaurant & Bar` | _(fill in)_ |
| `{BRAND_PITCH}` | `Fine dining experience...` | _(fill in)_ |
| `{BRAND_CTA}` | `Reserve your table today.` | _(fill in)_ |
| `{DEV_PORT}` | `3020` | _(fill in or keep)_ |

### Domain Mapping

| Domain | Current Name | Current Route | New Name | New Route |
|--------|-------------|--------------|----------|-----------|
| **Catalog** — primary product listing | `Menu` | `/menu`, `/menu/:id` | _(fill in)_ | _(fill in)_ |
| **Guide** — how-to / content section | `Recipes` | `/recipes`, `/recipes/:slug` | _(fill in)_ | _(fill in)_ |
| **Promo** — offers / deals | `Promotions` | `/promotions`, `/promotions/:id` | _(fill in)_ | _(fill in)_ |

### Domain Code Names

Derived from the domain names above. Used in component names, context keys, fixture files.

| Variable | Current | New Value |
|----------|---------|-----------|
| `{ProductDomain}` | `Menu` | _(PascalCase, e.g. `Catalog`)_ |
| `{productDomain}` | `menu` | _(camelCase, e.g. `catalog`)_ |
| `{product-domain}` | `menu` | _(kebab-case, e.g. `catalog`)_ |
| `{GuideDomain}` | `Recipes` | _(PascalCase, e.g. `Tutorials`)_ |
| `{guideDomain}` | `recipes` | _(camelCase)_ |
| `{guide-domain}` | `recipes` | _(kebab-case)_ |
| `{PromoDomain}` | `Promotions` | _(PascalCase, e.g. `Offers`)_ |
| `{promoDomain}` | `promotions` | _(camelCase)_ |
| `{promo-domain}` | `promotions` | _(kebab-case)_ |

---

## Step 1 — Rename Fixture Files

Rename fixture files in `fixtures/`:

```
fixtures/menu.json        → fixtures/{productDomain}.json
fixtures/recipes.json     → fixtures/{guideDomain}.json
fixtures/promotions.json  → fixtures/{promoDomain}.json
```

Files that don't need renaming: `landing.json`, `blog.json`, `admin.json`, `shared/`.

Replace content inside fixture files with new brand data (title, subtitle, items, etc.).

---

## Step 2 — Update `fixtures/shared/`

### `fixtures/shared/site.json`
```json
{ "title": "{BRAND_NAME}", "subtitle": "{BRAND_TAGLINE}", "description": "{BRAND_PITCH}" }
```

### `fixtures/shared/navigation.json`
- Replace `navItems` labels: `"Menu"` → new catalog label, `"Recipes"` → new guide label, `"Promotions"` → new promo label
- Replace `href` values: `/menu` → `/{product-domain}`, `/recipes` → `/{guide-domain}`, `/promotions` → `/{promo-domain}`
- Update `sidebarLinks` accordingly

### `fixtures/shared/page.json`
Replace all route entries:
- `/menu` → `/{product-domain}`, component `{ProductDomain}Page`
- `/menu/:id` → `/{product-domain}/:id`, component `{ProductDomain}DetailPage`
- `/recipes` → `/{guide-domain}`, component `{GuideDomain}Page`
- `/recipes/:slug` → `/{guide-domain}/:slug`, component `{GuideDomain}DetailPage`
- `/promotions` → `/{promo-domain}`, component `{PromoDomain}Page`
- `/promotions/:id` → `/{promo-domain}/:id`, component `{PromoDomain}DetailPage`

Also update page `id` and `title` fields to match new brand.

### `fixtures/landing.json`
```json
{
  "title": "Welcome to {BRAND_NAME}",
  "subtitle": "{BRAND_PITCH}. {BRAND_CTA}",
  "ctaText": "View {ProductDomain}",
  "ctaUrl": "/{product-domain}",
  "secondaryCtaText": "Our {GuideDomain}",
  "secondaryCtaUrl": "/{guide-domain}"
}
```

### `fixtures/admin.json`
Update `exportSchema` keys to match new domain names:
```json
{ "exportSchema": { "{productDomain}": "items", "{guideDomain}": "items", "blog": "posts", "{promoDomain}": "items" } }
```

---

## Step 3 — Rename Route Files

In `src/routes/`:

```
MenuPage.tsx        → {ProductDomain}Page.tsx
MenuDetailPage.tsx  → {ProductDomain}DetailPage.tsx
RecipesPage.tsx     → {GuideDomain}Page.tsx
RecipeDetailPage.tsx → {GuideDomain}DetailPage.tsx
PromotionsPage.tsx  → {PromoDomain}Page.tsx
PromotionDetailPage.tsx → {PromoDomain}DetailPage.tsx
```

Inside each renamed file, update:
- Component name (function name)
- Import paths (`from '@/blocks'`)
- Context key: `context.menu` → `context.{productDomain}`, etc.
- Block view component name

---

## Step 4 — Rename Block View Files

In `src/blocks/`:

```
MenuPageView.tsx        → {ProductDomain}PageView.tsx
MenuDetailPageView.tsx  → {ProductDomain}DetailPageView.tsx
RecipesPageView.tsx     → {GuideDomain}PageView.tsx
RecipeDetailPageView.tsx → {GuideDomain}DetailPageView.tsx
PromotionsPageView.tsx  → {PromoDomain}PageView.tsx
PromotionDetailPageView.tsx → {PromoDomain}DetailPageView.tsx
```

Inside each file, update component names and all references to old domain terms.

Update `src/blocks/index.ts` to export the renamed components.

---

## Step 5 — Update `src/data/context.ts`

- Update fixture import paths to match new file names
- Rename context fixture keys: `menu` → `{productDomain}`, `recipes` → `{guideDomain}`, `promotions` → `{promoDomain}`
- Update the exported `context` object with new key names
- Update `dynamicRoutePatterns` array with new route patterns

---

## Step 6 — Update `src/App.tsx`

- Update import statements: new route component names
- Update `<Route path=...>` entries with new paths and components

---

## Step 7 — Update Layout Defaults

In `src/layouts/views/MainLayoutView.tsx` (and `dist/react/` equivalent):
- Replace `'RestA'` → `'{BRAND_NAME}'` in Header title default
- Replace `'Restaurant & Bar'` → `'{BRAND_TAGLINE}'` in Header subtitle default
- Replace `'© 2025 RestA. All rights reserved.'` → `'© 2025 {BRAND_NAME}. All rights reserved.'` in Footer copyright default

In `src/layouts/AdminLayout.tsx` (and generated counterpart):
- Replace `"RestA"` and `"Restaurant & Bar"` in hardcoded Header props

---

## Step 8 — Update Providers

In `src/providers/theme.tsx`:
- Replace `'resta-theme'` → `'{brand_slug}-theme'` (STORAGE_KEY)
- Replace `'RestA'` in theme name
- Update `restaTheme` constant name to `{brandSlug}Theme`

In `src/providers/AdminAuthContext.tsx`:
- Replace `'resta-admin-auth'` → `'{brand_slug}-admin-auth'` (STORAGE_KEY)

---

## Step 9 — Update Config & Package

### `package.json`
- `"name"`: `"@ui8kit/resta-app"` → `"@ui8kit/{brand_slug}-app"`

### `vite.config.ts`
- `port: 3020` → `port: {DEV_PORT}`

### `index.html`
- `<title>RestA — Restaurant & Bar</title>` → `<title>{BRAND_NAME} — {BRAND_TAGLINE}</title>`
- Update `localStorage.getItem('resta-theme')` → `localStorage.getItem('{brand_slug}-theme')`

### `ui8kit.config.json` / `src/ui8kit.config.json`
- Update any brand-specific fields if present

---

## Step 10 — Update CSS / Theme Tokens

In `src/css/shadcn.css`:
- Adjust color tokens (`--primary`, `--secondary`, `--accent`, `--radius`) to match new brand palette
- Color direction is defined by the new brand's design

---

## Step 11 — Run Verification

Run all checks in order:

```bash
# 1. Lint DSL rules (no raw .map(), ternary, && in JSX)
bun run lint:dsl

# 2. Validate config + DSL
bun run validate

# 3. Check architectural invariants (routes, fixtures, blocks export, context)
bun run validate:invariants

# 4. Scan for residual old brand terms — must show 0 errors
bun run audit:refactor

# 5. Start dev server and verify all pages render
bun run dev
```

The `audit:refactor` report is saved to `.cursor/reports/refactor-audit-*.json`. **Do not mark refactor complete if `severity: "error"` entries have `residualCount > 0`.**

---

## Step 12 — Generate Standalone Dist (optional)

If generating a standalone dist app without DSL:

```bash
# Clean previous dist
bun run clean:dist

# Generate blocks/layouts/partials (DSL → plain React)
bun run generate

# Assemble into runnable Vite app
bun run finalize

# Test the result
cd dist/react && bun install && bun run dev
```

---

## File Checklist

| File / Directory | Action | Key Replacements |
|-----------------|--------|-----------------|
| `fixtures/shared/site.json` | Edit | brand name, tagline, description |
| `fixtures/shared/navigation.json` | Edit | nav labels, href paths, sidebar links |
| `fixtures/shared/page.json` | Edit | route paths, page IDs, component names |
| `fixtures/landing.json` | Edit | title, subtitle, ctaText, ctaUrl |
| `fixtures/menu.json` | Rename + Edit | new catalog domain content |
| `fixtures/recipes.json` | Rename + Edit | new guide domain content |
| `fixtures/promotions.json` | Rename + Edit | new promo domain content |
| `fixtures/admin.json` | Edit | exportSchema keys |
| `src/App.tsx` | Edit | imports, route paths, component names |
| `src/data/context.ts` | Edit | imports, fixture keys, dynamicRoutePatterns |
| `src/routes/MenuPage.tsx` | Rename + Edit | component name, context key |
| `src/routes/MenuDetailPage.tsx` | Rename + Edit | component name, context key |
| `src/routes/RecipesPage.tsx` | Rename + Edit | component name, context key |
| `src/routes/RecipeDetailPage.tsx` | Rename + Edit | component name, context key |
| `src/routes/PromotionsPage.tsx` | Rename + Edit | component name, context key |
| `src/routes/PromotionDetailPage.tsx` | Rename + Edit | component name, context key |
| `src/blocks/MenuPageView.tsx` | Rename + Edit | component name, domain references |
| `src/blocks/MenuDetailPageView.tsx` | Rename + Edit | component name |
| `src/blocks/RecipesPageView.tsx` | Rename + Edit | component name |
| `src/blocks/RecipeDetailPageView.tsx` | Rename + Edit | component name |
| `src/blocks/PromotionsPageView.tsx` | Rename + Edit | component name |
| `src/blocks/PromotionDetailPageView.tsx` | Rename + Edit | component name |
| `src/blocks/index.ts` | Edit | export statements |
| `src/blocks/LandingPageView.tsx` | Edit | ctaUrl, secondaryCtaUrl |
| `src/layouts/views/MainLayoutView.tsx` | Edit | Header/Footer hardcoded defaults |
| `src/layouts/AdminLayout.tsx` | Edit | Header hardcoded title/subtitle |
| `src/providers/theme.tsx` | Edit | storage key, theme name constant |
| `src/providers/AdminAuthContext.tsx` | Edit | storage key |
| `package.json` | Edit | package name |
| `vite.config.ts` | Edit | port number |
| `index.html` | Edit | title, localStorage key |
| `src/css/shadcn.css` | Edit | color tokens for new brand palette |

---

## Anti-Hallucination Rules

- Do not invent new files, scripts, or APIs.
- Do not claim `audit:refactor` passed without actually running it.
- If a `from` term has `severity: "error"` and residualCount > 0, fix it — do not skip.
- Preserve all DSL rules: use `<If>`, `<Loop>`, `<Var>` — no raw `.map()`, ternary, `&&` in JSX.
- Run `bun run lint:dsl` after every batch of block/layout changes.

---

## Mapping Reference

All brand entities and their code locations are documented in:
```
scripts/schemas/brand-mapping.json
```

Each entry has:
- `from` — current (RestA) term to search and replace
- `to` — what it becomes in the new brand (placeholder description)
- `severity` — `"error"` = must replace, `"warn"` = should review
- `note` — which files/contexts the term appears in
