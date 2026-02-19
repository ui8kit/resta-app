# @ui8kit/generator

**Modern Static Site Generator with OOP Architecture**

A comprehensive, service-based static site generator that converts React components to semantic HTML with optimized CSS. Built with SOLID principles, dependency injection, and full test coverage.

## Features

- **Orchestrator Pattern** — Central coordination of services and pipeline
- **Service Architecture** — Modular, testable services with DI
- **Pipeline System** — Sequential stage execution with error handling
- **Event-Driven** — Loose coupling via EventBus
- **Plugin System** — Extensible architecture
- **TDD Coverage** — 83%+ test coverage with Vitest

## Installation

```bash
bun add @ui8kit/generator
```

## Quick Start

```typescript
import { generate } from '@ui8kit/generator';

const result = await generate({
  app: { name: 'My App', lang: 'en' },
  css: {
    entryPath: './src/main.tsx',
    routes: ['/'],
    outputDir: './dist/css',
    pureCss: true,
  },
  html: {
    viewsDir: './views',
    routes: { '/': { title: 'Home' } },
    outputDir: './dist/html',
  },
});

console.log(`Generated in ${result.duration}ms`);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Logger    │  │  EventBus   │  │  ServiceRegistry    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     Pipeline                         │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐│   │
│  │  │ Layout │→│  View  │→│  CSS   │→│  HTML  │→│Asset││   │
│  │  │ Stage  │ │ Stage  │ │ Stage  │ │ Stage  │ │Stage││   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────┘│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     Services                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │   │
│  │  │  Layout  │ │  Render  │ │   HtmlConverter      │ │   │
│  │  │ Service  │ │ Service  │ │     Service          │ │   │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │   View   │ │   CSS    │ │   HTML   │ │ Asset  │ │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │Service │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Core Concepts

### Orchestrator

The central coordinator that manages services, plugins, and pipeline execution.

```typescript
import { Orchestrator } from '@ui8kit/generator';

const orchestrator = new Orchestrator({ logger });

// Register services
orchestrator.registerService(new LayoutService());
orchestrator.registerService(new ViewService());
orchestrator.registerService(new CssService());

// Add pipeline stages
orchestrator.addStage(new LayoutStage());
orchestrator.addStage(new ViewStage());
orchestrator.addStage(new CssStage());

// Execute generation
const result = await orchestrator.generate(config);
```

### Services

Services implement `IService<TInput, TOutput>` interface:

```typescript
interface IService<TInput, TOutput> {
  readonly name: string;
  readonly version: string;
  readonly dependencies: readonly string[];
  
  initialize(context: IServiceContext): Promise<void>;
  execute(input: TInput): Promise<TOutput>;
  dispose(): Promise<void>;
}
```

**Built-in Services:**

| Service | Purpose |
|---------|---------|
| `LayoutService` | Initialize layout templates |
| `RenderService` | React → HTML rendering |
| `ViewService` | Generate Liquid views |
| `CssService` | Extract and generate CSS |
| `HtmlService` | Render final HTML pages |
| `AssetService` | Copy static assets |
| `HtmlConverterService` | HTML → CSS conversion |
| `ClassLogService` | Track and filter used CSS classes |
| `UiKitMapService` | Generate unified class → CSS mapping |

### ClassLogService

Tracks all CSS classes used in Liquid views and outputs filtered logs.

```typescript
import { ClassLogService } from '@ui8kit/generator';

const service = new ClassLogService();
await service.initialize(context);

const result = await service.execute({
  viewsDir: './views',
  outputDir: './dist/maps',
  baseName: 'ui8kit',
  uikitMapPath: './lib/ui8kit.map.json', // Optional: filter by whitelist
  includeResponsive: true,
  includeStates: true,
});

console.log(`Total: ${result.totalClasses}, Valid: ${result.validClasses}`);
```

**Output files:**
- `ui8kit.log.json` — All classes found in views
- `ui8kit.tailwind.log.json` — Only classes from `ui8kit.map.json` whitelist

**Usage with Tailwind CSS v4:**

```css
@import "tailwindcss";
@source "../maps/ui8kit.tailwind.log.json";
```

### UiKitMapService

Generates a unified `ui8kit.map.json` by merging:
- Classes from `utility-props.map.ts` (DSL props)
- CSS values from `tw-css-extended.json` (Tailwind)
- Design tokens from `shadcn.map.json` (semantic colors)
- Responsive grid classes from `grid.map.json`

```typescript
import { UiKitMapService } from '@ui8kit/generator';

