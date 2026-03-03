# Debug: CLI tools & Biome feasibility

## 1. Debug results — existing instruments

### 1.1 Tools checked (per CLI_COMMANDS.md, UI8KIT_CLI.md)

| Tool | Scope | Result |
|------|--------|--------|
| `bun run lint:dsl` | ui8kit-lint-dsl | ✅ Passes in dsl (54 files), dsl-crm (45), dsl-design (47) |
| `bunx ui8kit-validate` | Config + DSL | ✅ Passes in all apps |
| `bun run lint` (ui8kit-lint) | Whitelist vs props map | ❌ Was failing in dsl-crm and dsl-design; **fixed** (see below) |
| `turbo run lint` (root) | All packages | ❌ Was failing; **fixed** after fixing ui8kit-lint |

### 1.2 Root cause of lint failures

- **ui8kit-lint** compares:
  - usage of semantic props (e.g. `w="48"`, `max="w-7xl"`) → generated class names (`w-48`, `max-w-7xl`);
  - against **ui8kit.map.json** (whitelist).
- **ui8kit.map.json** is produced by **build:map** (generator `uikit-map`) from:
  - `utility-props.map.ts` (allowed prop values);
  - `tw-css-extended.json` (Tailwind class → CSS).
- **Problems found:**
  1. **dsl-crm / dsl-design** had `w="48"`, `w="64"`, `w="72"`, `max="w-7xl"` in code and in `utility-props.map.ts`, but **tw-css-extended.json** did not contain `w-64` or `w-72`, so the generator reported "Missing" and did not add them to **ui8kit.map.json**.
  2. After **build:map**, the whitelist was still missing those classes → ui8kit-lint failed (INVALID_PROP_VALUE / TYPO_DETECTED).

### 1.3 Fix applied

- **tw-css-extended.json** (in `packages/generator/src/assets/tailwind/`): added:
  - `"w-64": "width: calc(var(--spacing) * 64);"`
  - `"w-72": "width: calc(var(--spacing) * 72);"`
- Re-ran **build:map** in **dsl-crm** and **dsl-design** so that **ui8kit.map.json** includes all classes from the props map.
- **Result:** `bun run lint` and `turbo run lint` pass in all packages.

### 1.4 Recommendation for future

- After adding new **prop values** (e.g. `w: 48, 64, 72`) to **utility-props.map.ts**, either:
  - ensure **tw-css-extended.json** contains the corresponding Tailwind classes (e.g. `w-48`, `w-64`, `w-72`), or
  - extend the generator to emit a fallback for known spacing-based classes.
- Run **build:map** in the app before relying on **ui8kit-lint** so that the whitelist stays in sync.

---

## 2. MCP Context 7 & Biome

- **MCP Context 7** (user-context7) is intended for up-to-date documentation; no resource descriptors were found under the workspace `mcps` path for this session, so Biome information was taken from **web fetch** (biomejs.dev) and **web search** instead.
- Below summarizes Biome’s current capabilities and how they relate to the existing CLI.

---

## 3. Biome — current capabilities (from biomejs.dev)

- **Format:** JS/TS/JSX/TSX/JSON/HTML/CSS/GraphQL; ~97% Prettier compatibility; very fast (Rust).
- **Lint:** 455+ rules (complexity, style, correctness, etc.); JS/TS/JSX/CSS/GraphQL; supports `--only` / `--skip`; many rules fixable with `--write`.
- **CLI (relevant):**
  - `biome check --write` — format + lint + import sort.
  - `biome ci` — for CI (format, lint, import sort).
  - `biome migrate eslint` / `biome migrate prettier` — migrate existing configs.
- **Ecosystem:** Used by many large projects; first-party editor integrations.

---

## 4. Targetableness внедрения Biome

### 4.1 Что Biome даёт и не заменяет

| Need | Tool | Biome? |
|------|------|--------|
| Format (Prettier-like) | — (сейчас нет в репо) | ✅ Да: `biome format` / `biome check` |
| Общие правила (complexity, style, correctness) | — | ✅ Да: `biome lint` |
| Синхронизация whitelist (props map ↔ ui8kit.map.json) | **ui8kit-lint** | ❌ Нет; доменная логика UI8Kit |
| Проверка DSL (If/Var/Loop, без .map/&& в JSX) | **ui8kit-lint-dsl** | ❌ Нет; доменные правила UI8Kit |
| Валидация конфига и путей | **ui8kit-validate** | ❌ Нет |

### 4.2 Целесообразность

- **Имеет смысл внедрять Biome** для:
  - форматирования кода (замена Prettier, если появится);
  - общего линтинга (стиль, сложность, типичные ошибки) в дополнение к существующим инструментам.
- **Не заменяет** ui8kit-lint, ui8kit-lint-dsl, ui8kit-validate — их нужно оставить и вызывать вместе с Biome (например, в одном пайпе или в `turbo run lint` после/до Biome).

### 4.3 Варианты интеграции

1. **Добавить в корень монорепо:**
   - `bun add -D @biomejs/biome`
   - `bunx biome init`
   - Настроить `biome.json` (формат + линт), при необходимости `biome migrate prettier` / `biome migrate eslint`.
   - В `lint` скриптах: сначала `biome check`, затем существующие `ui8kit-lint`, `ui8kit-lint-dsl`, `ui8kit-validate` (или наоборот, по предпочтениям).
2. **Только формат:** использовать только `biome format` / `biome check --write` для форматирования, без включения строгих правил линта, чтобы минимизировать конфликты с правилами UI8Kit.

### 4.4 Итог

- **Целесообразность:** да, как **дополнительный** инструмент для форматирования и общего линтинга.
- **Обязательность:** нет; текущий набор (lint:dsl, validate, ui8kit-lint) достаточен для консистентности UI8Kit; Biome — опция для ускорения форматирования и лучших практик по коду в целом.
- **MCP Context 7:** при наличии настроенного ресурса по Biome можно использовать его для актуальной справки по правилам и миграциям; в данной сессии использованы материалы с biomejs.dev.
