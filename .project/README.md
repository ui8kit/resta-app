# .project — Документация проекта

В монорепозитории два рабочих DSL-приложения с одинаковым уровнем качества и проверок:

| Приложение | Назначение | Сгенерированный вывод |
|------------|------------|------------------------|
| **apps/dsl** | Основное приложение (ресторан: лендинг, меню, блог и т.д.) | apps/react |
| **apps/dsl-design** | Design system (превью токенов, типографики, компонентов, виджетов) | apps/react-design |

В **apps/dsl-design** включён сокращённый набор maintain-чекеров (invariants, viewExports, contracts, clean); при необходимости в `maintain.config.json` можно добавить dataClassConflicts, componentTag, colorTokens, genLint после приведения кода к правилам. Перед полным запуском `bun run dist:app` в dsl-design нужно устранить предупреждения `bun run lint:dsl` (обёртка `<Var>` в `<If>`, семантические обёртки); до этого минимальный чек перед коммитом: `bun run maintain:validate` и `bun run typecheck`.

Оба приложения используют один и тот же рабочий процесс: основные команды (lint:dsl, validate, maintain:validate, typecheck, generate); в **apps/dsl** дополнительно — lint:gen и test:contracts. Конфиги maintain.config.json и ui8kit.config.json в корне каждого app. Подробности — в [WORKFLOW.md](./WORKFLOW.md).

## Для стажёров

**[ONBOARDING-101.md](./ONBOARDING-101.md)** — полное руководство по разработке DSL-приложений на UI8Kit.

Начни с него, если ты новый в проекте. Гайд покрывает:

- Окружение и первые команды
- Структуру монорепозитория (в т.ч. dsl и dsl-design)
- DSL-компоненты (If, Var, Loop, Slot)
- Семантические пропсы и data-class
- Поток данных (fixtures → context → routes → blocks)
- Валидацию, линтинг, генерацию
- Антипаттерны и чеклист перед коммитом
- Пошаговую первую задачу

## Правила архитектуры

- `.cursor/rules/best-practices.mdc` — практики кода
- `.cursor/rules/engine-dsl-enforcement.mdc` — правила DSL
- `.cursor/rules/project-structure.mdc` — структура проекта
- `.cursor/rules/ui8kit-architecture.mdc` — архитектура UI8Kit
