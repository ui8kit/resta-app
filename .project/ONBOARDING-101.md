# UI8Kit DSL — Руководство для стажёра (101)

Полное введение в разработку валидных DSL-приложений на UI8Kit. После прочтения ты сможешь создавать интерфейсы без техдолга, хардкода и с соблюдением архитектуры.

---

## Содержание

1. [Что это за проект](#1-что-это-за-проект)
2. [Окружение и первые команды](#2-окружение-и-первые-команды)
3. [Структура монорепозитория](#3-структура-монорепозитория)
4. [Ключевые концепции](#4-ключевые-концепции)
5. [Поток данных](#5-поток-данных)
6. [DSL-компоненты: If, Var, Loop, Slot](#6-dsl-компоненты-if-var-loop-slot)
7. [Семантические пропсы и data-class](#7-семантические-пропсы-и-data-class)
8. [Куда класть новый код](#8-куда-класть-новый-код)
9. [Команды и рабочий процесс](#9-команды-и-рабочий-процесс)
10. [Валидация и линтинг](#10-валидация-и-линтинг)
11. [Генерация React и HTML+CSS](#11-генерация-react-и-htmlcss)
12. [Антипаттерны — чего избегать](#12-антипаттерны--чего-избегать)
13. [Первая задача пошагово](#13-первая-задача-пошагово)
14. [Чеклист перед коммитом](#14-чеклист-перед-коммитом)

---

## 1. Что это за проект

**UI8Kit** — дизайн-система и конвейер для создания веб-приложений. Особенности:

- **DSL (Domain-Specific Language)** — вместо обычного JS в JSX используются компоненты `<If>`, `<Var>`, `<Loop>`, `<Slot>`. Это позволяет генерировать не только React, но и чистый HTML+CSS.
- **Фикстуры** — контент хранится в JSON (`fixtures/*.json`), а не в коде. Никакого хардкода.
- **Семантика** — пропсы (`gap="6"`, `bg="primary"`) маппятся на Tailwind-классы. Никаких `className` и `style`.
- **Валидный HTML5** — используются семантические теги (`section`, `article`, `header`, `nav`, `main`, `footer`).

**Твоя цель:** научиться писать блоки и страницы так, чтобы они проходили валидацию и корректно генерировались в React и HTML+CSS.

---

## 2. Окружение и первые команды

### Установка Bun

Проект использует **Bun** как рантайм и пакетный менеджер:

```bash
# Windows (PowerShell)
irm bun.sh/install.ps1 | iex

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

### Базовые команды

```bash
# Установка зависимостей (из корня репозитория)
bun install

# Запуск dev-сервера DSL-приложения
cd apps/dsl
bun run dev

# Запуск design system
cd apps/dsl-design
bun run dev
```

После `bun run dev` откроется приложение (обычно http://localhost:3020 или другой порт из конфига).

---

## 3. Структура монорепозитория

```
@ui8kit-resta-app/
├── apps/
│   ├── dsl/              ← Основное DSL-приложение (ресторан)
│   ├── dsl-design/       ← Design system (превью компонентов, токенов)
│   ├── react/            ← Сгенерированный React (из dsl)
│   └── react-design/     ← Сгенерированный React (из dsl-design)
├── packages/
│   ├── maintain/         ← Проверки, clean, audit
│   ├── generator/        ← Генерация React, HTML, CSS
│   ├── dsl/              ← If, Var, Loop, Slot
│   ├── sdk/              ← createContext, типы
│   └── lint/             ← ui8kit-lint-dsl
├── .project/             ← Документация проекта (в т.ч. этот гайд)
└── .cursor/rules/        ← Правила для AI (best-practices, architecture)
```

**Рабочие приложения:**

- `apps/dsl` — основной DSL-код (блоки, роуты, фикстуры)
- `apps/dsl-design` — дизайн-система (превью компонентов, токенов, типографики)

**Сгенерированные приложения** (`react`, `react-design`) — результат `bun run generate`. Они не редактируются вручную.

---

## 4. Ключевые концепции

### 4.1 Block

**Block** — переиспользуемая секция страницы или целая страница. Примеры: `HeroBlock`, `SidebarContent`, `MenuPageView`.

- **Блок-секция** — часть страницы (HeroBlock, карточка)
- **PageView** — полная страница (LandingPageView, MenuPageView)

### 4.2 Fixtures

**Фикстуры** — JSON-файлы с данными. Вся контентная информация берётся отсюда.

```
fixtures/
├── shared/           # site.json, page.json, navigation.json
├── landing.json
├── menu.json
├── recipes.json
├── blog.json
├── promotions.json
└── admin.json
```

Пример `fixtures/landing.json`:

```json
{
  "title": "Welcome to RestA",
  "subtitle": "Experience fine dining...",
  "ctaText": "View Menu",
  "ctaUrl": "/menu",
  "secondaryCtaText": "Our Recipes",
  "secondaryCtaUrl": "/recipes"
}
```

### 4.3 Context

**Context** — единая точка входа для данных. `context.ts` загружает фикстуры и отдаёт их в роуты и блоки.

```tsx
// В роуте
import { context } from '@/data/context';

<LandingPageView landing={context.landing} navItems={context.navItems} ... />
```

### 4.4 Routes

**Роуты** — связывают URL с PageView и передают данные из context.

```tsx
// src/App.tsx
<Route path="/" element={<LandingPage />} />
<Route path="/menu" element={<MenuPage />} />
<Route path="/menu/:slug" element={<MenuDetailPage />} />
```

### 4.5 Layouts и Partials

- **Layout** — обёртка страницы (MainLayout, AdminLayout). Содержит header, sidebar, main, footer.
- **Partial** — переиспользуемый фрагмент (Header, Footer, ThemeToggle, SidebarContent).

---

## 5. Поток данных

```
fixtures/*.json
    → src/data/adapters/fixtures.adapter.ts
    → src/data/context.ts (createContext)
    → src/routes/*.tsx (передают данные в PageView)
    → src/blocks/*PageView.tsx (рендерят с Var, Loop, If)
```

**Важно:** данные всегда идут из context или props. Хардкод строк, чисел, массивов в JSX запрещён.

---

## 6. DSL-компоненты: If, Var, Loop, Slot

В JSX **нельзя** использовать:

- `?.` (optional chaining для условного рендера)
- `&&` для условного рендера
- `{condition ? 'a' : 'b'}`
- `.map()` для списков

Вместо этого — **DSL-компоненты** из `@ui8kit/dsl`.

### 6.1 Var — вывод значения

```tsx
// ✅ Правильно
<Var name="title" value={title} />

// ❌ Неправильно
{title}
{item?.name}
```

`name` — имя для отладки/генерации. `value` — само значение.

### 6.2 If — условный рендер

```tsx
// ✅ Правильно
<If test="subtitle" value={!!subtitle}>
  <Text data-class="hero-subtitle">
    <Var name="subtitle" value={subtitle} />
  </Text>
</If>

// ❌ Неправильно
{subtitle && <Text>{subtitle}</Text>}
{subtitle ? <Text>{subtitle}</Text> : null}
```

### 6.3 Loop — обход массива

```tsx
// ✅ Правильно (render prop)
<Loop each="items" as="item" data={items}>
  {(item: { id: string; title: string }) => (
    <Card key={item.id} data-class="item-card">
      <CardHeader>
        <CardTitle order={4}><Var name="item.title" value={item.title} /></CardTitle>
      </CardHeader>
    </Card>
  )}
</Loop>

// ❌ Неправильно
{items.map(item => (
  <Card key={item.id}>...</Card>
))}
```

### 6.4 Slot — слот для вставки контента

```tsx
<Slot name="extra">{children}</Slot>
```

### 6.5 Правило для опциональных значений

Если значение может быть `undefined` или `null`, оборачивай `<Var>` в `<If>`:

```tsx
<If test="subtitle" value={!!subtitle}>
  <Text><Var name="subtitle" value={subtitle} /></Text>
</If>
```

---

## 7. Семантические пропсы и data-class

### 7.1 Запрещено

- `className` — не используй
- `style={{ ... }}` — не используй
- Сырые HTML-теги (`<div>`, `<span>`, `<h1>`, `<p>`) — не используй

### 7.2 Разрешено

Импорты из `@ui8kit/core`:

- **Layout:** Block, Stack, Group, Grid, Container, Box
- **Контент:** Title, Text, Image, Icon, Badge, Button
- **Композиты:** Card, CardHeader, CardTitle, CardContent, Accordion, Sheet, Field

Для каждого семантического элемента — **`data-class`** (обязательно):

```tsx
<Block component="section" data-class="hero-section">
<Stack data-class="hero-content">
<Title data-class="hero-title">
<Button data-class="hero-cta">
```

### 7.3 Семантические пропсы

| Проп | Примеры | Описание |
|------|---------|----------|
| `gap` | `"0"`, `"2"`, `"4"`, `"6"`, `"8"` | Отступ между элементами |
| `p`, `px`, `py` | `"4"`, `"8"`, `"16"` | Padding |
| `flex` | `"col"`, `"row"`, `"wrap"` | Направление flex |
| `items` | `"start"`, `"center"`, `"end"` | Выравнивание |
| `justify` | `"between"`, `"center"`, `"end"` | Выравнивание по главной оси |
| `fontSize` | `"sm"`, `"lg"`, `"2xl"`, `"4xl"` | Размер шрифта |
| `fontWeight` | `"normal"`, `"medium"`, `"bold"` | Жирность |
| `textColor` | `"foreground"`, `"muted-foreground"`, `"primary"` | Цвет текста |
| `bg` | `"primary"`, `"secondary"`, `"muted"`, `"card"` | Фон |
| `variant` (Button) | `"primary"`, `"outline"`, `"secondary"` | Вариант кнопки |

### 7.4 Цвета — только токены

```tsx
// ✅ Правильно
<Block bg="primary" data-class="hero">
<Button variant="primary">
<Text textColor="muted-foreground">

// ❌ Неправильно
<Block bg="blue-500">
<Button className="bg-[#3b82f6]">
```

### 7.5 Семантический HTML5 и проп `component`

Используй `component` для семантических тегов. Допустимые теги заданы в `component-tag-map.json` (пакет `@ui8kit/generator`). Валидация выполняется через HtmlConverterService, Maintain checker и ui8kit-validate.

**Block** — секционирование:

```tsx
<Block component="section" data-class="hero-section">   // секция страницы
<Block component="article" data-class="feature-card">   // карточка, статья
<Block component="header" data-class="page-header">    // шапка
<Block component="nav" data-class="main-nav">            // навигация
<Block component="main" data-class="page-main">         // основной контент
<Block component="footer" data-class="page-footer">      // подвал
<Block component="aside" data-class="sidebar">          // сайдбар
<Block component="figure" data-class="hero-image">      // иллюстрация
<Block component="form" data-class="contact-form">      // форма
```

**Box / Container** — layout-контейнеры: `div`, `form`, `blockquote`.

**Text** — типографика: `p`, `h1`–`h6`, `span`, `label`, `cite`, `q`, `figcaption` и др.

**Stack / Group** — layout: `div`, `span` (span только внутри `<a>` для inline).

**Field** — form-элементы: `input`, `textarea`, `select`, `button`.

Карта целиком: `packages/generator/src/lib/component-tag-map.json`.

---

## 8. Куда класть новый код

| Вопрос | Ответ | Папка |
|--------|-------|-------|
| Примитив или композит (Button, Card, Stack)? | Да | `src/components/` |
| CVA-варианты (button, badge)? | Да | `src/variants/` |
| Секция или целая страница? | Да | `src/blocks/` |
| Переиспользуемый фрагмент (header, footer)? | Да | `src/partials/` |
| Обёртка страницы? | Да | `src/layouts/` |
| Роут, который подключает PageView? | Да | `src/routes/` |
| Контекст и загрузка данных? | Да | `src/data/` |
| JSON-данные? | Да | `fixtures/` |

### Правило: не создавай лишних компонентов

Если есть `Card` в `src/components/`, не делай `FeatureCard` или `EventCard` из `Stack`/`Group`. Используй `Card` с разным контентом.

---

## 9. Команды и рабочий процесс

### 9.1 Разработка

Команды выполняются из корня приложения. Для основного приложения — `apps/dsl`, для дизайн-системы — `apps/dsl-design`.

```bash
cd apps/dsl          # или cd apps/dsl-design
bun run dev
```

### 9.2 Валидация и линтинг

```bash
bun run validate      # ui8kit-validate — конфиг, DSL, пропсы (в т.ч. component+tag)
bun run lint:dsl      # ui8kit-lint-dsl — проверка If/Var/Loop
bun run lint          # ui8kit-lint — общий линт
bun run typecheck     # TypeScript
```

**ui8kit-validate** проверяет:
- конфиг приложения;
- DSL-правила;
- пропсы (utility-props, цвета из токенов);
- соответствие `component` допустимым тегам (по `component-tag-map.json`).

### 9.3 Maintain (проверки проекта)

Конфиг живёт в корне приложения: **`apps/dsl/maintain.config.json`** или **`apps/dsl-design/maintain.config.json`**. Схема: `packages/maintain/schemas/maintain.config.schema.json`.

```bash
bun run maintain:check      # Все чекеры из maintain.config.json
bun run maintain:validate   # Только validate-чекеры, заданные в package.json приложения
```

`maintain:validate` отличается по приложениям:

- **apps/dsl:** `invariants,fixtures,view-exports,contracts`
- **apps/dsl-design:** `invariants,view-exports,contracts`

**Maintain checkers** (включаются секциями в `checkers` в `maintain.config.json`):
- **invariants** — роуты, fixtures, blocks, context;
- **fixtures** — соответствие JSON схемам;
- **viewExports** — экспорт View-компонентов (pattern, exportShape);
- **contracts** — соответствие blueprint и App;
- **refactorAudit** — аудит для рефакторинга (mapping, scope);
- **dataClassConflicts** — конфликты `data-class` в scope (pattern, ignoreDataClasses);
- **componentTag** — допустимые теги для компонентов (scope, pattern, tagMapPath);
- **colorTokens** — использование только токенов цветов (scope, pattern, utilityPropsMapPath);
- **genLint** — правила GEN001–GEN008 для блоков/лейаутов/partials (scope, pattern, rules);
- **lockedDirs** — запрет изменений в защищённых директориях (dirs, pattern);
- **viewHooks** — запрет React hooks в `*View.tsx` (pattern, allowedHooks);
- **utilityPropLiterals** — только статические литералы для utility props (scope, pattern, utilityPropsMapPath, `allowDynamicInLoop`);
- **orphanFiles** — поиск неиспользуемых файлов (scope, pattern, ignore, aliases);
- **blockNesting** — запрет nested `Block` и нескольких root `Block` в View;
- **clean** — очистка dist/node_modules (paths, pathsByMode).

Типичный текущий набор:

- **apps/dsl:** `invariants`, `fixtures`, `viewExports`, `contracts`, `dataClassConflicts`, `componentTag`, `colorTokens`, `genLint`, `lockedDirs`, `viewHooks`, `utilityPropLiterals`, `orphanFiles`, `blockNesting`, `clean`.
- **apps/dsl-design:** `invariants`, `viewExports`, `contracts`, `clean`, `lockedDirs`, `viewHooks`, `utilityPropLiterals`, `orphanFiles`, `blockNesting`.

Скрипты валидации/линтинга в `apps/dsl/scripts/` (validate-fixtures, validate-invariants, validate-view-exports, lint-gen) приводятся в соответствие с конфигом maintain; основная логика проверок — в пакете `@ui8kit/maintain`.

### 9.4 Генерация

```bash
bun run generate      # Генерирует React: в dsl → ../react, в dsl-design → ../react-design
bun run finalize      # Собирает финальное приложение
bun run dist:app     # Полный пайплайн (lint + validate + generate + finalize)
```

### 9.5 Blueprint (структура приложения)

```bash
bun run blueprint:scan      # Сканирует код и обновляет blueprint.json
bun run blueprint:validate # Проверяет соответствие blueprint
bun run blueprint:graph    # Строит граф зависимостей
```

### 9.6 Очистка

```bash
bun run clean:dist    # Очистить сгенерированный вывод
bun run clean         # Полная очистка (node_modules, outDir)
```

---

## 10. Валидация и линтинг

### 10.1 Обязательные проверки перед коммитом

1. `bun run lint:dsl` — проверка DSL (If, Var, Loop вместо обычного JS)
2. `bun run validate` — проверка конфига и пропсов
3. Если менял блоки/шаблоны — `bun run generate`

### 10.2 Типичные ошибки

| Ошибка | Решение |
|--------|---------|
| `gap="5"` invalid | Используй `gap="4"` или `gap="6"` |
| `fontSize="huge"` invalid | Используй `fontSize="4xl"` |
| `bg="red"` invalid | Используй `bg="destructive"` или другой токен |
| DSL: use `<Loop>` instead of `.map` | Замени `.map()` на `<Loop>` |
| DSL: use `<If>` instead of `&&` | Замени `&&` на `<If>` |
| Block does not allow tag "div" | Block — только section, article, header, nav, main, footer, aside, figure, address, form |
| Text does not allow tag "div" | Text — только p, h1–h6, span, label, cite, q и др. (см. component-tag-map) |
| Box/Stack/Group + form control | input, textarea, select, button — только в Field |

### 10.3 Валидация component+tag

Карта допустимых тегов: `packages/generator/src/lib/component-tag-map.json`. Используется:

- **HtmlConverterService** — при генерации HTML→CSS проверяет data-class + тег;
- **ui8kit-validate** — при проверке TSX;
- **Maintain** — чекер **componentTag** (в `maintain.config.json`) проверяет соответствие тегов; при необходимости задаётся `tagMapPath` или используется встроенная карта из generator.

Импорт для своих чекеров:

```ts
import { isTagAllowedForComponent, validateComponentTag } from '@ui8kit/generator/lib';
```

---

## 11. Генерация React и HTML+CSS

Генератор превращает DSL-компоненты в:

- **React** — чистый JSX без If/Var/Loop (в `../react` или `../react-design`)
- **HTML+CSS** — для статических платформ (Shopify, WordPress и т.п.)

Конфиг генерации — `ui8kit.config.json` в корне приложения. Там задаётся `outDir`, `target`, `platform`.

После `bun run generate` + `bun run finalize` можно запустить сгенерированное приложение:

```bash
cd ../react
bun install
bun run dev
```

---

## 12. Антипаттерны — чего избегать

### ❌ Хардкод данных

```tsx
// Неправильно
<Title>Welcome to RestA</Title>
<Text>Our menu items</Text>

// Правильно
<Title><Var name="title" value={title} /></Title>
<Text><Var name="subtitle" value={subtitle} /></Text>
```

### ❌ className и style

```tsx
// Неправильно
<div className="flex gap-4">
<Box style={{ padding: "16px" }}>

// Правильно
<Group gap="4">
<Stack p="4">
```

### ❌ Сырые HTML-теги

```tsx
// Неправильно
<div><h1>Title</h1><p>Text</p></div>

// Правильно
<Block><Title>Title</Title><Text>Text</Text></Block>
```

### ❌ JS-условия и циклы в JSX

```tsx
// Неправильно
{items.map(i => <Card key={i.id}>...</Card>)}
{show && <Modal />}

// Правильно
<Loop each="items" as="item" data={items}>
  {(item) => <Card key={item.id}>...</Card>}
</Loop>
<If test="show" value={show}><Modal /></If>
```

### ❌ Отсутствие data-class

```tsx
// Неправильно
<Block component="section">
<Stack>

// Правильно
<Block component="section" data-class="hero-section">
<Stack data-class="hero-content">
```

### ❌ Дублирование Card

```tsx
// Неправильно — Stack, имитирующий Card
<Stack gap="4" p="4" rounded="lg" bg="card" border="" data-class="card">

// Правильно — использовать Card
<Card data-class="feature-card">
  <CardHeader />
  <CardContent />
</Card>
```

---

## 13. Первая задача пошагово

**Задача:** добавить новый блок «Featured Items» на страницу landing.

### Шаг 1: Добавить данные в фикстуру

`fixtures/landing.json`:

```json
{
  "title": "Welcome to RestA",
  "subtitle": "...",
  "ctaText": "View Menu",
  "ctaUrl": "/menu",
  "secondaryCtaText": "Our Recipes",
  "secondaryCtaUrl": "/recipes",
  "featuredItems": [
    { "id": "1", "title": "Seasonal Dish", "description": "Fresh ingredients" },
    { "id": "2", "title": "Chef Special", "description": "Today's highlight" }
  ]
}
```

### Шаг 2: Обновить типы (если нужно)

`src/data/adapters/types.ts` или `src/types/` — добавить тип для `featuredItems`.

### Шаг 3: Создать блок

`src/blocks/FeaturedItemsBlock.tsx`:

```tsx
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription } from '@ui8kit/core';
import { Loop, Var } from '@ui8kit/dsl';

export interface FeaturedItemsBlockProps {
  items?: { id: string; title: string; description: string }[];
}

export function FeaturedItemsBlock({ items }: FeaturedItemsBlockProps) {
  return (
    <Block component="section" py="16" bg="muted" data-class="featured-section">
      <Grid grid="cols-2" gap="6" data-class="featured-grid">
        <Loop each="items" as="item" data={items ?? []}>
          {(item: { id: string; title: string; description: string }) => (
            <Card key={item.id} data-class="featured-card">
              <CardHeader>
                <CardTitle order={4} data-class="featured-card-title">
                  <Var name="item.title" value={item.title} />
                </CardTitle>
                <CardDescription data-class="featured-card-description">
                  <Var name="item.description" value={item.description} />
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </Loop>
      </Grid>
    </Block>
  );
}
```

### Шаг 4: Экспортировать блок

`src/blocks/index.ts`:

```ts
export { FeaturedItemsBlock } from './FeaturedItemsBlock';
```

### Шаг 5: Добавить в PageView

`src/blocks/landing/PageView.tsx`:

```tsx
import { HeroBlock, FeaturedItemsBlock } from '@/blocks';

// В props добавить featuredItems
// В return добавить:
<FeaturedItemsBlock items={landing.featuredItems} />
```

### Шаг 6: Обновить context и adapter

Убедиться, что `landing` в context включает `featuredItems`. Проверить `fixtures.adapter.ts` и типы.

### Шаг 7: Запустить проверки

```bash
bun run lint:dsl
bun run validate
bun run maintain:validate
bun run typecheck
```

---

## 14. Чеклист перед коммитом

- [ ] `bun run lint:dsl` — проверка DSL
- [ ] `bun run validate` — проверка конфига, пропсов и component+tag
- [ ] `bun run maintain:validate` — validate-набор из `package.json` текущего приложения
- [ ] `bun run typecheck` — TypeScript
- [ ] Если менял блоки — `bun run generate` (и при необходимости `bun run finalize`)
- [ ] Нет хардкода — все данные из context или props
- [ ] Нет `className` и `style`
- [ ] У всех семантических элементов есть `data-class`
- [ ] `component` использует только допустимые теги (см. component-tag-map)
- [ ] Используются If, Var, Loop вместо JS-условий и циклов
- [ ] Комментарии на английском

---

## Дополнительные материалы

- `.cursor/rules/best-practices.mdc` — правила кода
- `.cursor/rules/engine-dsl-enforcement.mdc` — правила DSL
- `.cursor/rules/project-structure.mdc` — структура проекта
- `.cursor/rules/ui8kit-architecture.mdc` — архитектура UI8Kit
- `packages/maintain/GUIDE.md` — работа с maintain (checkers, validate, audit, clean)
- `packages/maintain/schemas/maintain.config.schema.json` — схема конфига maintain
- `apps/dsl/maintain.config.json` и `apps/dsl-design/maintain.config.json` — актуальные наборы чекеров проекта
- `packages/generator/docs/rebrand-automation-101.md` — Blueprint и rebrand
- `packages/generator/src/lib/component-tag-map.json` — карта component→теги для валидации
- `@ui8kit/generator/lib` — API валидации (`isTagAllowedForComponent`, `validateComponentTag`)

---

*Документ: ONBOARDING-101. Версия для стажёров. Обновление: 2025-02.*
