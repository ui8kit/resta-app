# Рабочий процесс (команды)

Краткий порядок команд от установки до проверок перед коммитом. Без примеров кода.

---

## 1. Установка

Из корня монорепозитория:

- `bun install`

После клонирования или после `git pull` с изменёнными зависимостями — выполнить один раз.

---

## 2. Разработка

Перейти в приложение (DSL или design):

- `cd apps/dsl`
- `bun run dev`

Сервер поднимается по адресу из конфига (например, localhost:3020).

---

## 3. Проверки перед коммитом

Все команды ниже выполняются из каталога приложения (например, `apps/dsl`).

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
   - проверка сгенерированного приложения: `cd ../react && bun run typecheck` (или `bun run typecheck:react` из корня app)

### 3.2 Одной командой (полный пайплайн)

Полный пайплайн линта, валидации, blueprint, контрактов, генерации и проверки React:

- `bun run dist:app`

Включает по порядку: lint:dsl, lint:gen, validate, blueprint:scan, blueprint:validate, test:contracts, generate, finalize, typecheck в сгенерированном приложении.

### 3.3 Все чекеры maintain (перед мержем)

Запуск всех чекеров из `maintain.config.json` (в т.ч. dataClassConflicts, componentTag, colorTokens, genLint):

- `bun run maintain:check`

---

## 4. Дополнительные команды

- **Blueprint:** `bun run blueprint:scan`, `bun run blueprint:validate`, `bun run blueprint:graph`
- **Контракты:** `bun run test:contracts`
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
