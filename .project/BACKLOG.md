# Backlog — идеи и технические проверки

Идеи проверяются на реализуемость и наличие в кодовой базе. Статус: `draft` | `approved` | `rejected` | `done`.

---

## BACKLOG-001: Валидация data-class на дубликаты с разным кодом

**Идея:** Валидировать, что одинаковые `data-class` не используются с разными наборами пропсов (→ разными классами). Повторы допустимы, когда пропсы идентичны (например, в Loop).

**Проверка (2025-02):**

### Текущее поведение

1. **HtmlConverterService** (`packages/generator/src/services/html-converter/HtmlConverterService.ts`):
   - `groupBySelectors` — группирует элементы по `selector` (data-class или hash).
   - При одинаковом `data-class` у разных элементов **объединяет** их классы: `allClasses = [...existingClasses, ...element.classes]`.
   - Итог: один селектор `.card` с классами `[flex, p-4, p-6]`, если в разных местах `data-class="card"` с `p-4` и `p-6`.

2. **mergeDuplicateClassSets** — объединяет селекторы с **одинаковым** набором классов (например `.card, .hero-title` с одинаковыми `@apply`).

3. **Префикс/scope:** В CssService и HtmlConverterService **нет** префикса для data-class. Селектор берётся как есть: `data-class="hero-title"` → `.hero-title`.

### Проблема

`data-class="hero-title"` с `gap="4"` и `data-class="hero-title"` с `gap="6"` → один `.hero-title` с `gap-4 gap-6`. Конфликт Tailwind-классов.

### Возможные решения

| Вариант | Описание | Сложность |
|---------|----------|-----------|
| **A. Linter на уровне TSX** | Сканировать блоки, собирать `(data-class, propsHash)`, при конфликте — warn | Средняя |
| **B. Валидация в HtmlConverterService** | При группировке: если один selector с разными class sets — warn в report | Низкая |
| **C. Префикс по контексту** | Добавлять префикс/scope к data-class (например `block-name--hero-title`) | Высокая |
| **D. Maintain checker** | Новый checker в `@ui8kit/maintain`: сканирует TSX, собирает data-class + props, выявляет конфликты | Средняя |

### Рекомендация

- **B** — быстрая проверка на уровне HTML/CSS-генерации.
- **D** — для ранней проверки в DSL-приложении до генерации.

### Дополнение: проверка цветов только из токенов

Для вариантов **B** и **D** — добавить проверку, что **никакие цвета, кроме заданных в токенах**, не используются.

**Источник токенов:**
- `utility-props.map.ts` — whitelist для `bg`, `textColor`, `border` и др. (primary, secondary, muted, destructive, foreground и т.д.).
- `fixtures/colors.json` (dsl-design) — перечень семантических цветов.
- `ui8kit-validate` уже проверяет пропсы по utility-props.map (например, `bg="red"` → invalid, closest: `destructive`).

**Для B (HtmlConverterService):**
- После извлечения классов из HTML — проверять color-классы (bg-*, text-*, border-* и т.п.).
- Сравнивать с whitelist (ui8kit.map, shadcn.map или отдельный список токенов).
- При обнаружении `bg-blue-500`, `text-red-600` и т.п. — warn в report.

**Для D (Maintain checker):**
- Сканировать TSX, парсить пропсы `bg`, `textColor`, `border` и др.
- Сверять значения с whitelist из `utility-props.map.ts` или конфига токенов.
- Может пересекаться с `ui8kit-validate` — рассмотреть интеграцию или единый checker.

**Статус:** `draft` — требуется выбор подхода и приоритет.

---

## BACKLOG-002: Валидация `component` на соответствие HTML5 и семантике

**Идея:** Проверять, что проп `component` используется только с допустимыми тегами для каждого компонента. Block — только верхнеуровневые HTML5-теги; Box — не поддерживает то, что есть у Field (form-элементы).

**Проверка (2025-02):**

### Где есть проп `component`

| Компонент | Тип | Default | Ограничения в коде |
|-----------|-----|---------|-------------------|
| **Block** | `ElementType` | `div` | Нет |
| **Box** | `ElementType` | `div` | Нет |
| **Stack** | `ElementType` | `div` | Нет |
| **Group** | `ElementType` | `div` | Нет |
| **Container** | `ElementType` | `div` | Нет |
| **Text** | `ElementType` | `p` | Нет |
| **Icon** | `ElementType` | `span` | Нет |
| **Field** | `FieldComponent` | `input` | `"input" \| "textarea" \| "select" \| "button"` |

### Правила из best-practices / ui8kit-architecture

- **Block** — только верхнеуровневые секционные теги: `section`, `article`, `aside`, `header`, `footer`, `nav`, `main`. Не `div`, `span`, form-элементы.
- **Box** — универсальный контейнер (`div`, `span` и т.п.). **Не** `input`, `textarea`, `select`, `button` — это зона Field.
- **Field** — только `input`, `textarea`, `select`, `button` (уже ограничено типом).
- **Stack/Group** — Stack для `nav`, `article`; Group для `span` (inline внутри ссылок).

### Предлагаемые правила валидации

| Компонент | Допустимые `component` |
|-----------|------------------------|
| Block | `section`, `article`, `aside`, `header`, `footer`, `nav`, `main` |
| Box | Любой, кроме `input`, `textarea`, `select`, `button` |
| Field | `input`, `textarea`, `select`, `button` (уже есть) |
| Stack | `div`, `nav`, `article`, `section` (уточнить) |
| Group | `div`, `span` |
| Text | `p`, `h1`–`h6`, `span`, `label` |
| Icon | `span` (inline) |

### Реализация

- **Maintain checker** или **ui8kit-lint** — парсить TSX, для каждого компонента с `component` проверять значение по whitelist.
- Конфиг: `componentWhitelist` в maintain.config или в rules.

**Статус:** `draft` — требуется уточнение правил для Stack/Group/Text и приоритет.

---

## Шаблон для новых идей

```markdown
## BACKLOG-XXX: [Название]

**Идея:** [Описание]

**Проверка (YYYY-MM):**

### Текущее поведение
...

### Результат
...

**Статус:** `draft` | `approved` | `rejected` | `done`
```
