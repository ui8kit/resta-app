# Рабочий процесс (команды)

Краткий порядок команд от установки до проверок перед коммитом. Без примеров кода.

---

## 1. Установка

Из корня монорепозитория:

- `bun install`

После клонирования или после `git pull` с изменёнными зависимостями — выполнить один раз.

---

## 2. Разработка

Перейти в нужное приложение и запустить dev-сервер:

- **Основное приложение (ресторан):** `cd apps/dsl` → `bun run dev`
- **Design system (превью токенов/компонентов):** `cd apps/dsl-design` → `bun run dev`

Сервер поднимается по адресу из конфига (например, localhost:3020).

---

## 3. Проверки перед коммитом

Все команды ниже выполняются **из каталога приложения**: `apps/dsl` или `apps/dsl-design`. В **apps/dsl-design** нет скрипта `lint:gen` и нет test:contracts; в `maintain.config.json` включены только invariants, viewExports, contracts, clean (без dataClassConflicts, componentTag, colorTokens, genLint).

### 3.1 Порядок обязательных проверок

1. **Линт DSL** — If/Var/Loop вместо JS-условий и циклов  
   - `bun run lint:dsl`

2. **Линт генератора** — правила для блоков/лейаутов (genLint)  
   - `bun run lint:gen`

3. **Валидация приложения** — конфиг, пропсы, component+tag (ui8kit-validate)  
   - `bun run validate`

4. **Maintain: validate** — invariants, fixtures, view-exports, contracts  
   - `bun run maintain:validate`

5. **TypeScript**  
   - `bun run typecheck`

6. **Если менялись блоки, шаблоны или фикстуры** — пересобрать вывод и при необходимости проверить React-приложение:  
   - `bun run generate`  
   - при необходимости: `bun run finalize`  
   - проверка сгенерированного приложения: из `apps/dsl` — `bun run typecheck:react` (проверяет `../react`); из `apps/dsl-design` — `bun run typecheck:react` (проверяет `../react-design`)

### 3.2 Одной командой (полный пайплайн)

Полный пайплайн линта, валидации, blueprint, генерации и проверки React:

- `bun run dist:app`

- **apps/dsl:** lint:dsl, lint:gen, validate, blueprint:scan, blueprint:validate, test:contracts, generate, finalize, typecheck в `../react`.
**apps/dsl-design** использует сокращённый набор чекеров maintain (invariants, viewExports, contracts, clean); чекеры dataClassConflicts, componentTag, colorTokens и genLint можно включить в `maintain.config.json` после приведения кода к правилам.

### 3.3 Все чекеры maintain (перед мержем)

Запуск всех чекеров из `maintain.config.json` (в т.ч. dataClassConflicts, componentTag, colorTokens, genLint):

- `bun run maintain:check`

---

## 4. Дополнительные команды

- **Blueprint:** `bun run blueprint:scan`, `bun run blueprint:validate`, `bun run blueprint:graph`
- **Контракты:** `bun run test:contracts` (только в **apps/dsl**; в dsl-design нет этого скрипта)
- **Общий линт:** `bun run lint` (ui8kit-lint)
- **Аудит рефакторинга:** `bun run audit:refactor`
- **Очистка сгенерированного вывода:** `bun run clean:dist`
- **Полная очистка (в т.ч. node_modules):** `bun run clean`

---

## 5. Чеклист перед коммитом (кратко)

- `bun run lint:dsl`
- `bun run lint:gen`
- `bun run validate`
- `bun run maintain:validate`
- `bun run typecheck`
- При изменении блоков/фикстур — `bun run generate` (и при необходимости `bun run finalize`)

Либо один раз: `bun run dist:app` (если нужен полный пайплайн до сгенерированного React).
