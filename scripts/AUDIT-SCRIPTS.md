# Аудит скриптов (Standalone)

Статус после адаптации. Все монорепо-скрипты удалены.

---

## Итоговое состояние

| Скрипт | Статус | npm-скрипт |
|--------|--------|------------|
| `finalize-dist.ts` | ✅ Новый | `bun run finalize` |
| `clean-workspace.sh` | ✅ Адаптирован | `bun run clean` |
| `clean-engine.sh` | ✅ Адаптирован | `bun run clean:dist` |
| `refactor-audit.ts` | ✅ Адаптирован | `bun run audit:refactor` |
| `validate-invariants.ts` | ✅ Адаптирован | `bun run validate:invariants` |
| `build-props-classlist.ts` | ✅ Адаптирован | `bun run build:props` |
| `smoke-parity.mjs` | ⚪ Оставлен | — |
| `scaffold-app.ts` | ⚪ Оставлен | — |
| `scaffold-config.ts` | ⚪ Оставлен | — |
| `app-scaffold.config.json` | ⚪ Оставлен | — |
| `installer.sh` | ⚪ Оставлен | — |
| `schemas/refactor-audit.schema.json` | ⚪ Оставлен | — |

---

## Удалены (11 файлов, monorepo-only)

| Файл | Назначение (было) |
|------|-------------------|
| `audit-cli-publish.ts` | Аудит CLI-пакетов перед npm publish |
| `quality-gate.sh` | CI quality gate для monorepo |
| `check-sdk-integration.sh` | Проверка SDK в apps/engine |
| `validate-data-bundle.ts` | Сравнение data bundle между apps |
| `configure-data-alias.ts` | Переключение @ui8kit/data alias |
| `copy-templates-to-dev.ts` | Копирование шаблонов из engine/dist |
| `bundle-data.ts` | Сборка data bundle для apps/{target} |
| `pipeline-app.ts` | Оркестрация monorepo pipeline |
| `engine.sh` | generate + copy-templates |
| `generate-uikit-map.ts` | Генерация map из packages/generator |
| `compare-whitelist-keys.ts` | Сравнение с tw-css-extended.json |

---

## Описание активных скриптов

### `finalize-dist.ts` (новый)

**Назначение:** Превращает `dist/react/` (сгенерированные блоки без DSL) в полноценное
standalone Vite-приложение, готовое к `bun install && bun run dev`.

**Что делает:**
1. Перемещает `dist/react/blocks|layouts|partials` → `dist/react/src/`
2. Исправляет `MainLayout.tsx` (баг генератора: отсутствует параметр props)
3. Генерирует `index.ts` для blocks, layouts, partials
4. Копирует `src/components`, `routes`, `providers`, `data`, `css`, `variants`, `lib`
5. Копирует `fixtures/` → `dist/react/fixtures/`
6. Генерирует `package.json`, `vite.config.ts`, `tsconfig.json`, `postcss.config.js`, `index.html`

**Результат `dist/react/`:**
```
dist/react/
├── src/
│   ├── blocks/       ← сгенерировано (без DSL: If/Var/Loop → plain React)
│   ├── layouts/      ← сгенерировано
│   ├── partials/     ← сгенерировано
│   ├── components/   ← @ui8kit/core alias
│   ├── routes/       ← реальные маршруты с context данными
│   ├── providers/    ← ThemeProvider, AdminAuthProvider
│   ├── data/         ← context.ts с реальными fixtures
│   ├── css/          ← Tailwind v4 + shadcn CSS
│   └── variants/     ← CVA конфиги
├── fixtures/         ← JSON данные (landing, menu, recipes, blog, promotions, admin)
├── package.json
├── vite.config.ts    ← port 3021, @ui8kit/core alias
├── tsconfig.json
├── postcss.config.js
└── index.html
```

---

### `clean-workspace.sh` (адаптирован)

**Назначение:** Полная очистка проекта.

**Удаляет:** `node_modules`, `dist`, `*.tsbuildinfo`

```bash
bun run clean
```

---

### `clean-engine.sh` (адаптирован)

**Назначение:** Очистка только `dist/react/` перед повторной генерацией.

**Удаляет:** `dist/react/`, `node_modules/.vite`, `*.tsbuildinfo`

```bash
bun run clean:dist
# → затем: bun run generate && bun run finalize
```

---

### `refactor-audit.ts` (адаптирован)

**Назначение:** Сканирует `src/` и `fixtures/` на residual legacy-термины
из `.manual/brand-mapping.json`. Пишет отчёт в `.cursor/reports/`.

**Изменено:** `defaultScope` = `["src", "fixtures"]` (было: apps/engine, packages/*)

```bash
bun run audit:refactor
```

---

### `validate-invariants.ts` (адаптирован)

**Назначение:** Проверяет архитектурные инварианты standalone-приложения.

**Проверки:**
- `fixtures/shared/page.json` — есть `website` и `admin` массивы
- `src/App.tsx` — содержит все обязательные маршруты (`/`, `/menu`, `/menu/:id`, ...)
- `src/routes/` — файлы для всех route-компонентов существуют
- `src/blocks/index.ts` — все `.tsx` файлы из `src/blocks/` экспортированы
- `src/data/context.ts` — все импортируемые fixtures-файлы существуют
- `dist/react/` — blocks/layouts/partials сгенерированы, `package.json` есть (finalize выполнен)

```bash
bun run validate:invariants
```

---

### `build-props-classlist.ts` (адаптирован)

**Назначение:** Парсит `src/lib/utility-props.map.ts`, извлекает все prop→class
комбинации и пишет `src/lib/ui8kit.list.props.json`.

**Изменено:** Пути с `packages/ui8kit/src/lib/` → `src/lib/`

```bash
bun run build:props
```

---

## Workflow

### Разработка
```bash
bun run dev                 # Vite dev server (port 3020)
bun run validate            # Validate props + DSL
bun run lint:dsl            # Lint DSL rules in src/
bun run validate:invariants # Check architectural invariants
```

### Генерация standalone dist
```bash
bun run dist:app            # = generate + finalize
# или по шагам:
bun run generate            # bunx ui8kit-generate → dist/react/{blocks,layouts,partials}
bun run finalize            # scripts/finalize-dist.ts → complete app in dist/react/

# Запуск результата:
cd dist/react
bun install
bun run dev                 # http://localhost:3021
```

### Очистка
```bash
bun run clean               # Полная очистка (node_modules + dist)
bun run clean:dist          # Только dist/react/ (перед re-generate)
```

### Аудит
```bash
bun run audit:refactor      # Поиск legacy-терминов в src/ + fixtures/
bun run build:props         # Пересборка ui8kit.list.props.json
```
