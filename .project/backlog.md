
## Текущее состояние

### Что есть сейчас

1. **Генератор** выдаёт только **16 файлов** из 27+ в registry:
   - DashSidebar, HeroBlock, SidebarContent
   - blog/BlogPageView, menu/MenuPageView, recipes/RecipesPageView, promotions/PromotionsPageView
   - layouts (MainLayout, AdminLayout, DashLayout, MainLayoutView)
   - partials (Header, Footer, Sidebar, ThemeToggle, DomainNavButton)

2. **Finalize** дополняет недостающее копированием из `src/`:
   - LandingPageView, admin/*, design/*, Detail-страницы
   - design/previews/*, design/fixtures/*

3. **Всё скопированное содержит DSL** — `@ui8kit/dsl`, If, Var, Loop:
   - `design/previews/MenuDetailPreview.tsx`, `RecipeDetailPreview.tsx`, `PromotionDetailPreview.tsx`
   - `design/ComponentsPageView.tsx`, `TypographyPageView.tsx`, `ColorsPageView.tsx`, `WidgetsPageView.tsx`, `OverviewPageView.tsx`, `PagesPageView.tsx`
   - `design/fixtures/pages.ts`
   - `admin/LoginPageView.tsx`
   - `recipes/DetailPageView.tsx`, `menu/DetailPageView.tsx`, `blog/DetailPageView.tsx`, `promotions/DetailPageView.tsx`
   - `components/ui/Icon.tsx`, `components/Sheet.tsx`

4. **Инфраструктура**:
   - `assets` — копирование из `src/assets` (было `src/css` → `src/assets`)
   - `package.json` — берётся из root, в т.ч. `@ui8kit/dsl` и `@ui8kit/generator` (не нужны в dist)
   - `vite.config.ts`, `tsconfig.json`, `postcss.config.js`, `index.html` — создаются

---

## Что нужно сделать

### 1. Генератор — выдавать все компоненты без DSL

- **Причина**: генератор пропускает 11+ компонентов (LandingPageView, admin, design, Detail-страницы).
- **Решение**: разобраться, почему пропускаются:
  - ошибки в `transformJsxFile` (логировать ошибки);
  - `tree.children.length === 0` (сбрасывать компоненты);
  - добавить `--verbose` в `ui8kit-generate` для отладки.
- **Цель**: все 27+ registry items должны генерироваться и быть без DSL.

### 2. Убрать копирование блоков из source

- **Сейчас**: `copyMissingFiles` копирует недостающие блоки из `src/` → в `dist` попадает DSL.
- **Решение**: убрать `copyMissingFiles` для blocks/layouts/partials.
- **Итог**: если генератор не создал файл — это ошибка, а не повод копировать исходник с DSL.

### 3. Исправить ReactPlugin

- **Проблема**: несколько sibling `<If>` дают невалидный JSX (ThemeToggle и др.).
- **Решение**: оборачивать в `<>...</>` при нескольких sibling-выражениях.
- **Проблема**: MainLayout без props.
- **Решение**: генерировать корректный `MainLayout` с `ComponentProps<typeof MainLayoutView>`.

### 4. Инфраструктура для dist

- **Файлы**: `package.json`, `vite.config.ts`, `tsconfig.json`, `postcss.config.js`, `index.html`.
- **Assets**: копировать `src/assets` в `dist/react/src/assets`.
- **Package.json**:
  - исключить `@ui8kit/dsl`, `@ui8kit/generator` из зависимостей;
  - оставить только то, что нужно для runtime (react, react-dom, @ui8kit/dsl не нужен).

### 5. Порядок работ

1. Генератор — исправить пропуски и генерацию всех блоков.
2. ReactPlugin — исправить sibling If и MainLayout.
3. Finalize — убрать `copyMissingFiles` для blocks/layouts/partials.
4. Finalize — скорректировать `package.json` и копирование assets.
5. Проверка: `bun run dist:app` → `cd dist/react && bun install && bun run build` — без DSL и без ошибок.

---

Сейчас в `dist/react` есть DSL — это результат копирования из source. Целевое состояние: `dist/react` полностью генерируется, без DSL и без копирования исходных блоков.