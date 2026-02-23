# Архитектурный аудит `@ui8kit/generator`

> Версия: после orchestrator-only рефакторинга  
> Фокус: гибкость, масштабируемость, переиспользование, безопасность, hardcode

---

## 1) Executive Summary

Текущая архитектура стала значительно чище: основной runtime уже идет через `Orchestrator -> Stages -> Services`, убраны крупные legacy-ветки и часть хардкода.

Сильные стороны:
- явное разделение по слоям (`core`, `services`, `stages`, `steps`)
- понятный pipeline для HTML/CSS
- инжектируемая файловая система и контексты сервисов
- адекватная тестируемость ядра (pipeline/registry/orchestrator)

Ключевые зоны риска:
- остаточный hardcode путей и форматирования в сервисах
- неполное использование DI (часть stage логики создает сервисы напрямую)
- слабая валидация входных данных/путей
- документация и plugin-track всё еще частично расходятся с runtime-треком

---

## 2) Findings (по приоритету)

## Critical

### C1. Недостаточная валидация входных путей и структуры конфигурации
**Файлы:** `generate.ts`, `services/css/CssService.ts`, `services/html/HtmlService.ts`  
**Проблема:** проверяются только базовые поля, но не валидируется корректность путей, доступность директорий/файлов, совместимость режимов.  
**Риск:** runtime-fail в середине генерации, непредсказуемое поведение в CI, сложная диагностика.  
**Рекомендация:** ввести полноценную схему валидации (zod) на входе `generate()`, включая:
- существование `html.viewsDir`
- допустимость `html.mode`
- обязательность `cssOutputDir`/файла для `inline`
- нормализацию абсолютных/относительных путей

### C2. Stage-слой частично обходит DI-контейнер
**Файлы:** `stages/CssStage.ts`, `stages/HtmlStage.ts`, `stages/ClassLogStage.ts`  
**Проблема:** сервисы создаются через `new ...Service()` в stage-конструкторах, а не резолвятся из registry.  
**Риск:** сложнее переиспользовать/подменять реализации, harder testing в интеграционных сценариях, теряется ценность DI.  
**Рекомендация:** получать сервисы через `context.registry.resolve(...)` или инжектить через фабрику stage.

### C3. Детерминизм генерации: случайные селекторы
**Файл:** `services/html-converter/HtmlConverterService.ts`  
**Проблема:** fallback-селекторы генерируются случайно.  
**Риск:** недетерминированные артефакты между сборками, сложные диффы и кэш-проблемы.  
**Рекомендация:** заменить на детерминированный hash (например, `sourceFile + index + tagName`).

---

## High

### H1. Hardcode дефолтных путей карт классов
**Файл:** `services/html-converter/HtmlConverterService.ts`  
**Проблема:** fallback-локации (`src/lib/...`) зашиты в сервисе.  
**Риск:** ломается на проектах с иной структурой.  
**Рекомендация:** держать только конфигурируемые пути + единый resolver путей в `core`.

### H2. Hardcode структуры view-папок в class-log
**Файл:** `services/class-log/ClassLogService.ts`  
**Проблема:** сканируются конкретные подпапки (`pages`, `partials`, `layouts`).  
**Риск:** ограниченная совместимость с альтернативной структурой проекта.  
**Рекомендация:** добавить конфиг `classLog.scanDirs` с дефолтами.

### H3. Шаблон HTML документа зашит в коде
**Файл:** `services/html/HtmlService.ts`  
**Проблема:** шаблон документа формируется строкой внутри сервиса.  
**Риск:** слабая расширяемость для разных брендов/каналов, избыточные правки кода при кастомизации.  
**Рекомендация:** ввести `documentTemplate` (callback/adapter) в config.

### H4. Часть error-handling не унифицирована
**Файлы:** `core/registry/ServiceRegistry.ts`, `core/pipeline/Pipeline.ts`  
**Проблема:** встречается mix логирования/обработки ошибок, включая прямые `console.*` в отдельных ветках.  
**Риск:** разнородные логи и слабая observability.  
**Рекомендация:** централизовать все сообщения через единый logger.

### H5. Недостаточная типизация payload событий
**Файлы:** `core/events/*`, `core/orchestrator/Orchestrator.ts`, stages/services  
**Проблема:** события частично типизированы, но payload-контракты не везде строгие.  
**Риск:** тихие ошибки при подписках и эволюции API.  
**Рекомендация:** типизированная карта событий + typed emit helpers.

### H6. Примитивная минификация CSS в `inline` режиме
**Файл:** `services/html/HtmlService.ts`  
**Проблема:** regex-based minify.  
**Риск:** edge-cases и неидеальный output.  
**Рекомендация:** использовать `cssnano`/`lightningcss` через optional adapter.

