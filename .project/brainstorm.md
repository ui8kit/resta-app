Хорошие вопросы. Здесь три связанные проблемы. Разберу каждую.

---

## Проблема 1: `apps/react/` не существует

Сейчас цепочка создания `apps/react` такая:

1. `bun run generate` (в apps/dsl) -- пишет blocks/layouts/partials в `../react`
2. `bun run finalize` (в apps/dsl) -- достраивает apps/react до полноценного Vite-приложения (package.json, vite.config.ts, tsconfig.json, routes, components, fixtures...)

Проблема: если `apps/react/` не существует, `generate` всё равно запишет файлы (mkdir recursive), но `finalize` проверяет наличие и падает (строка 108). А `turbo run generate:html` после этого вызовет `ui8kit-generate html` из apps/react, у которого нет ни `node_modules`, ни `dist.config.json`.

**Рекомендация**: Объединить `generate` + `finalize` + генерацию `dist.config.json` в единый скрипт `dist:app`, который:

```
apps/react не существует?
  → mkdir apps/react
  → generate (DSL→React)
  → finalize (shell, config files)
  → bun install --cwd apps/react
  → dist.config.json (generate from template)
  → ready
```

При этом `dist.config.json` генерировать в finalize на шаге 7 рядом с package.json, vite.config.ts и остальными. Источник данных для него -- `ui8kit.config.json` из apps/dsl (маршруты вычисляются из fixtures, fixtures.dir, tokens path) + разумные defaults.

---

## Проблема 2: `dist.config.json` -- откуда он берётся?

Сейчас `dist.config.json` -- это вручную созданный файл в apps/react. Finalize его **не создаёт и не обновляет**. Это значит:

- При чистом `apps/react/` его нет -- `generate:html` упадёт
- При обновлении маршрутов/fixtures в apps/dsl -- `dist.config.json` устареет

**Рекомендация**: Finalize должен генерировать `dist.config.json` на шаге 7. Шаблон:

```typescript
// in finalize-dist.ts, step 7:
const distConfig = {
  app: { name: rootPkg.name.replace(/-dsl$/, ''), lang: "en" },
  render: {
    appEntry: "src/App.tsx",
    skipRoutes: ["/admin/dashboard"],
  },
  css: { outputDir: "dist/css", pureCss: true },
  html: {
    routes: buildRoutesFromFixtures(), // scan fixtures/ to get routes
    outputDir: "dist/html",
    mode: "tailwind",
  },
  postcss: {
    enabled: true,
    entryImports: ["src/assets/css/shadcn.css"],
    sourceDir: "dist/html",
    outputDir: "dist/html/css",
    uncss: { enabled: true },
  },
  mappings: { ui8kitMap: "src/ui8kit.map.json" },
  fixtures: { dir: "fixtures", collections: ["menu", "recipes", "blog", "promotions"] },
};
```

Либо, если хочется управлять из корня -- можно добавить секцию `dist` в `ui8kit.config.json` (apps/dsl):

```json
{
  "outDir": "../react",
  "dist": {
    "render": { "appEntry": "src/App.tsx", "skipRoutes": ["/admin/dashboard"] },
    "html": { "mode": "tailwind" },
    "postcss": { "enabled": true, "uncss": { "enabled": true } }
  }
}
```

Finalize читает `ui8kit.config.json`, берёт из него `dist.*`, дополняет defaults и записывает `dist.config.json` в apps/react. Один источник правды -- `ui8kit.config.json`.

---

## Проблема 3: HTML-генерация не нужна

Когда apps/react используется только как SPA (dev/build), без статической генерации HTML -- скрипты `generate:html`, `generate:styles`, `generate:static` и файл `dist.config.json` не нужны.

**Рекомендация**: Сделать их **условными**.

### Вариант A: Флаг в `ui8kit.config.json`

```json
{
  "dist": {
    "static": false
  }
}
```

Если `static: false` -- finalize не добавляет generate-скрипты в package.json и не создаёт dist.config.json. Turbo не найдёт `generate:html` скрипт в apps/react и просто пропустит.

### Вариант B: `--no-static` флаг для finalize

```bash
bun run finalize           # полный набор (с dist.config.json + generate:html скрипт)
bun run finalize --spa     # SPA-only (без generate-скриптов, без dist.config.json)
```

### Вариант C (самый простой): Ничего не менять в коде

Turbo пропускает задачи, если скрипт не найден в package.json. Если finalize пишет generate:html скрипт всегда -- он просто не вызывается, пока пользователь сам не запустит `bun run generate:html` из apps/react. `dist.config.json` без использования ничему не мешает. Это приемлемо на текущем этапе.

---

## Итого: минимальный план

| Что | Где | Суть |
|---|---|---|
| Генерация `dist.config.json` | finalize-dist.ts, шаг 7 | Автогенерация из fixtures + defaults |
| Источник настроек | `ui8kit.config.json` → `dist` секция | Один конфиг в apps/dsl |
| Когда `apps/react/` нет | `generate` создаст папку, `finalize` достроит | Уже работает (mkdir recursive) |
| Когда HTML не нужен | Скрипты есть, но не вызываются | Turbo пропускает. Либо `dist.static: false` для чистоты |

Самый прагматичный путь сейчас -- добавить генерацию `dist.config.json` в finalize (шаг 7), с данными из ui8kit.config.json. Остальное -- оптимизация, которая может подождать. Если хочешь, переключись в Agent mode и я реализую.