# CLI Commands & Options — Guide Map

Visual reference for CLI commands from `packages/maintain` and `packages/generator`. See WORKFLOW.md and ONBOARDING-101.md for usage.

---

## 1. maintain (@ui8kit/maintain)

```mermaid
erDiagram
    MAINTAIN_BIN ||--o{ MAINTAIN_RUN : run
    MAINTAIN_BIN ||--o{ MAINTAIN_VALIDATE : validate
    MAINTAIN_BIN ||--o{ MAINTAIN_AUDIT : audit
    MAINTAIN_BIN ||--o{ MAINTAIN_CLEAN : clean

    MAINTAIN_RUN {
        string cwd
        string config
        string check
        string max_parallel
        string verbose
    }

    MAINTAIN_VALIDATE {
        string cwd
        string config
        string check
        string verbose
    }

    MAINTAIN_AUDIT {
        string cwd
        string config
        string mapping
        string scope
        string verbose
    }

    MAINTAIN_CLEAN {
        string cwd
        string config
        string mode
        string paths
        string execute
        string verbose
    }

    MAINTAIN_BIN {
        string name
        string version
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
        string cwd
        string out_dir
    }

    STATIC_CMD {
        string cwd
        string config
        string fixtures
    }

    HTML_CMD {
        string cwd
        string config
        string fixtures
    }

    RENDER_CMD {
        string cwd
        string config
        string fixtures
    }

    STYLES_CMD {
        string cwd
        string config
    }

    UIKIT_MAP_CMD {
        string cwd
        string props_map
        string output
        string tailwind_map
        string shadcn_map
        string grid_map
        string log_level
    }

    BLUEPRINT_SCAN_CMD {
        string cwd
        string output
    }

    BLUEPRINT_VALIDATE_CMD {
        string cwd
        string blueprint
        string report_dir
    }

    BLUEPRINT_GRAPH_CMD {
        string cwd
        string blueprint
        string output
    }

    SCAFFOLD_ENTITY_CMD {
        string name
        string singular
        string fields
        string routes
        string layout
        string cwd
    }

    GENERATOR_BIN {
        string name
        string version
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
