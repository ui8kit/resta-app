# RestA — Restaurant & Bar

A restaurant web app built with **UI8Kit**, a design system that combines semantic React components with a **DSL (Domain-Specific Language)** for template-friendly, LLM-generatable markup. This README describes how to create such a project from scratch.

---

## Concept & Architecture

### Design Philosophy

- **Props = Tailwind classes** — Semantic props (`gap="6"`, `bg="primary"`) map to Tailwind utilities; no raw `className` or inline styles.
- **DSL markup** — Use `<If>`, `<Var>`, `<Loop>`, `<Slot>` instead of JS conditionals/loops for stable, template-ready output.
- **Fixtures + Context** — JSON fixtures drive content; `@ui8kit/sdk` provides `createContext` to wire data into blocks.
- **Valid HTML5** — Semantic tags (`<section>`, `<article>`, `<header>`, etc.) via `component` prop for W3C-valid output.

### Architecture Overview

```
fixtures/*.json  →  context (SDK createContext)  →  routes  →  PageViews  →  Blocks
                                                                    ↓
                                              @ui8kit/core (Block, Stack, Card, etc.)
                                              @ui8kit/dsl  (If, Var, Loop, Slot)
```

- **Blocks** — Reusable page sections (HeroBlock, SidebarContent).
- **PageViews** — Full page compositions (LandingPageView, MenuPageView).
- **Layouts** — MainLayout, AdminLayout.
- **Partials** — Header, Footer, ThemeToggle.
- **Routes** — Connect URL to PageView, pass context data.

---

## Creating the Project from Scratch

### 1. Vite + Base Config

```bash
bun create vite resta-app --template react-ts
cd resta-app
```

Install core deps:

```bash
bun add react react-dom react-router-dom
bun add -d vite @vitejs/plugin-react-swc typescript @types/react @types/react-dom @types/node
```

**vite.config.ts**:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: { port: 3020 },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
});
```

**tsconfig.json** — add `paths`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

---

### 2. Tailwind CSS 4 + PostCSS

```bash
bun add -d tailwindcss @tailwindcss/postcss postcss
```

**postcss.config.js**:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**src/css/index.css**:

```css
@import "tailwindcss";

@layer base {
  body {
    @apply bg-background text-foreground font-sans;
  }
}
```

Add design tokens (e.g. `src/css/resta.css`) with `:root` and `.dark` CSS variables, then `@import "./resta.css"` in `index.css`.

---

### 3. UI8Kit Setup

Initialize UI8Kit and add components:

```bash
bunx ui8kit@latest init
bunx ui8kit@latest add --all
```

This creates:

- `src/components/` — UI primitives (Block, Stack, Group, Title, Text, Button, etc.) and composites (Card, Accordion, Sheet).
- `src/variants/` — CVA configs.
- `src/lib/` — `utility-props.ts`, `utility-props.map.ts`, `utils.ts`.
- `src/ui8kit.config.json` — UI8Kit config.
- `src/ui8kit.map.json` — Tailwind class map for generation.

**Wire aliases** — add `@ui8kit/core` to Vite and TypeScript:

**vite.config.ts**:

```ts
resolve: {
  alias: {
    '@': path.resolve(process.cwd(), './src'),
    '@ui8kit/core': path.resolve(process.cwd(), './src/components/index.ts'),
  },
},
```

**tsconfig.json**:

```json
"paths": {
  "@/*": ["./src/*"],
  "@ui8kit/core": ["./src/components/index.ts"]
}
```

---

### 4. @ui8kit/sdk + Data Flow

```bash
bun add @ui8kit/sdk
```

The SDK provides:

- `createContext` — Build app context from fixtures.
- `If`, `Var`, `Loop`, `Slot` — Re-exported from `@ui8kit/dsl` for DSL markup.
- `ui8kit-validate` — Validate config and DSL.

**Create fixtures** — e.g. `fixtures/landing.json`:

```json
{
  "title": "Welcome to RestA",
  "subtitle": "Experience fine dining...",
  "ctaText": "View Menu",
  "ctaUrl": "/menu"
}
```

**Wire context** — `src/data/context.ts`:

```ts
import { createContext } from '@ui8kit/sdk/source/data';
import landingData from '../../fixtures/landing.json';
// ... other fixtures

