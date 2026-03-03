# CLI Commands & Options — Guide Map

Visual reference for CLI commands from `@ui8kit/maintain` and `@ui8kit/generator` (npm packages). See WORKFLOW.md and ONBOARDING.md for usage.

---

## 1. maintain (@ui8kit/maintain)

```mermaid
erDiagram
    MAINTAIN_BIN ||--o{ MAINTAIN_RUN : run
    MAINTAIN_BIN ||--o{ MAINTAIN_VALIDATE : validate
    MAINTAIN_BIN ||--o{ MAINTAIN_AUDIT : audit
    MAINTAIN_BIN ||--o{ MAINTAIN_CLEAN : clean

    MAINTAIN_RUN {
        string cwd "--cwd: Working directory"
        string config "--config: Config file path"
        string check "--check: Checker names (comma-separated)"
        string max_parallel "--max-parallel: Max parallel checkers"
        string verbose "--verbose: Full issue details"
    }

    MAINTAIN_VALIDATE {
        string cwd "--cwd: Working directory"
        string config "--config: Config file path"
        string check "--check: Checker names (default: invariants, fixtures, view-exports, contracts)"
        string verbose "--verbose: Full issue details"
    }

    MAINTAIN_AUDIT {
        string cwd "--cwd: Working directory"
        string config "--config: Config file path"
        string mapping "--mapping: Mapping file path override"
        string scope "--scope: Scope paths (comma-separated)"
        string verbose "--verbose: Full issue details"
    }

    MAINTAIN_CLEAN {
        string cwd "--cwd: Working directory"
        string config "--config: Config file path"
        string mode "--mode: full | dist"
        string paths "--paths: Paths override (comma-separated)"
        string execute "--execute: Apply deletion (default: dry-run)"
        string verbose "--verbose: Full issue details"
    }

    MAINTAIN_BIN {
        string name "maintain"
        string version "0.1.0"
    }
```

| Command       | App script(s)        | Description |
|---------------|----------------------|-------------|
| `maintain run` | `maintain:check`, `maintain:props` | Run checkers from config; `--check` limits to given names. |
| `maintain validate` | `maintain:validate` | Run validation checkers (invariants, fixtures, view-exports, contracts). |
| `maintain audit` | — (or `audit:refactor` via local script in dsl) | Refactor audit checker only. |
| `maintain clean` | `clean`, `clean:dist` | Clean paths from config; `--mode dist` or `full`, `--execute` to apply. |

---

## 2. ui8kit-generate (@ui8kit/generator)

```mermaid
erDiagram
    GENERATOR_BIN ||--o{ REACT_CMD : react
    GENERATOR_BIN ||--o{ STATIC_CMD : static
    GENERATOR_BIN ||--o{ HTML_CMD : html
    GENERATOR_BIN ||--o{ RENDER_CMD : render
    GENERATOR_BIN ||--o{ STYLES_CMD : styles
    GENERATOR_BIN ||--o{ UIKIT_MAP_CMD : uikit-map
    GENERATOR_BIN ||--o{ BLUEPRINT_SCAN_CMD : blueprint-scan
    GENERATOR_BIN ||--o{ BLUEPRINT_VALIDATE_CMD : blueprint-validate
    GENERATOR_BIN ||--o{ BLUEPRINT_GRAPH_CMD : blueprint-graph
    GENERATOR_BIN ||--o{ SCAFFOLD_ENTITY_CMD : scaffold-entity

    REACT_CMD {
        string cwd "--cwd: Working directory"
        string out_dir "--out-dir: Output directory override"
    }

    STATIC_CMD {
        string cwd "--cwd: Working directory"
        string config "--config: Config path (dist.config.json)"
        string fixtures "--fixtures: Fixtures directory override"
    }

    HTML_CMD {
        string cwd "--cwd: Working directory"
        string config "--config: Config path (dist.config.json)"
        string fixtures "--fixtures: Fixtures directory override"
    }

    RENDER_CMD {
        string cwd "--cwd: Working directory"
        string config "--config: Config path (dist.config.json)"
        string fixtures "--fixtures: Fixtures directory override"
    }

    STYLES_CMD {
        string cwd "--cwd: Working directory"
        string config "--config: Config path (dist.config.json)"
    }

    UIKIT_MAP_CMD {
        string cwd "--cwd: Working directory"
        string props_map "--props-map: utility-props.map.ts path"
        string output "--output: ui8kit.map.json path"
        string tailwind_map "--tailwind-map: Tailwind map path override"
        string shadcn_map "--shadcn-map: Shadcn map path override"
        string grid_map "--grid-map: Grid map path override"
        string log_level "--log-level: debug|info|warn|error|silent"
    }

    BLUEPRINT_SCAN_CMD {
        string cwd "--cwd: Working directory"
        string output "--output: Blueprint output path"
    }

    BLUEPRINT_VALIDATE_CMD {
        string cwd "--cwd: Working directory"
        string blueprint "--blueprint: Blueprint file path"
        string report_dir "--report-dir: Report directory path"
    }

    BLUEPRINT_GRAPH_CMD {
        string cwd "--cwd: Working directory"
        string blueprint "--blueprint: Blueprint file path"
        string output "--output: Dependency graph output path"
    }

    SCAFFOLD_ENTITY_CMD {
        string name "--name: Entity name (kebab-case)"
        string singular "--singular: Singular entity name"
        string fields "--fields: Field definitions (name:type,...)"
        string routes "--routes: List and detail routes"
        string layout "--layout: Layout component name"
        string cwd "--cwd: Working directory"
    }

    GENERATOR_BIN {
        string name "ui8kit-generate"
        string version "0.2.0"
    }
```

### Commands summary

| Command | Options | App script | Description |
|---------|---------|------------|-------------|
| `react` | `--cwd`, `--out-dir` | `generate` | Build DSL → React (blocks, layouts, partials). |
| `static` (default) | `--cwd`, `--config`, `--fixtures` | — | Full pipeline: Render → CSS → HTML → PostCSS. |
| `html` | `--cwd`, `--config`, `--fixtures` | — | Render + HTML stages. |
| `render` | `--cwd`, `--config`, `--fixtures` | — | Render routes to HTML only. |
| `styles` | `--cwd`, `--config` | — | CSS extraction + PostCSS. |
| `uikit-map` | `--cwd`, `--props-map`, `--output`, `--tailwind-map`, `--shadcn-map`, `--grid-map`, `--log-level` | `build:map` | Generate ui8kit.map.json from utility-props. |
| `blueprint:scan` | `--cwd`, `--output` | `blueprint:scan` | Scan app → blueprint.json. |
| `blueprint:validate` | `--cwd`, `--blueprint`, `--report-dir` | `blueprint:validate` | Validate project vs blueprint. |
| `blueprint:graph` | `--cwd`, `--blueprint`, `--output` | `blueprint:graph` | Build dependency graph. |
| `scaffold entity` | `--name`, `--singular`, `--fields`, `--routes`, `--layout`, `--cwd` | `scaffold:entity` | Scaffold entity with routes, views, fixtures. |

---

## 3. External CLIs (bunx)

These are not in `packages/`; they come from npm (e.g. `@ui8kit/lint`).

| Binary | Typical script | Purpose |
|--------|----------------|---------|
| `ui8kit-validate` | `validate` | Config, DSL, props, component+tag validation. |
| `ui8kit-lint-dsl` | `lint:dsl` | If/Var/Loop usage in src. |
| `ui8kit-lint` | `lint` | General lint. |
| `ui8kit-inspect` | `inspect` | Inspect app/config. |
