# BACKLOG 

В репозитории в **packages/** есть только два пакета с CLI: **maintain** и **generator**. Сводка по ним и по документации.

---

## 1. **packages/maintain** (bin: `maintain`)

| Команда | Описание | В документации | В скриптах приложений |
|--------|----------|-----------------|------------------------|
| **maintain run** | Все чекеры из config (по умолчанию) | ✅ WORKFLOW, ONBOARDING (`maintain:check`) | ✅ `maintain:check` |
| **maintain run --check utility-props-whitelist** | Только чекер карты пропсов | ✅ WORKFLOW, ONBOARDING (`maintain:props`) | ✅ `maintain:props` |
| **maintain validate** | Набор validate-чекеров | ✅ WORKFLOW, ONBOARDING (`maintain:validate`) | ✅ `maintain:validate` |
| **maintain clean** | Очистка по путям из config | ✅ как `clean` / `clean:dist` | ✅ `clean`, `clean:dist` |
| **maintain audit** | Только refactor-audit чекер | ❌ не описана | ❌ в приложениях используется `audit:refactor` (локальный скрипт) |

**Не охвачено:** команда **`maintain audit`** в WORKFLOW/ONBOARDING не упоминается. Она дублирует по смыслу `bun run audit:refactor` (скрипт в dsl), но вызывает общий чекер через config.

---

## 2. **packages/generator** (bin: `ui8kit-generate`)

| Команда | Описание | В документации | В скриптах приложений |
|--------|----------|----------------|------------------------|
| **react** | Сборка DSL → React | ✅ как `generate` | ✅ `generate` |
| **uikit-map** | Генерация ui8kit.map.json | ✅ WORKFLOW, ONBOARDING (`build:map`) | ✅ `build:map` |
| **blueprint:scan** | Сканирование → blueprint.json | ✅ | ✅ `blueprint:scan` |
| **blueprint:validate** | Проверка по blueprint | ✅ | ✅ `blueprint:validate` |
| **blueprint:graph** | Граф зависимостей | ✅ | ✅ `blueprint:graph` |
| **scaffold entity** | Создание entity | ✅ | ✅ `scaffold:entity` |
| **static** | Полный пайплайн (render→css→html→postcss) | ❌ | ❌ |
| **html** | render + html | ❌ | ❌ |
| **render** | Только рендер в HTML | ❌ | ❌ |
| **styles** | css + postcss | ❌ | ❌ |

**Не охвачено:** команды **static, html, render, styles** — они завязаны на `dist.config.json` и другой пайплайн (не текущий SPA-flow с `generate` + `finalize`). В WORKFLOW/ONBOARDING не упоминаются; при желании их можно описать отдельно как «расширенный/статический» сценарий.

---

## 3. Вне `packages/`

- **ui8kit-validate**, **ui8kit-lint-dsl**, **ui8kit-lint**, **ui8kit-inspect** идут через `bunx` из npm (`@ui8kit/lint` и др.), в локальной папке `packages/` их нет — вы их уже охватываете в документации через `validate`, `lint:dsl`, `lint`, `inspect`.

---

## Итог

- Из **packages/** по факту не охвачена только одна команда: **`maintain audit`** (при желании можно добавить в WORKFLOW/ONBOARDING как альтернативу/дополнение к `audit:refactor`).
- Команды **ui8kit-generate static | html | render | styles** — намеренно не в основном workflow; их можно вынести в отдельный подраздел «Расширенная генерация / статический пайплайн», если нужно их формально отразить в документах.