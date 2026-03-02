# UI8Kit DSL — Onboarding (101)

Complete introduction to building valid DSL applications with UI8Kit. After reading, you will be able to create interfaces without tech debt, hardcode, and with architecture compliance.

---

## Contents

1. [What this project is](#1-what-this-project-is)
2. [Environment and first commands](#2-environment-and-first-commands)
3. [Monorepo structure](#3-monorepo-structure)
4. [Key concepts](#4-key-concepts)
5. [Data flow](#5-data-flow)
6. [DSL components: If, Var, Loop, Slot](#6-dsl-components-if-var-loop-slot)
7. [Semantic props and data-class](#7-semantic-props-and-data-class)
8. [Where to put new code](#8-where-to-put-new-code)
9. [Config files: ui8kit, maintain, blueprint](#9-config-files-ui8kit-maintain-blueprint)
10. [Commands and workflow](#10-commands-and-workflow)
11. [Validation and linting](#11-validation-and-linting)
12. [React and HTML+CSS generation](#12-react-and-htmlcss-generation)
13. [Anti-patterns — what to avoid](#13-anti-patterns--what-to-avoid)
14. [First task step by step](#14-first-task-step-by-step)
15. [Pre-commit checklist](#15-pre-commit-checklist)

---

## 1. What this project is

**UI8Kit** is a design system and pipeline for building web applications. Features:

- **DSL (Domain-Specific Language)** — Instead of plain JS in JSX, you use components `<If>`, `<Var>`, `<Loop>`, `<Slot>`. This allows generating not only React but also plain HTML+CSS.
- **Fixtures** — Content lives in JSON (`fixtures/*.json`), not in code. No hardcode.
- **Semantics** — Props (`gap="6"`, `bg="primary"`) map to Tailwind classes. No `className` or `style`.
- **Valid HTML5** — Semantic tags are used (`section`, `article`, `header`, `nav`, `main`, `footer`).

**Your goal:** Learn to write blocks and pages so they pass validation and generate correctly to React and HTML+CSS.

---

## 2. Environment and first commands

### Installing Bun

The project uses **Bun** as runtime and package manager:

```bash
# Windows (PowerShell)
irm bun.sh/install.ps1 | iex

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

### Basic commands

```bash
# Install dependencies (from repo root)
bun install

# Run dev server for DSL app
cd apps/dsl
bun run dev

# Run design system
cd apps/dsl-design
bun run dev
```

After `bun run dev`, the app opens (usually http://localhost:3020 or another port from config).

---

## 3. Monorepo structure

```
@ui8kit-resta-app/
├── apps/
│   ├── dsl/              ← Main DSL app (restaurant)
│   ├── dsl-design/       ← Design system (component/token preview)
│   ├── react/            ← Generated React (from dsl)
│   └── react-design/     ← Generated React (from dsl-design)
├── packages/
│   ├── maintain/         ← Checkers, clean, audit
│   ├── generator/        ← React, HTML, CSS generation
│   ├── dsl/              ← If, Var, Loop, Slot
│   ├── sdk/              ← createContext, types
│   └── lint/             ← ui8kit-lint-dsl
├── .project/             ← Project docs (including this guide)
└── .cursor/rules/        ← AI rules (best-practices, architecture)
```

**Working apps:**

- `apps/dsl` — main DSL code (blocks, routes, fixtures)
- `apps/dsl-design` — design system (component/token/typography preview)

**Generated apps** (`react`, `react-design`) — output of `bun run generate`. They are not edited by hand.

---

## 4. Key concepts

### 4.1 Block

A **Block** is a reusable page section or a full page. Examples: `HeroBlock`, `SidebarContent`, `MenuPageView`.

- **Section block** — part of a page (HeroBlock, card)
- **PageView** — full page (LandingPageView, MenuPageView)

### 4.2 Fixtures

**Fixtures** are JSON files with data. All content comes from here.

```
fixtures/
├── shared/           # site.json, page.json, navigation.json
├── landing.json
├── menu.json
├── recipes.json
├── blog.json
├── promotions.json
└── admin.json
```

Example `fixtures/landing.json`:

```json
{
  "title": "Welcome to RestA",
  "subtitle": "Experience fine dining...",
  "ctaText": "View Menu",
  "ctaUrl": "/menu",
  "secondaryCtaText": "Our Recipes",
  "secondaryCtaUrl": "/recipes"
}
```

### 4.3 Context

**Context** is the single entry point for data. `context.ts` loads fixtures and passes them to routes and blocks.

```tsx
// In a route
import { context } from '@/data/context';

<LandingPageView landing={context.landing} navItems={context.navItems} ... />
```

### 4.4 Routes

**Routes** map URLs to PageViews and pass data from context.

```tsx
// src/App.tsx
<Route path="/" element={<LandingPage />} />
<Route path="/menu" element={<MenuPage />} />
<Route path="/menu/:slug" element={<MenuDetailPage />} />
```

### 4.5 Layouts and Partials

- **Layout** — page wrapper (MainLayout, AdminLayout). Contains header, sidebar, main, footer.
- **Partial** — reusable fragment (Header, Footer, ThemeToggle, SidebarContent).

---

## 5. Data flow

```
fixtures/*.json
    → src/data/adapters/fixtures.adapter.ts
    → src/data/context.ts (createContext)
    → src/routes/*.tsx (pass data to PageView)
    → src/blocks/*PageView.tsx (render with Var, Loop, If)
```

**Important:** Data always comes from context or props. Hardcoded strings, numbers, or arrays in JSX are not allowed.

---

## 6. DSL components: If, Var, Loop, Slot

In JSX you **must not** use:

- `?.` (optional chaining for conditional render)
- `&&` for conditional render
- `{condition ? 'a' : 'b'}`
- `.map()` for lists

Use **DSL components** from `@ui8kit/dsl` instead.

### 6.1 Var — output a value

```tsx
// ✅ Correct
<Var name="title" value={title} />

// ❌ Wrong
{title}
{item?.name}
```

`name` — label for debugging/generation. `value` — the actual value.

### 6.2 If — conditional render

```tsx
// ✅ Correct
<If test="subtitle" value={!!subtitle}>
  <Text data-class="hero-subtitle">
    <Var name="subtitle" value={subtitle} />
  </Text>
</If>

// ❌ Wrong
{subtitle && <Text>{subtitle}</Text>}
{subtitle ? <Text>{subtitle}</Text> : null}
```

### 6.3 Loop — iterate over array

```tsx
// ✅ Correct (render prop)
<Loop each="items" as="item" data={items}>
  {(item: { id: string; title: string }) => (
    <Card key={item.id} data-class="item-card">
      <CardHeader>
        <CardTitle order={4}><Var name="item.title" value={item.title} /></CardTitle>
      </CardHeader>
    </Card>
  )}
</Loop>

// ❌ Wrong
{items.map(item => (
  <Card key={item.id}>...</Card>
))}
```

### 6.4 Slot — content slot

```tsx
<Slot name="extra">{children}</Slot>
```

### 6.5 Rule for optional values

If a value can be `undefined` or `null`, wrap `<Var>` in `<If>`:

```tsx
<If test="subtitle" value={!!subtitle}>
  <Text><Var name="subtitle" value={subtitle} /></Text>
</If>
```

### 6.6 UNWRAPPED_VAR — every `<Var>` must be inside `<If>`

The DSL linter (`lint:dsl`) enforces rule **UNWRAPPED_VAR**: **every** `<Var>` — including inside `<Loop>` and for non-optional fields — must be wrapped in `<If>`. This is required for the static HTML generator to emit safe, conditional output.

```tsx
// ❌ Wrong — even inside Loop, even if field is required
<Loop each="items" as="item" data={items}>
  {(item) => (
    <Card key={item.id} data-class="item-card">
      <CardTitle order={4}>
        <Var name="item.title" value={item.title} />
      </CardTitle>
    </Card>
  )}
</Loop>

// ✅ Correct — wrap in If even for required fields
<Loop each="items" as="item" data={items}>
  {(item) => (
    <Card key={item.id} data-class="item-card">
      <CardTitle order={4}>
        <If test="item.title" value={!!item.title}>
          <Var name="item.title" value={item.title} />
        </If>
      </CardTitle>
    </Card>
  )}
</Loop>
```

This rule applies to: page props, loop item fields, badge/badge-variant values, all other `<Var>` usages.

---

## 7. Semantic props and data-class

### 7.1 Not allowed

- `className` — do not use
- `style={{ ... }}` — do not use
- Raw HTML tags (`<div>`, `<span>`, `<h1>`, `<p>`) — do not use

### 7.2 Allowed

Imports from `@ui8kit/core`:

- **Layout:** Block, Stack, Group, Grid, Container, Box
- **Content:** Title, Text, Image, Icon, Badge, Button
- **Composites:** Card, CardHeader, CardTitle, CardContent, Accordion, Sheet, Field

Every semantic element must have **`data-class`**:

```tsx
<Block component="section" data-class="hero-section">
<Stack data-class="hero-content">
<Title data-class="hero-title">
<Button data-class="hero-cta">
```

### 7.3 Semantic props

| Prop | Examples | Description |
|------|----------|-------------|
| `gap` | `"0"`, `"2"`, `"4"`, `"6"`, `"8"` | Spacing between elements |
| `p`, `px`, `py` | `"4"`, `"8"`, `"16"` | Padding |
| `flex` | `"col"`, `"row"`, `"wrap"` | Flex direction |
| `items` | `"start"`, `"center"`, `"end"` | Alignment |
| `justify` | `"between"`, `"center"`, `"end"` | Main-axis alignment |
| `fontSize` | `"sm"`, `"lg"`, `"2xl"`, `"4xl"` | Font size |
| `fontWeight` | `"normal"`, `"medium"`, `"bold"` | Weight |
| `textColor` | `"foreground"`, `"muted-foreground"`, `"primary"` | Text color |
| `bg` | `"primary"`, `"secondary"`, `"muted"`, `"card"` | Background |
| `variant` (Button) | `"primary"`, `"outline"`, `"secondary"` | Button variant |

### 7.4 Colors — tokens only

```tsx
// ✅ Correct
<Block bg="primary" data-class="hero">
<Button variant="primary">
<Text textColor="muted-foreground">

// ❌ Wrong
<Block bg="blue-500">
<Button className="bg-[#3b82f6]">
```

### 7.5 Semantic HTML5 and `component` prop

Use `component` for semantic tags. Allowed tags are defined in `component-tag-map.json` (package `@ui8kit/generator`). Validation is done via HtmlConverterService, Maintain checker, and ui8kit-validate.

**Block** — sectioning:

```tsx
<Block component="section" data-class="hero-section">   // page section
<Block component="article" data-class="feature-card">    // card, article
<Block component="header" data-class="page-header">     // header
<Block component="nav" data-class="main-nav">          // navigation
<Block component="main" data-class="page-main">        // main content
<Block component="footer" data-class="page-footer">    // footer
<Block component="aside" data-class="sidebar">        // sidebar
<Block component="figure" data-class="hero-image">     // figure
<Block component="form" data-class="contact-form">     // form
```

**Box / Container** — layout containers: `div`, `form`, `blockquote`.

**Text** — typography: `p`, `h1`–`h6`, `span`, `label`, `cite`, `q`, `figcaption`, etc.

**Stack / Group** — layout: `div`, `span` (span only inside `<a>` for inline).

**Field** — form elements: `input`, `textarea`, `select`, `button`.

Full map: `packages/generator/src/lib/component-tag-map.json`.

---

## 9. Config files: ui8kit, maintain, blueprint

Every app needs three config files in its root directory. Copy them from `apps/dsl` and adapt.

### 9.1 ui8kit.config.json — main app config

Consumed by `ui8kit-validate`, `ui8kit-generate`, and `ui8kit-lint`. Controls generation output, aliases, lint settings.

```json
{
  "$schema": "https://ui.buildy.tw/schema.json",
  "configVersion": "1",
  "brand": "my-app",
  "framework": "vite-react",
  "typescript": true,
  "target": "react",
  "platform": "shopify",
  "platformDomain": "catalog",
  "outDir": "../react-{APP_NAME}",
  "dist": {
    "static": true,
    "render": { "appEntry": "src/App.tsx", "skipRoutes": ["/admin/dashboard"] },
    "html": { "mode": "tailwind" },
    "postcss": { "enabled": true, "uncss": { "enabled": true } }
  },
  "aliases": {
    "@": "./src",
    "@/components": "./src/components",
    "@/ui": "./src/components/ui",
    "@/layouts": "./src/layouts",
    "@/blocks": "./src/blocks",
    "@/lib": "./src/lib",
    "@/variants": "./src/variants"
  },
  "fixtures": "./fixtures",
  "tokens": "./src/assets/css/shadcn.css",
  "componentsDir": "./src/components",
  "blocksDir": "./src/blocks",
  "layoutsDir": "./src/layouts",
  "partialsDir": "./src/partials",
  "libDir": "./src/lib",
  "registry": "@ui8kit",
  "lint": {
    "strict": true,
    "dsl": true,
    "ui8kitMapPath": "./src/ui8kit.map.json",
    "utilityPropsMapPath": "./src/lib/utility-props.map.ts"
  }
}
```

**What to change per app:**
- `brand` — your app name (kebab-case)
- `outDir` — `"../react-{APP_NAME}"` (matches generated app folder)
- `skipRoutes` — routes to skip in HTML render (e.g. authenticated admin pages)

### 9.2 maintain.config.json — project checkers

Consumed by `maintain run`, `maintain validate`, `maintain clean`. Schema: `packages/maintain/schemas/maintain.config.schema.json`.

```json
{
  "$schema": "../../packages/maintain/schemas/maintain.config.schema.json",
  "root": ".",
  "reportsDir": ".cursor/reports",
  "continueOnError": true,
  "maxParallel": 2,
  "checkers": {
    "invariants": {
      "routes": {
        "appFile": "src/App.tsx",
        "required": ["/", "/admin", "/admin/dashboard"]
      },
      "fixtures": {
        "pageFile": "fixtures/shared/page.json",
        "requiredPageDomains": ["website", "admin"]
      },
      "blocks": {
        "dir": "src/blocks",
        "indexFile": "src/blocks/index.ts",
        "recursive": true
      },
      "context": {
        "file": "src/data/adapters/fixtures.adapter.ts",
        "requiredSymbols": ["loadFixturesContextInput"]
      }
    },
    "viewExports": { "pattern": "src/**/*View.tsx", "exportShape": "interface+function" },
    "dataClassConflicts": { "scope": ["src"], "pattern": "**/*.tsx", "ignoreDataClasses": ["wrapper"] },
    "componentTag": { "scope": ["src"], "pattern": "**/*.tsx", "tagMapPath": null },
    "colorTokens": {
      "scope": ["src"], "pattern": "**/*.tsx",
      "tokenSource": "utility-props.map",
      "utilityPropsMapPath": "./src/lib/utility-props.map.ts"
    },
    "genLint": {
      "scope": ["src/blocks", "src/layouts", "src/partials"],
      "pattern": "**/*.tsx",
      "rules": { "GEN001": "error", "GEN002": "error", "GEN003": "warn", "GEN004": "error", "GEN005": "warn", "GEN006": "error", "GEN007": "error", "GEN008": "warn" }
    },
    "clean": {
      "paths": ["../react-{APP_NAME}", "node_modules/.vite"],
      "pathsByMode": {
        "full": ["node_modules", "../react-{APP_NAME}"],
        "dist": ["../react-{APP_NAME}", "node_modules/.vite"]
      },
      "includeTsBuildInfo": true
    },
    "lockedDirs": { "dirs": ["src/assets", "src/components", "src/variants"], "pattern": "**/*.{ts,tsx,css,json}" },
    "viewHooks": { "pattern": "src/**/*View.tsx", "allowedHooks": [] },
    "utilityPropLiterals": {
      "scope": ["src/blocks", "src/layouts", "src/partials"],
      "pattern": "**/*.tsx",
      "utilityPropsMapPath": "./src/lib/utility-props.map.ts",
      "allowDynamicInLoop": true
    },
    "utilityPropsWhitelist": {
      "utilityPropsMapPath": "./src/lib/utility-props.map.ts",
      "tailwindMapPath": "../../packages/generator/src/assets/tailwind/tw-css-extended.json",
      "additionalMapPaths": [
        "../../packages/generator/src/lib/shadcn.map.json",
        "../../packages/generator/src/lib/grid.map.json"
      ],
      "maxSuggestions": 2
    },
    "orphanFiles": {
      "scope": ["src"], "pattern": "**/*.{ts,tsx}",
      "ignore": ["src/main.tsx", "src/vite-env.d.ts", "src/App.tsx"],
      "aliases": { "@": "./src" }
    },
    "blockNesting": { "scope": ["src/blocks", "src/layouts", "src/partials"], "pattern": "**/*View.tsx" }
  }
}
```

**What to change per app:**
- `invariants.routes.required` — list all your routes (must match `src/App.tsx`)
- `invariants.fixtures.requiredPageDomains` — your domain names from `fixtures/shared/page.json`
- `clean.paths` / `clean.pathsByMode` — replace `react-{APP_NAME}` with your generated folder name

**What `maintain:validate` checks (fast, run always):**
- `invariants` — routes in App.tsx match required list; fixture schema domains present; blocks exported from index; adapter function exists
- `viewExports` — every `*View.tsx` exports both `interface` and `function`
- `contracts` — blueprint.json matches App.tsx routes

**What `maintain:check` checks additionally (full run):**
- `dataClassConflicts` — duplicate `data-class` values across files
- `componentTag` — `component` prop value is in allowed tag map
- `colorTokens` — bg/textColor values exist in utility-props.map
- `genLint` — GEN001–GEN008 rules in blocks/layouts/partials
- `lockedDirs` — files in locked dirs were not modified
- `viewHooks` — no React hooks inside `*View.tsx`
- `utilityPropLiterals` — no invalid prop literals in UI files
- `orphanFiles` — no unused `.ts`/`.tsx` files

### 9.3 blueprint.json — entity contract

Consumed by `blueprint:scan`, `blueprint:validate`, `blueprint:graph`, and the `contracts` checker in maintain.

**Start with a seed file, then run `bun run blueprint:scan` to fill it from code:**

```json
{
  "version": "1",
  "app": "@ui8kit/resta-dsl-{APP_NAME}",
  "routes": [
    { "path": "/", "component": "HomePage", "view": "HomePageView" },
    { "path": "/admin", "component": "LoginPage", "view": "AdminLoginPageView" },
    { "path": "/admin/dashboard", "component": "DashboardPage", "view": "AdminDashboardPageView" }
  ],
  "fixtures": [
    { "domain": "website", "file": "fixtures/home.json" },
    { "domain": "admin", "file": "fixtures/admin.json" },
    { "domain": "shared", "file": "fixtures/shared/site.json" },
    { "domain": "shared", "file": "fixtures/shared/navigation.json" },
    { "domain": "shared", "file": "fixtures/shared/page.json" }
  ]
}
```

**Lifecycle:**
1. Write seed `blueprint.json` with routes and fixtures matching your plan.
2. Build all blocks and routes.
3. `bun run blueprint:scan` — scans code and updates blueprint.
4. `bun run blueprint:validate` — validates project matches blueprint.
5. `bun run blueprint:graph` — produces dependency graph (optional, for inspection).

After `blueprint:scan`, the file grows to include `entities`, `layouts`, `partials`, `components`, `context`, `domains`. You can also use `apps/dsl/blueprint.json` as a reference for the full shape.

---

## 8. Where to put new code

| Question | Answer | Folder |
|----------|--------|--------|
| Primitive or composite (Button, Card, Stack)? | Yes | `src/components/` |
| CVA variants (button, badge)? | Yes | `src/variants/` |
| Section or full page? | Yes | `src/blocks/` |
| Reusable fragment (header, footer)? | Yes | `src/partials/` |
| Page wrapper? | Yes | `src/layouts/` |
| Route that wires PageView? | Yes | `src/routes/` |
| Context and data loading? | Yes | `src/data/` |
| JSON data? | Yes | `fixtures/` |

### Rule: do not create redundant components

If `Card` exists in `src/components/`, do not build `FeatureCard` or `EventCard` from `Stack`/`Group`. Use `Card` with different content.

---

## 10. Commands and workflow

All commands below are run **from the app directory** (e.g. `apps/dsl`, `apps/dsl-crm`). **apps/dsl-design** has no `lint:gen` or `test:contracts` scripts.

For a **full list of CLI commands and options** (maintain, ui8kit-generate), see **[CLI_COMMANDS.md](CLI_COMMANDS.md)**. For a **short workflow sequence**, see **[WORKFLOW.md](WORKFLOW.md)**. For a **no-skip pipeline from Bootstrap to Release**, use **[.project/PLAYBOOK.md](.project/PLAYBOOK.md)**.

### 10.1 Development

```bash
cd apps/dsl          # or cd apps/dsl-design
bun run dev
```

### 10.2 Validation and linting

| Command | Purpose |
|---------|---------|
| `bun run validate` | ui8kit-validate — config, DSL, props (including component+tag) |
| `bun run lint:dsl` | ui8kit-lint-dsl — If/Var/Loop check |
| `bun run lint:gen` | Generator lint — blocks/layouts rules (apps/dsl only) |
| `bun run lint` | ui8kit-lint — general lint (whitelist sync) |
| `bun run typecheck` | TypeScript |

**ui8kit-validate** checks: app config, DSL rules, props (utility-props, color tokens), and that `component` values are allowed tags (see `component-tag-map.json`).

### 10.3 Maintain (project checkers)

Config: **`maintain.config.json`** in the app root. Schema: `packages/maintain/schemas/maintain.config.schema.json`. See [Section 9.2](#92-maintainconfigjson--project-checkers) for the full config structure.

| Script | Purpose |
|--------|---------|
| `bun run maintain:validate` | Validate checkers only (invariants, fixtures, view-exports, contracts) |
| `bun run maintain:check` | All checkers from maintain.config.json |
| `bun run maintain:props` | utility-props-whitelist only (props map vs tw-css-extended + shadcn + grid) |

For **maintain** CLI options (`--cwd`, `--config`, `--check`, etc.), run `bunx maintain --help` or see [CLI_COMMANDS.md](CLI_COMMANDS.md).

### 10.4 Generation

| Command | Purpose |
|---------|---------|
| `bun run generate` | Generate React (dsl → ../react, dsl-design → ../react-design) |
| `bun run finalize` | Build final app |
| `bun run dist:app` | Full pipeline (lint + validate + generate + finalize) |

### 10.5 Props map (ui8kit.map.json)

After changing `src/lib/utility-props.map.ts`, rebuild the class map:

**From app directory:**

```bash
cd apps/dsl          # or apps/dsl-design
bun run build:map
```

**From repo root** (scripts/CI):

```bash
bunx ui8kit-generate uikit-map --cwd apps/dsl
bunx ui8kit-generate uikit-map --cwd apps/dsl-design
```

Options: `--props-map`, `--output`, `--tailwind-map`, `--shadcn-map`, `--grid-map`, `--log-level`. See [CLI_COMMANDS.md](CLI_COMMANDS.md) or `bunx ui8kit-generate uikit-map --help`.

### 10.6 Blueprint

| Command | Purpose |
|---------|---------|
| `bun run blueprint:scan` | Scan code and update blueprint.json |
| `bun run blueprint:validate` | Check project against blueprint |
| `bun run blueprint:graph` | Build dependency graph |

### 10.7 Clean

| Command | Purpose |
|---------|---------|
| `bun run clean:dist` | Clean generated output |
| `bun run clean` | Full clean (including node_modules) |

---

## 11. Validation and linting

### 11.1 Required checks before commit

Run in this order from the app directory:

1. `bun run lint:dsl` — DSL (If, Var, Loop instead of JS)
2. `bun run lint:gen` — generator rules (apps/dsl only; skip in dsl-design)
3. `bun run validate` — config and props (ui8kit.config.json must be present)
4. `bun run maintain:validate` — invariants, fixtures, view-exports, contracts (maintain.config.json must be present)
5. `bun run maintain:check` — full checker set
6. `bun run typecheck` — TypeScript
7. `bun run blueprint:scan` — update blueprint.json from code
8. `bun run blueprint:validate` — verify project matches blueprint
9. If blocks/templates/fixtures changed — `bun run generate` then `bun run finalize`
10. Verify generated app — `cd ../react-{APP_NAME} && bun run typecheck`
11. If `utility-props.map.ts` changed — `bun run build:map` then `bun run maintain:props`

Or run the full pipeline at once: `bun run dist:app`. See [WORKFLOW.md](WORKFLOW.md) and [.project/PLAYBOOK.md](.project/PLAYBOOK.md) for the stage-by-stage tracker.

### 11.2 Common errors

| Error | Fix |
|-------|-----|
| `gap="5"` invalid | Use `gap="4"` or `gap="6"` |
| `fontSize="huge"` invalid | Use `fontSize="4xl"` |
| `bg="red"` invalid | Use `bg="destructive"` or another token |
| DSL: use `<Loop>` instead of `.map` | Replace `.map()` with `<Loop>` |
| DSL: use `<If>` instead of `&&` | Replace `&&` with `<If>` |
| Block does not allow tag "div" | Block — only section, article, header, nav, main, footer, aside, figure, address, form |
| Text does not allow tag "div" | Text — only p, h1–h6, span, label, cite, q, etc. (see component-tag-map) |
| Box/Stack/Group + form control | input, textarea, select, button — only in Field |

### 11.3 component+tag validation

Allowed tags map: `packages/generator/src/lib/component-tag-map.json`. Used by HtmlConverterService (HTML generation), ui8kit-validate, and Maintain checker **componentTag**.

---

## 12. React and HTML+CSS generation

The generator turns DSL components into:

- **React** — plain JSX without If/Var/Loop (in `../react` or `../react-design`)
- **HTML+CSS** — for static platforms (Shopify, WordPress, etc.)

Generation config — `ui8kit.config.json` (or dist config) in the app root. After `bun run generate` + `bun run finalize` you can run the generated app:

```bash
cd ../react
bun install
bun run dev
```

---

## 13. Anti-patterns — what to avoid

### ❌ Hardcoded data

```tsx
// Wrong
<Title>Welcome to RestA</Title>
<Text>Our menu items</Text>

// Correct
<Title><Var name="title" value={title} /></Title>
<Text><Var name="subtitle" value={subtitle} /></Text>
```

### ❌ className and style

```tsx
// Wrong
<div className="flex gap-4">
<Box style={{ padding: "16px" }}>

// Correct
<Group gap="4">
<Stack p="4">
```

### ❌ Raw HTML tags

```tsx
// Wrong
<div><h1>Title</h1><p>Text</p></div>

// Correct
<Block><Title>Title</Title><Text>Text</Text></Block>
```

### ❌ JS conditionals and loops in JSX

```tsx
// Wrong
{items.map(i => <Card key={i.id}>...</Card>)}
{show && <Modal />}

// Correct
<Loop each="items" as="item" data={items}>
  {(item) => <Card key={item.id}>...</Card>}
</Loop>
<If test="show" value={show}><Modal /></If>
```

### ❌ Missing data-class

```tsx
// Wrong
<Block component="section">
<Stack>

// Correct
<Block component="section" data-class="hero-section">
<Stack data-class="hero-content">
```

### ❌ Duplicating Card

```tsx
// Wrong — Stack mimicking Card
<Stack gap="4" p="4" rounded="lg" bg="card" border="" data-class="card">

// Correct — use Card
<Card data-class="feature-card">
  <CardHeader />
  <CardContent />
</Card>
```

---

## 14. First task step by step

**Task:** Add a new “Featured Items” block to the landing page.

### Step 1: Add data to fixture

`fixtures/landing.json`:

```json
{
  "title": "Welcome to RestA",
  "subtitle": "...",
  "ctaText": "View Menu",
  "ctaUrl": "/menu",
  "secondaryCtaText": "Our Recipes",
  "secondaryCtaUrl": "/recipes",
  "featuredItems": [
    { "id": "1", "title": "Seasonal Dish", "description": "Fresh ingredients" },
    { "id": "2", "title": "Chef Special", "description": "Today's highlight" }
  ]
}
```

### Step 2: Update types (if needed)

`src/data/adapters/types.ts` or `src/types/` — add type for `featuredItems`.

### Step 3: Create block

`src/blocks/FeaturedItemsBlock.tsx`:

```tsx
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription } from '@ui8kit/core';
import { Loop, Var } from '@ui8kit/dsl';

export interface FeaturedItemsBlockProps {
  items?: { id: string; title: string; description: string }[];
}

export function FeaturedItemsBlock({ items }: FeaturedItemsBlockProps) {
  return (
    <Block component="section" py="16" bg="muted" data-class="featured-section">
      <Grid grid="cols-2" gap="6" data-class="featured-grid">
        <Loop each="items" as="item" data={items ?? []}>
          {(item: { id: string; title: string; description: string }) => (
            <Card key={item.id} data-class="featured-card">
              <CardHeader>
                <CardTitle order={4} data-class="featured-card-title">
                  <Var name="item.title" value={item.title} />
                </CardTitle>
                <CardDescription data-class="featured-card-description">
                  <Var name="item.description" value={item.description} />
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </Loop>
      </Grid>
    </Block>
  );
}
```

### Step 4: Export block

`src/blocks/index.ts`:

```ts
export { FeaturedItemsBlock } from './FeaturedItemsBlock';
```

### Step 5: Add to PageView

`src/blocks/landing/PageView.tsx` (or equivalent):

```tsx
import { HeroBlock, FeaturedItemsBlock } from '@/blocks';

// Add featuredItems to props
// In return add:
<FeaturedItemsBlock items={landing.featuredItems} />
```

### Step 6: Update context and adapter

Ensure `landing` in context includes `featuredItems`. Check `fixtures.adapter.ts` and types.

### Step 7: Run checks

```bash
bun run lint:dsl
bun run validate
bun run maintain:validate
bun run maintain:check
bun run typecheck
bun run blueprint:scan
bun run blueprint:validate
```

---

## 15. Pre-commit checklist

- [ ] `bun run lint:dsl` — DSL check
- [ ] `bun run lint:gen` — generator lint (apps/dsl only)
- [ ] `bun run validate` — config, props, component+tag
- [ ] `bun run maintain:validate` — validate set from app’s package.json
- [ ] `bun run typecheck` — TypeScript
- [ ] If blocks changed — `bun run generate` (and `bun run finalize` if needed)
- [ ] If `src/lib/utility-props.map.ts` changed — `bun run build:map` and `bun run maintain:props`
- [ ] No hardcode — all data from context or props
- [ ] No `className` or `style`
- [ ] All semantic elements have `data-class`
- [ ] `component` uses only allowed tags (see component-tag-map)
- [ ] Use If, Var, Loop instead of JS conditionals and loops
- [ ] Comments in English

---

## Additional resources

- **[WORKFLOW.md](WORKFLOW.md)** — short command sequence (setup → pre-commit)
- **[CLI_COMMANDS.md](CLI_COMMANDS.md)** — full CLI reference (maintain, ui8kit-generate)
- **[.project/PLAYBOOK.md](.project/PLAYBOOK.md)** — universal pipeline tracker (Bootstrap → Release); paste into agent chat to check progress
- `.cursor/rules/best-practices.mdc` — code rules
- `.cursor/rules/engine-dsl-enforcement.mdc` — DSL rules
- `.cursor/rules/project-structure.mdc` — project structure
- `.cursor/rules/ui8kit-architecture.mdc` — UI8Kit architecture
- `packages/maintain/schemas/maintain.config.schema.json` — maintain.config.json schema
- `apps/dsl/maintain.config.json` — reference maintain config with all checkers
- `apps/dsl/blueprint.json` — reference blueprint with full entity/layout/partial shape
- `packages/generator/src/lib/component-tag-map.json` — component → allowed tag map

---

*Document: ONBOARDING-101. International (EN). Last updated: 2026-03.*
