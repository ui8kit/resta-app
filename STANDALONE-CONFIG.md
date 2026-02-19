# Standalone App Config Template

Copy `ui8kit.config.standalone.json` to your project root and rename to `ui8kit.config.json`.

## Project Structure

```
src/
├── components/    # @ui8kit/core — Block, Stack, Card, Button, etc.
├── variants/      # CVA configs
├── lib/           # utility-props.map.ts, utils, ui8kit.map.json (copy here)
├── blocks/        # HeroBlock, PageViews
├── layouts/       # MainLayout, AdminLayout
├── partials/      # Header, Footer, ThemeToggle
├── routes/        # Route components
├── providers/     # Theme, Auth
├── data/          # context.ts
└── css/           # Tailwind + theme tokens

fixtures/          # JSON data
```

## ui8kit.map.json

Copy from `@ui8kit/generator` (packages/generator/src/lib/ui8kit.map.json) to `./src/ui8kit.map.json`.

The linter (`ui8kit-lint`) checks that this file exists and is in sync with `utility-props.map.ts` — configure paths in `ui8kit.config.json`:

```json
"lint": {
  "ui8kitMapPath": "./src/ui8kit.map.json",
  "utilityPropsMapPath": "./src/lib/utility-props.map.ts"
}
```
