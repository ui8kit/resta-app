# Аудит `generate.ts` (UI8Kit Generator)

## Контекст

Файл `generate.ts` сейчас совмещает:
- orchestration пайплайна;
- запуск отдельных сервисов;
- файловые операции;
- пост-обработки (UnCSS, assets, client script, template);
- вспомогательные утилиты HTML/CSS.

Из-за этого файл выполняет роль «god-file»: удобно стартовать, но сложно безопасно развивать.

---

## Что за что отвечает (сервисы и стадии)

### Сервисы, которые регистрируются в `generate()`

- `LayoutService` — логика layout-уровня (в текущем потоке практически не используется напрямую внутри этого файла).
- `RenderService` — SSR-рендер React маршрутов в HTML-фрагменты для `views`.
- `HtmlConverterService` — извлечение/конвертация классов и CSS-правил из HTML.
- `ViewService` — исторически для views/partials, но в этом файле генерация views идёт вручную через `RenderService`.
- `CssService` — stage-ориентированная CSS-генерация (в этом файле параллельно есть отдельная ручная `generateCss`).
- `HtmlService` — stage-ориентированная HTML-генерация.
- `AssetService` — stage-ориентированная работа с ассетами.

### Стадии, которые добавляются в `generate()`

- `LayoutStage`
- `ViewStage`
- `CssStage`
- `HtmlStage`
- `AssetStage`

### Ключевое замечание по архитектуре

Сейчас orchestrator/stages **инициализируются**, но основной поток ниже (`generateViews`, `generateCss`, `generateHtml`, `copyAssets`...) выполняется **вручную**, а не через единый `orchestrator.run(...)`.

Это создаёт дублирование двух архитектур:
- «новая» (Orchestrator + Stage + Service)
- «ручная» (прямые вызовы helper-функций в этом же файле)

---

## Что за что отвечает (функции в файле)

### Верхнеуровневая

- `generate(config)` — главный сценарий генерации:
  1) views  
  2) class log (опц.)  
  3) css  
  4) html  
  5) assets (опц.)  
  6) vite bundle copy (опц.)  
  7) client script (опц.)  
  8) uncss (опц.)  
  9) elements (опц.)  
  10) templates (опц.)

### Генерация артефактов

- `generateViews` — рендер route -> `dist/html-views/pages/**/*.html`.
- `generateClassLog` — сбор классов в json-логи (через `ClassLogService`).
- `generateCss` — генерация:
  - `variants.apply.css`
  - `tailwind.apply.css`
  - `ui8kit.local.css` (если `pureCss`).
- `generateHtml` — сборка финальных страниц `dist/html/**/index.html`.
- `copyAssets` — копирование файлов по pattern (грубое роутирование по расширениям).
- `copyViteBuildArtifacts` — копия Vite артефактов с переименованием.
- `generateClientScript` — инжект локального JS (toggle dark mode).
- `runUncss` — запуск UnCSS и запись `optimized.css`.
- `generateVariantElements` — генерация TSX-элементов из variants.
- `generateTemplates` — генерация шаблонов (react/liquid/handlebars/twig/latte).

### Вспомогательные

- `createMinimalContext` — заглушка `IServiceContext` без реального event bus/registry.
- `mergeCssFiles` — конкатенация CSS.
- `buildMetaTags` — SEO-мета.
- `processHtmlContent` — режимы `tailwind | semantic | inline`.
- `buildSimpleHtmlDocument` — базовый html-документ со ссылкой на `/css/styles.css`.
- `createGenerator` / `default export` — backward compatibility.

---

## Проблемы и риски

## 1) Смешаны две архитектуры (главный долг)

- Есть регистрация orchestrator/stages/services, но фактическое выполнение — ручное.
- Усложняет поддержку: не ясно, какой путь «канонический».

**Рефакторинг:** выбрать один путь:
- либо полностью перейти на `Orchestrator` и убрать ручные шаги;
- либо убрать orchestrator-код из `generate.ts` и оставить понятный procedural pipeline.

## 2) `createMinimalContext` как технический костыль

- Сервисы получают «фейковый» контекст с `as any`.
- Это скрывает ошибки интеграции и ломает контракт `IServiceContext`.

**Рефакторинг:** вынести factory реального контекста (или lightweight runtime context) в отдельный модуль и использовать единообразно.

## 3) Низкая cohesion файла

- В одном файле и orchestration, и рендер, и css merge, и asset copy, и uncss, и template generation.

**Рефакторинг:** разнести по модулям:
- `pipelines/generate-site.ts`
- `steps/generate-views.ts`
- `steps/generate-css.ts`
- `steps/generate-html.ts`
- `steps/postprocess-uncss.ts`
- `steps/copy-assets.ts`

## 4) UnCSS реализация неустойчива для современных сценариев

- UnCSS старый и капризный на Windows/URL-схемах.
- Для Tailwind v4 и динамических классов часто лучше контролируемый content-based build.

**Решение:** оставить как опциональный legacy-шаг, но:
- явно документировать ограничения;
- добавить стабильный fallback/skip;
- не делать обязательным этапом.

## 5) `copyAssets` слишком примитивно раскладывает файлы

- Логика «если путь содержит `/css/`» хрупкая.
- Потеря структуры: файлы кладутся по basename, возможны коллизии имён.

**Рефакторинг:** копировать с сохранением относительной структуры или configurable rules map.

## 6) Дубли ответственности CSS/HTML

- Есть stage-based `CssService`/`HtmlService`, но отдельно `generateCss`/`generateHtml`.

**Решение:** оставить только один источник истины.

---

## Что можно удалить уже сейчас (с низким риском)

Ниже — кандидаты **при условии**, что вы подтверждаете использование только текущего react->html пайплайна (как в проекте сейчас):

- Удалить регистрацию orchestrator/stages/services из `generate()`, если они реально нигде не исполняются в этом сценарии.
- Удалить `createGenerator()` и default export-object, если API-потребители используют именованный `generate`.
- Удалить/перенести `generateClientScript`, если в проекте скрипт не подключается в итоговом HTML.
- Удалить `copyViteBuildArtifacts`, если вы больше не копируете хэшированные Vite-бандлы в static output.

---

## Что лучше не удалять пока

- `generateTemplates` и связанный блок `template`, если есть планы отдельного template-пайплайна.
- `generateClassLog`, если он участвует в контроле классов/линтинге.
- `runUncss` как optional-инструмент, но лучше вынести в отдельный шаг/скрипт.

---

## Рекомендуемый план рефакторинга (поэтапно)

1. **Фаза 1 (без изменения поведения):**
   - Вынести шаги в отдельные файлы (`steps/*`), оставить тот же порядок вызовов.
   - Покрыть smoke-тестом весь happy-path.

2. **Фаза 2 (устранение дублирования):**
   - Удалить либо orchestrator-ветку, либо ручную ветку.
   - Убрать `createMinimalContext` и `as any`.

3. **Фаза 3 (чистка legacy):**
   - Пересмотреть нужность `viteBundle`, `clientScript`, `uncss`.
   - Упростить `GenerateConfig`: отделить core-параметры от optional postprocess.

4. **Фаза 4 (контракты):**
   - Добавить строгую типизацию для mode-специфичных опций.
   - Ввести проверку взаимозависимостей (например, `uncss.enabled` требует `htmlFiles` и `cssFile`).

---

## Быстрый итог

`generate.ts` функционально рабочий, но архитектурно перегружен и содержит явные признаки переходного состояния.  
Главная точка улучшения — убрать параллельное сосуществование orchestrator-подхода и ручного procedural-пайплайна, чтобы снизить сложность и стоимость изменений.

