Отличный вопрос. Давай разберу это системно.

## Суть проблемы

Ты хочешь заменить "Resta App" (ресторан) на "CRM App" (или что угодно другое). Это значит переписать:

- **Данные** (fixtures, context, adapters)
- **Типы** (menu items → contacts/deals/leads)
- **Маршруты** (routes)
- **Компоненты** (блоки, макеты, partials)
- **Конфигурация** (ui8kit.config.json, branding)
- **Стили** (tokens, цвета, шрифты)

И при этом **не сломать архитектуру** генератора, контракты DSL, контракт между apps/dsl и apps/react.

---

## Идея 1: **Blueprint (манифест проекта)**

Создать машиночитаемый файл `blueprint.json` — полная карта того, **что** составляет приложение:

```json
{
  "brand": {
    "name": "Resta App",
    "domain": "restaurant",
    "palette": { "primary": "#...", "accent": "#..." }
  },
  "entities": [
    {
      "name": "menu",
      "slug": "menu",
      "singular": "MenuItem",
      "fields": ["title", "price", "category", "image", "description"],
      "fixture": "fixtures/menu.json",
      "routes": ["/menu", "/menu/:slug"],
      "views": ["MenuPageView", "DetailPageView"],
      "types": "src/types/menu.ts"
    },
    {
      "name": "recipes",
      "slug": "recipes",
      "singular": "Recipe",
      "fields": ["title", "ingredients", "steps", "image"],
      ...
    }
  ],
  "layouts": ["MainLayout", "AdminLayout"],
  "providers": ["ThemeProvider", "AdminAuthProvider"],
  "navigation": {
    "source": "fixtures/shared/navigation.json",
    "type": "src/types/navigation.ts"
  }
}
```

Зачем: LLM получает **полную карту** зависимостей. Когда ты говоришь "замени restaurant на CRM", модель точно знает **какие файлы, типы, fixtures, маршруты** связаны с каждой сущностью.

---

## Идея 2: **Валидатор целостности (Invariant Checker)**

Скрипт `validate:blueprint`, который проверяет:

```
Entity "menu" declared in blueprint
  ✓ fixture exists:        fixtures/menu.json
  ✓ type file exists:      src/types/menu.ts
  ✓ type exports MenuItem: yes
  ✓ routes registered:     /menu, /menu/:slug
  ✓ views exist:           MenuPageView.tsx, DetailPageView.tsx
  ✓ context references:    context.ts imports menu fixtures
  ✗ navigation link:       missing in navigation.json  ← error!
```

Это ловит **структурные рассогласования** после генерации. LLM может менять файлы, но валидатор поймает, если:
- Есть маршрут без fixture
- Есть тип без маршрута
- Есть fixture без entity в context
- Навигация ссылается на несуществующую страницу

---

## Идея 3: **Scaffolder (генератор сущностей)**

CLI-команда:

```bash
bunx ui8kit-scaffold entity \
  --name "contacts" \
  --singular "Contact" \
  --fields "name,email,company,phone,status" \
  --routes "/contacts,/contacts/:slug" \
  --layout MainLayout
```

Создаёт:
- `src/types/contacts.ts` — типы
- `fixtures/contacts.json` — пустой fixture с правильной схемой
- `src/blocks/contacts/ContactsPageView.tsx` — list view (шаблон)
- `src/blocks/contacts/DetailPageView.tsx` — detail view (шаблон)
- `src/routes/contacts/ContactsPage.tsx` — route
- `src/routes/contacts/DetailPage.tsx` — route
- Обновляет `context.ts` — добавляет contacts
- Обновляет `navigation.json` — добавляет ссылку
- Обновляет `blueprint.json` — регистрирует entity

Для полного "rebrand" от ресторана к CRM:

```bash
bunx ui8kit-scaffold rebrand \
  --from blueprint.json \
  --to crm-blueprint.json \
  --dry-run
```

Покажет diff: какие сущности удаляются, какие создаются, какие файлы затрагиваются.

---

## Идея 4: **Dependency Graph (граф зависимостей)**

Автоматически строится из кода:

```
[fixture:menu.json]
  → [adapter:fixtures.adapter.ts]
    → [context:context.ts]
      → [route:MenuPage.tsx]
        → [view:MenuPageView.tsx]
          → [component:Card.tsx]
          → [type:menu.ts::MenuItem]
      → [route:DetailPage.tsx]
        → [view:DetailPageView.tsx]
  → [navigation.json] → [partial:Header.tsx]
```

LLM получает этот граф и точно знает: "если я удаляю entity `menu`, нужно удалить 8 файлов и обновить 3". Без графа LLM забудет обновить `navigation.json` или `context.ts`.

---

## Идея 5: **Contract Tests (контрактные тесты)**

Не unit-тесты, а проверка **контрактов между слоями**:

```typescript
// contracts/entity-contract.test.ts
for (const entity of blueprint.entities) {
  test(`${entity.name}: fixture matches type schema`, () => {
    const fixture = loadFixture(entity.fixture);
    const schema = extractSchema(entity.types, entity.singular);
    expect(fixture.items[0]).toMatchSchema(schema);
  });

  test(`${entity.name}: routes are registered in App.tsx`, () => {
    const appRoutes = parseRoutes('src/App.tsx');
    for (const route of entity.routes) {
      expect(appRoutes).toContainRoute(route);
    }
  });
}
```

---

## Как это работает вместе

```
blueprint.json          — что есть в проекте (машиночитаемая карта)
     │
     ├── validate:blueprint    — всё ли целостно?
     ├── scaffold entity       — добавить сущность
     ├── scaffold rebrand      — перестроить проект
     ├── dependency-graph      — показать граф зависимостей
     └── contract tests        — контракты между слоями
```

Workflow для "переписать с ресторана на CRM":

1. Создать `crm-blueprint.json` с новыми сущностями (contacts, deals, tasks, companies)
2. `scaffold rebrand --from resta --to crm --dry-run` — увидеть план
3. `scaffold rebrand --from resta --to crm` — сгенерировать скелет
4. LLM заполняет контент (fixtures, views) по blueprint
5. `validate:blueprint` — ловит все рассогласования
6. `bun run dist:app` — генерация apps/react
7. Contract tests — всё связано

---

## Минимальный MVP

Если начинать сегодня, я бы сделал в таком порядке:

1. **blueprint.json** — описать текущий Resta App (1-2 часа, можно сгенерировать скриптом)
2. **validate:blueprint** — проверка целостности (несколько часов)
3. **scaffold entity** — создание одной сущности (день)

Этого достаточно, чтобы LLM мог безопасно перестраивать проект: у него есть карта, а валидатор ловит ошибки.