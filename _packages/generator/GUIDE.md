# @ui8kit/generator — Полный практический гайд

Гайд описывает актуальный runtime генератора после перехода на архитектуру `Orchestrator + Stage + Service` без Liquid-пайплайна.

## 1) Что делает генератор

`@ui8kit/generator` решает задачу статической сборки:

- вход: заранее подготовленные HTML view-файлы;
- выход: статические HTML-страницы + CSS-артефакты;
- основной pipeline: `CssStage -> HtmlStage` (+ опционально `ClassLogStage`).

Важно:

- `dist/html-views` больше не является обязательной частью пайплайна;
- источник страниц — `dist/html/pages` (или любой другой каталог, заданный через `html.viewsDir` + `html.viewsPagesSubdir`);
- генерация variant elements (`generateVariantElements`) удалена.

## 2) Ключевые принципы настройки

### 2.1 Один источник правды для маршрутов

Используйте один объект маршрутов для `css.routes` и `html.routes`, чтобы:

- CSS собирался только для нужных страниц;
- HTML и CSS оставались синхронизированы;
- не появлялись лишние/пустые страницы.

### 2.2 Предсказуемые входы/выходы

- `html.viewsDir` + `html.viewsPagesSubdir` указывают, где лежат source views;
- `html.outputDir` указывает, куда писать финальные страницы;
- `css.outputDir` указывает, куда писать промежуточные CSS-артефакты (`tailwind.apply.css`, `ui8kit.local.css`, `variants.apply.css`).

### 2.3 Режимы HTML зависят от сценария публикации

- `tailwind`: сохраняет классы, подходит для внешнего `styles.css`;
- `semantic`: заменяет utility-классы на semantic-классы из `data-class`;
- `inline`: как `semantic`, но встраивает CSS прямо в страницу (удобно для email/изолированных поставок).

### 2.4 Postprocess — опционален

- `uncss` включается только при явной конфигурации;
- class log (`classLog.enabled`) включается отдельно и не обязателен для сборки.

## 3) Конфиг `generate()` по блокам

```ts
import { generate } from '@ui8kit/generator';

const routes = {
  '/': { title: 'Home' },
  '/menu': { title: 'Menu' },
  '/blog': { title: 'Blog' },
  '/menu/grill-salmon-steak': { title: 'Grill Salmon Steak' },
};

const result = await generate({
  app: { name: 'Resta App', lang: 'en' },

  mappings: {
    ui8kitMap: './src/lib/ui8kit.map.json',
    shadcnMap: './src/lib/shadcn.map.json',
  },

  css: {
    routes: Object.keys(routes),
    outputDir: './dist/css',
    pureCss: true,
    outputFiles: {
      applyCss: 'tailwind.apply.css',
      pureCss: 'ui8kit.local.css',
      variantsCss: 'variants.apply.css',
    },
  },

  html: {
    viewsDir: './dist/html',
    viewsPagesSubdir: 'pages',
    routes,
    outputDir: './dist/html',
    mode: 'tailwind', // 'tailwind' | 'semantic' | 'inline'
    cssHref: '/css/styles.css',
    stripDataClassInTailwind: false,
  },

  classLog: {
    enabled: false,
    outputDir: './dist/maps',
    baseName: 'ui8kit',
  },

  // Опционально:
  // uncss: {
  //   enabled: true,
  //   htmlFiles: ['./dist/html/index.html'],
  //   cssFile: './dist/html/css/styles.css',
  //   outputDir: './dist/html/css',
  //   outputFileName: 'unused.css',
  // },
});

console.log(result.success, result.generated, result.errors);
```

## 4) Сценарии запуска (из корня проекта)

### 4.1 Полный цикл подготовки `dist/react`

```bash
bun run dist:app
```

Что делает:

- линт/валидации;
- генерация `dist/react`;
- finalize шаг;
- проверка типов в `dist/react`.

### 4.2 Генерация статического HTML (из React-артефактов)

```bash
bun run generate:html
```

Ожидаемый результат:

- страницы в `dist/html/.../index.html`;
- вложенные динамические маршруты в виде подпапок (`/menu/item` -> `dist/html/menu/item/index.html`);
- source views в `dist/html/pages`.

### 4.3 Генерация финального CSS и UnCSS-оптимизации

```bash
bun run generate:styles
```

Ожидаемый результат:

- `dist/html/css/styles.css` — полный сгенерированный CSS;
- `dist/html/css/unused.css` — оптимизированный CSS после UnCSS (если шаг успешен).

### 4.4 Полная статическая генерация

```bash
bun run generate:static
```

Эквивалент:

```bash
bun run generate:html && bun run generate:styles
```

## 5) Сценарии запуска (из пакета генератора)

Используйте для разработки самого генератора:

```bash
cd _packages/generator
bun run typecheck
bun run test
bun run test:watch
bun run test:coverage
```

## 6) Проверки качества и стабильности

### 6.1 Минимальный чеклист после изменений в генераторе

1. `bun run typecheck` в `_packages/generator`.
2. `bun run test` в `_packages/generator`.
3. `bun run generate:static` в корне проекта.
4. Проверка целевых файлов:
   - `dist/html/index.html`
   - `dist/html/menu/index.html`
   - `dist/html/menu/grill-salmon-steak/index.html`
   - `dist/html/css/styles.css`
   - `dist/html/css/unused.css` (если UnCSS включён/успешен)

### 6.2 Что проверять визуально/логически

- у страниц есть контент (не пустой `<body>`);
- ссылка на CSS соответствует `html.cssHref`;
- нет дублирующих путей между source views и final output;
- одиночные маршруты пишутся в подпапки через `index.html`.

## 7) Тестовая стратегия (на уровне принципов)

### Unit (быстрые и изолированные)

- `CssService`: генерация CSS-артефактов, устойчивость к отсутствию `src/variants`;
- `HtmlService`: корректная обработка `tailwind/semantic/inline`;
- `HtmlConverterService`: детерминированные селекторы, стабильное преобразование.

### Integration (сквозные внутри пакета)

- проверка полного `generate()` на наборе маршрутов;
- контроль структуры выходных файлов;
- проверка, что ошибки stage корректно поднимаются в `GenerateResult.errors`.

### E2E (уровень приложения)

- `bun run generate:static` в root;
- smoke-проверка критичных страниц и CSS-артефактов.

## 8) Частые проблемы и диагностика

### Проблема: пустая страница в `dist/html/.../index.html`

Проверьте:

- существует ли соответствующий source view в `dist/html/pages`;
- присутствует ли маршрут в `html.routes`;
- совпадают ли ключи `css.routes` и `html.routes`.

### Проблема: слишком большой `styles.css`

Проверьте:

- что `generate:styles` сканирует `dist/html` (актуальный источник классов);
- что выполнен шаг UnCSS и создан `unused.css`;
- что в маршруты не попадают лишние страницы.

### Проблема: падение на UnCSS

Проверьте:

- валидность путей `uncss.htmlFiles` и `uncss.cssFile`;
- что CSS-файл уже существует к моменту запуска postprocess.

## 9) Актуальные ограничения

- `css.entryPath` удалён из конфигурации генератора;
- `generate-templates` CLI удалён из runtime-потока;
- `buildProject()` оставлен как compatibility stub и возвращает явную ошибку;
- legacy template-engine track (Liquid/Twig/Handlebars/Latte) не участвует в основном static runtime.