const service = new UiKitMapService();
await service.initialize(context);

const result = await service.execute({
  propsMapPath: './packages/ui8kit/src/lib/utility-props.map.ts',
  tailwindMapPath: './assets/tailwind/tw-css-extended.json',
  shadcnMapPath: './lib/shadcn.map.json',
  gridMapPath: './lib/grid.map.json',
  outputPath: './lib/ui8kit.map.json',
});

console.log(`Generated ${result.totalClasses} classes`);
console.log(`  Tailwind: ${result.tailwindClasses}`);
console.log(`  Shadcn: ${result.shadcnClasses}`);
console.log(`  Grid: ${result.gridClasses}`);
```

**CLI usage:**

```bash
bun run scripts/generate-uikit-map.ts
```

### Pipeline Stages

Stages implement `IPipelineStage` interface:

```typescript
interface IPipelineStage {
  readonly name: string;
  readonly order: number;
  readonly enabled: boolean;
  readonly dependencies?: readonly string[];
  
  canExecute(context: IPipelineContext): boolean;
  execute(input: unknown, context: IPipelineContext): Promise<unknown>;
}
```

**Default Pipeline:**

```
LayoutStage (order: 0)
    ↓
ViewStage (order: 1)
    ↓
CssStage (order: 2)
    ↓
HtmlStage (order: 3)
    ↓
AssetStage (order: 4)
```

### Event Bus

Loose coupling via publish/subscribe:

```typescript
import { EventBus } from '@ui8kit/generator';

const eventBus = new EventBus();

// Subscribe
const unsubscribe = eventBus.on('css:generated', (data) => {
  console.log(`CSS generated: ${data.path}`);
});

// Emit
eventBus.emit('css:generated', { path: 'styles.css', size: 1234 });

// Unsubscribe
unsubscribe();
```

### Service Registry

Dependency injection with topological sorting:

```typescript
import { ServiceRegistry } from '@ui8kit/generator';

const registry = new ServiceRegistry();

registry.register(new CssService());      // depends on: ['view']
registry.register(new ViewService());     // depends on: ['layout']
registry.register(new LayoutService());   // depends on: []

// Get initialization order (topological sort)
const order = registry.getInitializationOrder();
// ['layout', 'view', 'css']

// Initialize all in correct order
await registry.initializeAll(context);
```

## Configuration

### Full Configuration Example

```typescript
import type { GenerateConfig } from '@ui8kit/generator';

const config: GenerateConfig = {
  // Application metadata
  app: {
    name: 'My App',
    lang: 'en',
  },

  // CSS class mappings
  mappings: {
    ui8kitMap: './src/lib/ui8kit.map.json',
    shadcnMap: './src/lib/shadcn.map.json',
  },

  // CSS generation
  css: {
    entryPath: './src/main.tsx',
    routes: ['/', '/about'],
    outputDir: './dist/css',
    pureCss: true,
  },

  // HTML generation
  html: {
    viewsDir: './views',
    routes: {
      '/': { title: 'Home', seo: { description: '...' } },
      '/about': { title: 'About', seo: { description: '...' } },
    },
    outputDir: './dist/html',
    mode: 'tailwind', // 'tailwind' | 'semantic' | 'inline'
    partials: {
      sourceDir: './src/partials',
      outputDir: 'partials',
      props: {
        Header: { name: "{{ name }}" },
      },
    },
  },

  // Client script
  clientScript: {
    enabled: true,
    outputDir: './dist/assets/js',
    fileName: 'main.js',
    darkModeSelector: '[data-toggle-dark]',
  },

  // Asset copying
  assets: {
    copy: ['./src/assets/css/**/*'],
  },

  // Variant elements
  elements: {
    enabled: true,
    variantsDir: './src/variants',
    outputDir: './src/elements',
    componentsImportPath: '../components',
  },

  // Class logging (tracks CSS classes used in views)
  classLog: {
    enabled: true,
    outputDir: './dist/maps',
    baseName: 'ui8kit',
    uikitMapPath: './lib/ui8kit.map.json', // Filter by whitelist
    includeResponsive: true,
    includeStates: true,
  },

  // MDX documentation (optional)
  mdx: {
    enabled: true,
    docsDir: './docs',
    outputDir: './dist/html',
    navOutput: './dist/docs-nav.json',
    basePath: '',
    components: { Button: '@/components/ui/Button' },
  },
};
```

## Testing

The generator uses Vitest with 83%+ coverage:

```bash
# Run tests
bun run test

