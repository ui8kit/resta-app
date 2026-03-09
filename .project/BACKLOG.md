# BACKLOG — Significant changes

---

## Template `resta` (dsl→react) — Plan

### 1. Что прогоняется через генератор (DSL → JSX)

| Источник | Действие | Результат |
|----------|----------|-----------|
| `blocks/*` | ui8kit-generate react | blocks без DSL (чистый JSX) |
| `layouts/*` | ui8kit-generate react | layouts без DSL |
| `partials/*` | ui8kit-generate react | partials без DSL |

**Примечание:** `blocks/design/previews/*` больше не существует — transformJsxFile в finalize не требуется.

**Sheet.tsx, Icon.tsx** — запрещённые для изменения компоненты, DSL в них быть не должно. Они приходят из `ui8kit add --all`; совместимость актуализируется через registry.

### 2. Что копируется как есть (без трансформации)

**Не копируются** — приходят из shell-скрипта `bunx ui8kit init` + `bunx ui8kit add --all`:
- `components/` — примитивы, Card, Accordion, Sheet, Icon (registry, без DSL)
- `variants/` — CVA-конфиги
- `lib/` — utility-props, utils

**Зачем:** чтобы случайно не внести изменения на этапе разработки apps/dsl (как получилось с Sheet). Эти части управляются registry и считаются immutable.

| Папка/файл | Примечание |
|------------|------------|
| `routes/` | Page-компоненты, подключают blocks + context |
| `providers/` | ThemeProvider, AdminAuthContext |
| `hooks/` | useCart, useMenuFilter и т.д. |
| `constants/` | nav-icons |
| `types/` | navigation, menu, blog и т.д. |
| `assets/` | CSS, fonts |
| `App.tsx`, `main.tsx` | Корень приложения |
| `data/` | context.ts, adapters |
| `blocks/design/fixtures/` | Plain TS, без DSL |

### 3. Что игнорируем в шаблоне (добавляется позже)

| Игнорируем | Добавляется через |
|------------|-------------------|
| `components/`, `lib/`, `variants/` | `bunx ui8kit init` + `bunx ui8kit add --all` (не копируем из dsl — immutable, registry) |
| `fixtures/`, `data/`, `constants/` | Внутренний скрипт (накатывает поверх) |
| `App.tsx`, `routes/` | Внутренний скрипт (заменяет) |
| `blocks/`, `layouts/`, `partials/` | ui8kit-generate react (DSL→JSX) |

### 4. Что берём в шаблон `template-resta`

**Только ключевые конфиги и минимальный скелет:**

```
template-resta/
├── package.json          # deps: react, react-dom, react-router-dom, @ui8kit/sdk, tailwind, vite
├── index.html
├── vite.config.ts        # alias @, @ui8kit/core
├── tsconfig.json
├── postcss.config.js
├── ui8kit.config.json    # только dist.* — для generate:html/styles/static (3 mode)
├── _gitignore
└── src/
    ├── main.tsx          # минимальный entry (ThemeProvider, BrowserRouter, App)
    ├── App.tsx           # заглушка (Routes с одной страницей) — будет заменён
    ├── assets/
    │   └── css/
    │       ├── index.css # @import tailwindcss
    │       └── shadcn.css # минимальные токены (или пустой)
    ├── providers/        # theme.tsx, AdminAuthContext.tsx — минимальные
    ├── hooks/            # index.ts (пустой barrel)
    ├── types/            # index.ts (пустой или базовые)
    ├── blocks/           # .gitkeep или пусто
    ├── layouts/          # .gitkeep или пусто
    ├── partials/         # .gitkeep или пусто
    ├── routes/           # .gitkeep или один LandingPage-заглушка
    └── ui8kit.map.json   # своя версия в шаблоне (не копируем из dsl)
```

**Не включаем в шаблон:**
- `components/`, `lib/`, `variants/` — `ui8kit init` + `ui8kit add --all` (registry, immutable)
- `data/`, `fixtures/`, `constants/` — overlay-скрипт
- Полноценные blocks, layouts, partials — ui8kit-generate react (DSL→JSX)

**ui8kit.map.json** — не копируем из apps/dsl. Шаблон содержит свою версию.

### 5. Цепочка после create-app

Shell-скрипт вызывает `bunx ui8kit init` и `bunx ui8kit add --all` — components, variants, lib не копируются из apps/dsl.

```
1. bunx ui8px my-app --template react-resta
2. cd my-app && bun install
3. bunx ui8kit init                         # инициализация
4. bunx ui8kit add --all                    # components, lib, variants (из registry)
5. bunx ui8kit overlay fixtures             # (внутренний скрипт) — data, fixtures, App, routes
6. bun run dev
```