### H7. Неполное разделение runtime и template-track
**Файлы:** `plugins/*`, docs, exports  
**Проблема:** хотя main entrypoint очищен, plugin-track еще концептуально близко лежит к runtime-коду.  
**Риск:** повторная путаница в roadmap и API ожиданиях.  
**Рекомендация:** вынести plugin-track в отдельный пакет/подмодуль с явным semantic boundary.

---

## Medium

### M1. Pipeline не использует потенциал параллелизма
**Файл:** `core/pipeline/Pipeline.ts`  
**Проблема:** фактически последовательный проход; `maxParallel` не дает текущей выгоды в runtime-пути.  
**Риск:** рост времени сборки при расширении числа стадий.  
**Рекомендация:** DAG execution для независимых stage-групп.

### M2. Форматирование/разделители CSS захардкожены
**Файл:** `services/css/CssService.ts`  
**Проблема:** фиксированный separator/header format.  
**Риск:** сложно адаптировать output style per-project.  
**Рекомендация:** вынести в formatter options.

### M3. Переиспользование view-path resolver не полностью централизовано
**Файлы:** `steps/*`, `services/*`  
**Проблема:** часть логики уже вынесена, часть still разбросана между step/service.  
**Риск:** мелкие расхождения поведения.  
**Рекомендация:** единый `PathResolver` utility/service.

### M4. Не хватает контрактных интеграционных тестов на режимы `tailwind/semantic/inline`
**Файлы:** tests around html/css services  
**Проблема:** unit-тесты есть, но e2e контракты режимов не покрыты как набор snapshot/fixtures.  
**Риск:** регрессии при изменении преобразований HTML.  
**Рекомендация:** добавить matrix-smoke tests по mode.

### M5. UnCSS track остается «optional legacy» без явной capability-модели
**Файлы:** `steps/postprocess-uncss.ts`, docs  
**Проблема:** поведение описано, но нет стандартного feature-flag/capability отчета в результате генерации.  
**Риск:** непредсказуемость в CI (особенно cross-platform).  
**Рекомендация:** возвращать structured status (`applied|skipped|failed`) в `GenerateResult`.

### M6. ClassLog сервис привязан к файловой структуре, а не к pipeline-артефактам
**Файл:** `services/class-log/ClassLogService.ts`  
**Проблема:** сканирование директории вместо работы с явным списком сгенерированных файлов из pipeline context.  
**Риск:** расхождения при нестандартных output путях.  
**Рекомендация:** прокидывать список HTML файлов из `HtmlStage` в `ClassLogStage`.

---

## Low

### L1. Консистентность комментариев/JSDoc местами отстает от кода
**Файлы:** scattered docs/comments  
**Риск:** повышает on-boarding cost.  
**Рекомендация:** короткий doc-lint pass в CI.

### L2. Некоторые дефолты находятся в разных слоях
**Файлы:** `IConfig.ts`, services/steps  
**Риск:** сложнее трассировать source of truth.  
**Рекомендация:** собрать дефолты в единый `defaults.ts`.

---

## 3) Позитивные архитектурные решения (оставить как есть)

- Чистая композиция `Orchestrator + Pipeline + Stage + Service`
- `IServiceContext` с `registry` и унифицированным lifecycle
- Выделенные `steps/` для разбиения большого потока
- Опциональные postprocess-фичи (не блокируют основной runtime)
- Отдельные `core/utils` после рефакторинга (format/routes)

---

## 4) Рекомендуемый roadmap (3 итерации)

## Iteration A (1-2 дня, высокий эффект)
1. Ввести schema-валидацию `GenerateConfig` (zod)  
2. Убрать `new Service()` из stages, перейти на registry resolve  
3. Сделать детерминированный селектор в HtmlConverter

## Iteration B (2-3 дня, масштабирование)
4. Вынести html document template в configurable adapter  
5. Сделать typed event payload map  
6. Добавить mode-matrix integration tests (`tailwind`, `semantic`, `inline`)

## Iteration C (по roadmap продукта)
7. Развести runtime и template-track на уровне package boundaries  
8. Добавить capability-status для UnCSS и прочих optional шагов  
9. Рассмотреть DAG/parallel execution для независимых стадий

---

## 5) Итоговая оценка

- **Гибкость:** 7/10  
- **Масштабируемость:** 7/10  
- **Переиспользование:** 8/10  
- **Безопасность/надёжность:** 6.5/10  
- **Чистота от hardcode:** 6.5/10

Общий вывод: база сильная и уже близка к production-grade, но для уровня “долгоживущей платформы” стоит добрать строгую конфиг-валидацию, DI-консистентность и детерминизм генерации.