# Watch mode
bun run test:watch

# UI mode
bun run test:ui

# Coverage report
bun run test:coverage
```

### Test Structure

```
src/
├── core/
│   ├── events/
│   │   ├── EventBus.ts
│   │   └── EventBus.test.ts      # 15 tests
│   ├── logger/
│   │   ├── Logger.ts
│   │   └── Logger.test.ts        # 12 tests
│   ├── orchestrator/
│   │   ├── Orchestrator.ts
│   │   └── Orchestrator.test.ts  # 19 tests
│   ├── pipeline/
│   │   ├── Pipeline.ts
│   │   └── Pipeline.test.ts      # 19 tests
│   └── registry/
│       ├── ServiceRegistry.ts
│       └── ServiceRegistry.test.ts # 20 tests
├── services/
│   ├── layout/
│   │   └── LayoutService.test.ts # 10 tests
│   ├── render/
│   │   └── RenderService.test.ts # 19 tests
│   ├── view/
│   │   └── ViewService.test.ts   # 12 tests
│   ├── css/
│   │   └── CssService.test.ts    # 13 tests
│   ├── html/
│   │   └── HtmlService.test.ts   # 13 tests
│   ├── asset/
│   │   └── AssetService.test.ts  # 12 tests
│   ├── html-converter/
│   │   └── HtmlConverterService.test.ts # 22 tests
│   ├── class-log/
│   │   └── ClassLogService.test.ts    # 13 tests
│   └── uikit-map/
│       └── UiKitMapService.test.ts    # 16 tests
├── stages/
│   └── stages.test.ts            # 6 tests
└── plugins/
    └── PluginManager.test.ts     # 18 tests
```

### Writing Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CssService } from './CssService';
import { createMockLogger } from '../../../test/setup';

describe('CssService', () => {
  let service: CssService;
  
  beforeEach(() => {
    service = new CssService();
  });
  
  describe('execute', () => {
    it('should generate CSS from views', async () => {
      await service.initialize(createMockContext());
      
      const result = await service.execute({
        viewsDir: './views',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: true,
      });
      
      expect(result.files).toContainEqual(
        expect.objectContaining({
          path: expect.stringContaining('tailwind.apply.css'),
        })
      );
    });
  });
});
```

## Extending

### Custom Service

```typescript
import type { IService, IServiceContext } from '@ui8kit/generator';

interface MyInput { data: string }
interface MyOutput { result: string }

class MyService implements IService<MyInput, MyOutput> {
  readonly name = 'my-service';
  readonly version = '1.0.0';
  readonly dependencies = ['layout'];
  
  private context!: IServiceContext;
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
    this.context.logger.info('MyService initialized');
  }
  
  async execute(input: MyInput): Promise<MyOutput> {
    // Your logic here
    return { result: input.data.toUpperCase() };
  }
  
  async dispose(): Promise<void> {
    // Cleanup
  }
}
```

### Custom Stage

```typescript
import type { IPipelineStage, IPipelineContext } from '@ui8kit/generator';

class MyStage implements IPipelineStage {
  readonly name = 'my-stage';
  readonly order = 5;
  readonly enabled = true;
  readonly dependencies = ['html'];
  readonly description = 'Custom processing stage';
  
  canExecute(context: IPipelineContext): boolean {
    return true;
  }
  
  async execute(input: unknown, context: IPipelineContext): Promise<void> {
    const { logger } = context;
    
    logger.info('Executing my stage...');
    // Your logic here
    
    context.setData('my-stage:result', { success: true });
  }
}
```

### Plugin

```typescript
import { createPlugin } from '@ui8kit/generator';

const myPlugin = createPlugin({
  name: 'my-plugin',
  version: '1.0.0',
  stages: [new MyStage()],
  services: [new MyService()],
  hooks: {
    onBeforeGenerate: async (context) => {
      console.log('Before generation');
    },
    onAfterGenerate: async (result, context) => {
      console.log(`Generated in ${result.duration}ms`);
    },
  },
});

// Use plugin
orchestrator.use(myPlugin);
```

## Template Plugins

Generate templates for various template engines from HAST trees.