**Приложение строится с чистого листа.** В распоряжении только `ui8kit add --all`; blocks, layouts, partials, data, fixtures — пишем с нуля под любое приложение.

### 6. Что нужно для автоматизации

| Не хватает | Описание |
|------------|----------|
| `bunx ui8kit init` | Инициализация проекта (перед add --all) |
| `bunx ui8kit add --all` | Утилита, устанавливающая components, lib, variants из registry (в т.ч. Sheet, Icon — без DSL). Не копируем из apps/dsl — избегаем случайных правок при разработке. |
| `bunx ui8kit overlay fixtures` | Скрипт, накатывающий data/, fixtures/, constants/, App.tsx, routes/ поверх проекта |
| Registry (CDN/npm) | Хранилище компонентов |
| template-resta | Второй шаблон в packages/create-app |

### 7. Разделение ответственности

| Этап | Источник | Результат |
|------|----------|-----------|
| create-app --template resta | template-resta/ | Минимальный scaffold (своя ui8kit.map.json) |
| ui8kit add --all | Registry | components, lib, variants (Sheet, Icon — immutable, без DSL) |
| ui8kit-generate react | apps/dsl (DSL) | blocks, layouts, partials (DSL→JSX) |
| ui8kit overlay | Внутренние данные | data, fixtures, constants, App, routes |

### 8. ui8kit.config — разные для DSL и resta

**apps/dsl** (источник разработки):
- Полный конфиг: brand, framework, platform, blocksDir, layoutsDir, fixtures, lint, registry
- Нужен для: DSL → React (ui8kit-generate react), валидация, линтинг

**template-resta** (результат генерации):
- Минимальный конфиг: только `dist.*` для статики
- Не нужны: platform, platformMapPath, fixtures, lint, registry — это уже сгенерировано
- Остаётся: генерировать чистые HTML + CSS (3 mode)
  - `generate:html` — React → HTML
  - `generate:styles` — CSS + PostCSS
  - `generate:static` — полный пайплайн

```json
// template-resta: только для статической генерации
{
  "dist": {
    "static": true,
    "render": { "appEntry": "src/App.tsx", "skipRoutes": ["/admin/dashboard"] },
    "html": { "mode": "tailwind" },
    "postcss": { "enabled": true, "uncss": { "enabled": true } }
  }
}
```

---

## CLI проверки и линтеры — что включать в package.json

### Критично важные (всегда)

| Script | Команда | Когда нужен |
|--------|---------|-------------|
| `typecheck` | `tsc --noEmit` | Всегда |
| `build` | `vite build` | Всегда |
| `dev` | `vite` | Всегда |
| `preview` | `vite preview` | Всегда |

### @ui8kit/sdk

| Script | Команда | apps/dsl | template-react | template-resta |
|--------|---------|----------|-----------------|----------------|
| `validate` | `bunx ui8kit-validate` | ✅ Да | ❌ Нет | ❌ Нет |
| `inspect` | `bunx ui8kit-inspect` | Опционально | ❌ | Опционально |

**validate** — конфиг, пути, DSL-синтаксис, props. Нужен только в DSL-источнике (apps/dsl). В template-resta нет DSL, конфиг минимальный.

### @ui8kit/lint

| Script | Команда | apps/dsl | template-react | template-resta |
|--------|---------|----------|----------------|----------------|
| `lint:dsl` | `bunx ui8kit-lint-dsl src` | ✅ Да | ❌ Нет | ❌ Нет |
| `lint` | `bunx ui8kit-lint` | ✅ Да | ❌ Нет | ✅ После add --all |

**lint:dsl** — If/Var/Loop вместо JS control flow. Только где есть DSL (blocks, layouts, partials).

**lint** — синхрон ui8kit.map.json ↔ utility-props.map.ts. Нужен только после `ui8kit add --all` (есть components, lib, variants).

### Рекомендуемый минимум scripts по шаблону

**template-react** (минимальный Vite):
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit"
}
```

**template-resta** (результат генерации):
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "lint": "bunx ui8kit-lint",
  "generate:html": "ui8kit-generate html --cwd . --config dist.config.json",
  "generate:styles": "ui8kit-generate styles --cwd . --config dist.config.json",
  "generate:static": "ui8kit-generate static --cwd . --config dist.config.json"
}
```

**apps/dsl** (источник разработки) — полный набор:
- validate, lint:dsl, lint, typecheck
- generate, finalize, dist:app
- blueprint:*, maintain:*, test:contracts — для pipeline

### Что не включать в шаблоны

| Script | Причина |
|--------|---------|
| `lint:dsl` | В шаблонах нет DSL |
| `validate` | В шаблонах нет полного ui8kit.config |
| `maintain:*` | Нет maintain.config.json |
| `blueprint:*` | Для monorepo pipeline |
| `test:contracts` | Проект-специфично |
