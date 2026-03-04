# BACKLOG — Significant changes

---

## Template `resta` (dsl→react) — Plan

### 1. Что прогоняется через генератор (DSL → JSX)

| Источник | Действие | Результат |
|----------|----------|-----------|
| `blocks/*` | ui8kit-generate react | blocks без DSL (чистый JSX) |
| `layouts/*` | ui8kit-generate react | layouts без DSL |
| `partials/*` | ui8kit-generate react | partials без DSL |
| `components/Sheet.tsx`, `Icon.tsx` | transformJsxFile (finalize) | DSL → JSX |
| `blocks/design/previews/*` | transformJsxFile (finalize) | DSL → JSX |

### 2. Что копируется как есть (без трансформации)

| Папка/файл | Примечание |
|------------|------------|
| `components/` (кроме Sheet, Icon) | Примитивы, Card, Accordion и т.д. |
| `variants/` | CVA-конфиги |
| `lib/` | utility-props, utils |
| `routes/` | Page-компоненты, подключают blocks + context |
| `providers/` | ThemeProvider, AdminAuthContext |
| `hooks/` | useCart, useMenuFilter и т.д. |
| `constants/` | nav-icons |
| `types/` | navigation, menu, blog и т.д. |
| `assets/` | CSS, fonts |
| `App.tsx`, `main.tsx`, `ui8kit.map.json` | Корень приложения |
| `data/` | context.ts, adapters |
| `blocks/design/fixtures/` | Plain TS, без DSL |

### 3. Что игнорируем в шаблоне (добавляется позже)

| Игнорируем | Добавляется через |
|------------|-------------------|
| `components/`, `lib/`, `variants/` | `bunx ui8kit add --all` |
| `fixtures/`, `data/`, `constants/` | Внутренний скрипт (накатывает поверх) |
| `App.tsx`, `routes/` | Внутренний скрипт (заменяет) |
| `blocks/`, `layouts/`, `partials/` | ui8kit-generate или `ui8kit add <blueprint>` |

### 4. Что берём в шаблон `template-resta`

**Только ключевые конфиги и минимальный скелет:**

```
template-resta/
├── package.json          # deps: react, react-dom, react-router-dom, @ui8kit/sdk, tailwind, vite
├── index.html
├── vite.config.ts        # alias @, @ui8kit/core
├── tsconfig.json
├── postcss.config.js
├── ui8kit.config.json    # минимальный конфиг для генератора
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
    └── ui8kit.map.json   # пустой или минимальный
```

**Не включаем в шаблон:**
- `components/`, `lib/`, `variants/` — `ui8kit add --all`
- `data/`, `fixtures/`, `constants/` — overlay-скрипт
- Полноценные blocks, layouts, partials — генератор или add

### 5. Цепочка после create-app

```
1. bunx @ui8kit/create-app my-app --template resta
2. cd my-app && bun install
3. bunx ui8kit add --all                    # components, lib, variants
4. bunx ui8kit add restaurant-hero.json     # (или другой blueprint) — blocks, layouts
5. bunx ui8kit overlay fixtures             # (внутренний скрипт) — data, fixtures, App, routes
6. bun run dev
```

### 6. Что нужно для автоматизации

| Не хватает | Описание |
|------------|----------|
| `bunx ui8kit add --all` | Утилита, устанавливающая components, lib, variants из registry |
| `bunx ui8kit add <blueprint>` | Утилита, добавляющая blocks/layouts из JSON-blueprint (как shadcn add) |
| `bunx ui8kit overlay fixtures` | Скрипт, накатывающий data/, fixtures/, constants/, App.tsx, routes/ поверх проекта |
| Registry (CDN/npm) | Хранилище компонентов и blueprints |
| template-resta | Второй шаблон в packages/create-app |

### 7. Разделение ответственности

| Этап | Источник | Результат |
|------|----------|-----------|
| create-app --template resta | template-resta/ | Минимальный scaffold |
| ui8kit add --all | Registry | components, lib, variants |
| ui8kit add blueprint | Registry | blocks, layouts, partials (DSL→JSX) |
| ui8kit overlay | Внутренние данные | data, fixtures, constants, App, routes |