### Supported Engines

| Engine | Runtime | Extension | Use Case |
|--------|---------|-----------|----------|
| Liquid | JS | `.liquid` | Shopify, Jekyll, Eleventy |
| Handlebars | JS | `.hbs` | Express.js, static sites |
| Twig | PHP | `.twig` | Symfony, PHP applications |
| Latte | PHP | `.latte` | Nette Framework |

### Quick Start

```typescript
import {
  PluginRegistry,
  LiquidPlugin,
  registerBuiltInPlugins,
  root,
  element,
  text,
  annotate,
} from '@ui8kit/generator';

// Create registry and register plugins
const registry = new PluginRegistry();
registerBuiltInPlugins(registry);

// Get plugin and initialize
const plugin = registry.get('liquid');
await plugin.initialize({
  logger: console,
  config: { fileExtension: '.liquid', outputDir: './dist' },
  outputDir: './dist',
});

// Create HAST tree with annotations
const tree = root([
  annotate(
    element('ul', {}, [element('li', {}, [text('Item')])]),
    { loop: { item: 'product', collection: 'products' } }
  ),
]);

// Transform to template
const output = await plugin.transform(tree);
console.log(output.content);
// {% for product in products %}
//   <ul><li>Item</li></ul>
// {% endfor %}
```

### Annotations

- **Loop**: `{ loop: { item: 'x', collection: 'items' } }` → `{% for x in items %}`
- **Condition**: `{ condition: { expression: 'isActive' } }` → `{% if isActive %}`
- **Variable**: `{ variable: { name: 'title', default: 'Untitled' } }` → `{{ title | default: "Untitled" }}`
- **Include**: `{ include: { partial: 'header', props: { x: 'y' } } }` → `{% include 'header' %}`
- **Slot**: `{ slot: { name: 'content' } }` → Block/yield in templates

See [Template Plugins Documentation](./docs/template-plugins.md) for complete guide.

## API Reference

### Main Exports

```typescript
// High-level API
export { generate, createGenerator } from './generate';
export type { GenerateConfig, GenerateResult } from './generate';

// Core
export { Orchestrator, Pipeline, EventBus, ServiceRegistry, Logger } from './core';

// Services
export {
  LayoutService,
  RenderService,
  ViewService,
  CssService,
  HtmlService,
  AssetService,
  HtmlConverterService,
  ClassLogService,
  UiKitMapService,
} from './services';

// Stages
export { LayoutStage, ViewStage, CssStage, HtmlStage, AssetStage } from './stages';

// Plugins
export { PluginManager, createPlugin } from './plugins';

// Types
export type {
  IOrchestrator,
  IService,
  IServiceContext,
  IPipeline,
  IPipelineStage,
  IPipelineContext,
  IPlugin,
  IEventBus,
  ILogger,
  GeneratorConfig,
  RouteConfig,
} from './core';
```

### Utility Scripts

```typescript
// Generate variants.apply.css
import { emitVariantsApplyCss } from '@ui8kit/generator';

const css = await emitVariantsApplyCss({
  variantsDir: './src/variants',
});

// Generate typed element components
import { emitVariantElements } from '@ui8kit/generator';

const result = await emitVariantElements({
  variantsDir: './src/variants',
  outputDir: './src/elements',
  componentsImportPath: '../components',
});
```

## Design Principles

### SOLID

- **S**ingle Responsibility — Each service has one purpose
- **O**pen/Closed — Extensible via plugins, closed for modification
- **L**iskov Substitution — Services are interchangeable via interfaces
- **I**nterface Segregation — Focused interfaces (IService, IStage, etc.)
- **D**ependency Inversion — Depend on abstractions, not concretions

### Clean Architecture

- **Dependency Rule** — Dependencies point inward
- **Entities** — Core interfaces (IService, IStage)
- **Use Cases** — Services (CssService, HtmlService)
- **Interface Adapters** — Stages bridge services to pipeline
- **Frameworks** — File system, Liquid, React

### Best Practices

- **TDD** — Tests written before implementation
- **DI** — All dependencies injected via context
- **Immutability** — Readonly interfaces where possible
- **Error Handling** — Graceful degradation with logging
- **Documentation** — JSDoc on all public APIs

## Related Packages

- **`@ui8kit/mdx-react`** — MDX processing utilities
- **`react`** / **`react-dom`** — Peer dependencies for rendering

## License

MIT