const baseContext = createContext({
  site: siteData,
  navItems: navItems,
  fixtures: { landing: landingData, menu: menuData, ... },
});

export const context = { ...baseContext, landing: landingData, ... };
```

---

### 5. Layouts, Routes, Blocks with DSL

**Layouts** — `src/layouts/MainLayout.tsx` — header, sidebar, main content.

**Blocks** — e.g. `src/blocks/HeroBlock.tsx`:

```tsx
import { Block, Stack, Container, Title, Text, Button, Group } from '@ui8kit/core';
import { If, Var, Slot } from '@ui8kit/dsl';

export function HeroBlock({ title, subtitle, ctaText, ctaUrl, ... }) {
  return (
    <Block component="section" py="16" bg="background" data-class="hero-section">
      <Container max="w-7xl" flex="col" gap="8" items="center">
        <Stack gap="4" items="center" max="w-2xl">
          <Title fontSize="5xl" fontWeight="bold" textAlign="center" data-class="hero-title">
            <Var name="title" value={title} />
          </Title>
          <If test="subtitle" value={!!subtitle}>
            <Text fontSize="xl" textColor="muted-foreground" data-class="hero-subtitle">
              <Var name="subtitle" value={subtitle} />
            </Text>
          </If>
        </Stack>
        <Group gap="4" data-class="hero-actions">
          <Button size="lg" href={ctaUrl}><Var name="ctaText" value={ctaText} /></Button>
        </Group>
      </Container>
    </Block>
  );
}
```

**PageView** — composes layout + blocks:

```tsx
<MainLayout navItems={navItems} sidebar={<SidebarContent />}>
  <HeroBlock {...landing} />
</MainLayout>
```

**Route** — passes context to PageView:

```tsx
<LandingPageView landing={context.landing} navItems={context.navItems} ... />
```

---

### 6. DSL Validation

Run the DSL linter to catch common issues (e.g. unwrapped `<Var>` for optional values):

```bash
bun run ui8kit-lint-dsl
```

Add to **package.json**:

```json
"scripts": {
  "ui8kit-lint-dsl": "bun run node_modules/@ui8kit/lint/src/cli/validate-dsl.ts src"
}
```

Or use `bunx -p @ui8kit/lint ui8kit-lint-dsl src` if the lint package is installed.

Example output:

```
⚠ UNWRAPPED_VAR
  Location: src\blocks\MenuPageView.tsx:70:21
  Message: <Var> should be wrapped in <If> for optional values.
  Received: "<Var ... />"
```

**Fix**: Wrap optional `<Var>` in `<If>`:

```tsx
<If test="item.price" value={!!item.price}>
  <Text><Var name="item.price" value={item.price} /></Text>
</If>
```

---

### 7. Live Preview

```bash
bun run dev
```

Opens at `http://localhost:3020`. Hot reload for components, layouts, and fixtures.

---

## Project Structure

```
src/
├── components/       # @ui8kit/core — Block, Stack, Card, Button, etc.
├── variants/        # CVA configs
├── lib/              # utility-props, utils
├── blocks/           # HeroBlock, PageViews
├── layouts/          # MainLayout, AdminLayout
├── partials/         # Header, Footer, ThemeToggle
├── routes/           # Route components
├── providers/        # Theme, Auth
├── data/             # context.ts
└── css/              # Tailwind + theme tokens

fixtures/             # JSON data
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Vite dev server (port 3020) |
| `bun run build` | Production build |
| `bun run preview` | Preview build |
| `bun run ui8kit-lint-dsl` | Validate DSL (If, Var, Loop rules) |
| `bunx ui8kit-validate` | Full validation (config + DSL) |
| `bunx ui8kit-generate --target react` | Static template generation |

---

## DSL Quick Reference

| Component | Use |
|-----------|-----|
| `<If test="x" value={!!x}>` | Conditional render |
| `<Var name="title" value={title} />` | Variable output (wrap in If when optional) |
| `<Loop each="items" as="item" data={items}>` | Iteration |
| `<Slot name="extra">{children}</Slot>` | Content slot |

**Rule**: `<Var>` for optional values must be wrapped in `<If>`. Use a semantic wrapper (e.g. `<Text>`) between `<If>` and `<Var>` when needed.

---

## License

MIT License
