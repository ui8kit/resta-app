# Template Plugins Guide

This guide explains how to use and extend the template plugin system for generating templates from React components.

## Built-in Plugins

The generator includes 5 official plugins for popular template engines:

| Plugin | Engine | Runtime | Extension | Use Case |
|--------|--------|---------|-----------|----------|
| `react` | React JSX | JS | `.tsx` | apps/engine |
| `liquid` | Liquid | JS | `.liquid` | Shopify, Jekyll, Eleventy |
| `handlebars` | Handlebars | JS | `.hbs` | Express.js, static sites |
| `twig` | Twig | PHP | `.twig` | Symfony, PHP applications |
| `latte` | Latte | PHP | `.latte` | Nette Framework |

## Usage

### Basic Usage

```typescript
import { TemplateService } from '@ui8kit/generator';

const service = new TemplateService();

await service.initialize({
  appRoot: process.cwd(),
  outputDir: './dist/templates',
  logger: console,
  config: {},
});

const result = await service.execute({
  sourceDirs: ['../../apps/engine/src/blocks'],
  outputDir: './dist/templates',
  engine: 'react', // or 'liquid', 'handlebars', 'twig', 'latte'
  include: ['**/*.tsx'],
  exclude: ['**/*.test.tsx', '**/index.ts'],
  verbose: true,
});
```

### Generating for Multiple Engines

To generate templates for multiple engines, call the service multiple times:

```typescript
const engines = ['react', 'liquid', 'handlebars'];

for (const engine of engines) {
  const result = await service.execute({
    sourceDirs: ['../../apps/engine/src/blocks'],
    outputDir: `./dist/templates/${engine}`,
    engine: engine as 'react' | 'liquid' | 'handlebars',
    include: ['**/*.tsx'],
    exclude: ['**/*.test.tsx', '**/index.ts'],
  });
  
  console.log(`Generated ${result.files.length} templates for ${engine}`);
}
```

## DSL Component Mapping

The generator automatically transforms DSL components from `@ui8kit/dsl` to template syntax:

### Var Component

**DSL:**
```tsx
<Var name="title" value={title} />
```

**React:**
```tsx
{title}
```

**Liquid:**
```liquid
{{ title }}
```

**Handlebars:**
```handlebars
{{ title }}
```

### Var with Default

**DSL:**
```tsx
<Var name="title" value={title} default="Untitled" />
```

**React:**
```tsx
{title ?? "Untitled"}
```

**Liquid:**
```liquid
{{ title | default: "Untitled" }}
```

### If Component (simple)

**DSL:**
```tsx
<If test="isActive" value={isActive}>
  <span>Active</span>
</If>
```

**React:**
```tsx
{isActive ? (<><span>Active</span></>) : null}
```

**Liquid:**
```liquid
{% if isActive %}
  <span>Active</span>
{% endif %}
```

**Handlebars:**
```handlebars
{{#if isActive}}
  <span>Active</span>
{{/if}}
```

### If/Else

**DSL:**
```tsx
<If test="isActive" value={isActive}>
  <span>Active</span>
  <Else>
    <span>Inactive</span>
  </Else>
</If>
```

**React:**
```tsx
{isActive ? (<><span>Active</span></>) : (<><span>Inactive</span></>)}
```

**Liquid:**
```liquid
{% if isActive %}
  <span>Active</span>
{% else %}
  <span>Inactive</span>
{% endif %}
```

### If/ElseIf/Else (IIFE pattern)

**DSL:**
```tsx
<If test="status === 'active'" value={status === 'active'}>
  <span>Active</span>
  <ElseIf test="status === 'pending'" value={status === 'pending'}>
    <span>Pending</span>
  </ElseIf>
  <Else>
    <span>Unknown</span>
  </Else>
</If>
```

**React (IIFE — teaches real JS patterns):**
```tsx
{(() => {
  if (status === "active") return (<><span>Active</span></>);
  if (status === "pending") return (<><span>Pending</span></>);
  return (<><span>Unknown</span></>);
})()}
```

**Liquid:**
```liquid
{% if status == "active" %}
  <span>Active</span>
{% elsif status == "pending" %}
  <span>Pending</span>
{% else %}
  <span>Unknown</span>
{% endif %}
```

### Loop Component

**DSL:**
```tsx
<Loop each="items" as="item" data={items}>
  <div><Var name="item.name" /></div>
</Loop>
```

**React (auto key: item.id → index):**
```tsx
{items.map((item, index) => (
<Fragment key={item.id ?? index}>
  <div>{item.name}</div>
</Fragment>
))}
```

**Liquid:**
```liquid
{% for item in items %}
  <div>{{ item.name }}</div>
{% endfor %}
```

**Handlebars:**
```handlebars
{{#each items}}
  <div>{{ name }}</div>
{{/each}}
```

### Slot Component

**DSL:**
```tsx
<Slot name="header">
  <header>Default Header</header>
</Slot>
```

**React:**
```tsx
{header ?? (<><header>Default Header</header></>)}
```

**Liquid:**
```liquid
{% if header_content %}{{ header_content }}{% else %}<header>Default Header</header>{% endif %}
```

### Include Component

**DSL:**
```tsx
<Include src="partials/header" />
```

**React:**
```tsx
<Header />
```

**Liquid:**
```liquid
{% include 'partials/header.liquid' %}
```

**Handlebars:**
```handlebars
{{> partials/header}}
```

## DSL Runtime vs Generated Templates: Engine vs Output

### Engine (apps/engine) — Dev Mode Only

When the engine app runs in dev mode (Vite), it uses the **actual React components** from `@ui8kit/dsl` (`If`, `Loop`, `Var`, etc.). These components must render something at runtime:

- **`<If>`** currently renders a `<span style="display:contents">` wrapper around its children (with `data-gen-if` for debugging). This wrapper is visible in the DOM inspector and can be confusing during development.
- The generator **never sees this runtime output**. It parses the source AST and transforms `<If>` in the source code directly.

### Generated Templates — No DSL Wrappers

The generator transforms DSL components **at build time** and replaces them with native syntax:

- **React output:** `{condition ? (<>content</>) : null}` — no `<If>`, no wrapper
- **Liquid output:** `{% if condition %}content{% endif %}`
- **Handlebars, Twig, Latte:** similar native constructs

The `<span>` (or any wrapper) from the DSL components **never appears in generated templates**. It exists only in the engine's dev runtime.

### Why `React.Fragment` (`<>...</>`) Matters

The React plugin uses `Fragment` in conditionals and loops to avoid extra DOM nodes:

```tsx
{isActive ? (<><span>Active</span></>) : null}
```

- **Fragment** does not create a DOM element — it is a logical grouping only. The output HTML has no wrapper.
- If we used `<div>` or `<span>` instead, every conditional would add an unnecessary DOM node in the final output.
- Fragment keeps the generated React templates clean and semantic, matching the structure of Liquid/Handlebars output where conditionals also add no wrapper.

**Summary:** DSL wrappers (`<span>` in `If`) are an engine dev-mode implementation detail. Generated templates use Fragment (React) or native syntax (other engines) and produce clean, wrapper-free output.

## React Plugin: Condition Strategy

The React plugin uses three patterns for conditional rendering, selected automatically:

| Scenario | Pattern | Complexity |
|----------|---------|------------|
| `If` only | Ternary with null | Junior level |
| `If` + `Else` | Ternary | Junior level |
| `If` + `ElseIf` [+ `Else`] | IIFE | Mid-level (growth) |

This progression is intentional: juniors learn ternaries first, then discover IIFE as they encounter more complex branching.

## React Plugin: Key Strategy for Loops

The React plugin automatically resolves `key` for `.map()` iterations:

1. **Explicit key** (from DSL `key` prop) → `item.slug`
2. **Auto-detect** `id` field → `item.id`
3. **Fallback** → `index`

```tsx
// With explicit key="slug"
{items.map((item, index) => (
<Fragment key={item.slug}>

// Default (auto id → index fallback)
{items.map((item, index) => (
<Fragment key={item.id ?? index}>
```

## React Plugin: Filters as JS Methods

React doesn't use template filters. Instead, filters map to native JS methods:

| Filter | React (JS) | Liquid |
|--------|-----------|--------|
| `uppercase` | `.toUpperCase()` | `\| upcase` |
| `lowercase` | `.toLowerCase()` | `\| downcase` |
| `trim` | `.trim()` | `\| strip` |
| `length` | `.length` | `\| size` |
| `json` | `JSON.stringify()` | `\| json` |
| `first` | `[0]` | `\| first` |
| `last` | `[arr.length - 1]` | `\| last` |
| `join` | `.join(sep)` | `\| join` |
| `reverse` | `[...arr].reverse()` | `\| reverse` |
| `sort` | `[...arr].sort()` | `\| sort` |

## Creating Custom Plugins

To create a custom template plugin:

1. Extend `BasePlugin`:

```typescript
import { BasePlugin } from '@ui8kit/generator';

export class MyCustomPlugin extends BasePlugin {
  readonly name = 'my-custom';
  readonly version = '1.0.0';
  readonly runtime = 'js';
  readonly fileExtension = '.custom';
  readonly description = 'My custom template engine';
  
  readonly features = {
    supportsFilters: true,
    supportsIncludes: true,
    supportsExtends: false,
  };
  
  // Implement transformation methods
  protected transformElement(element: GenElement): string {
    // Your transformation logic
    return '';
  }
  
  protected transformText(text: GenText): string {
    return text.value;
  }
  
  // ... other methods
}
```

2. Register the plugin:

```typescript
import { PluginRegistry } from '@ui8kit/generator';

const registry = new PluginRegistry();
registry.register({
  name: 'my-custom',
  version: '1.0.0',
  runtime: 'js',
  fileExtension: '.custom',
  description: 'My custom template engine',
}, (config) => new MyCustomPlugin());
```

## Configuration

Plugin configuration options:

```typescript
interface TemplatePluginConfig {
  /** File extension for output files */
  fileExtension?: string;
  
  /** Output directory */
  outputDir?: string;
  
  /** Pretty print output */
  prettyPrint?: boolean;
  
  /** Indentation string */
  indent?: string;
  
  /** Custom filter mappings */
  filterMappings?: Map<string, FilterDefinition>;
}
```

## Best Practices

1. **Use DSL components** - Always use `If`, `Var`, `Loop`, `Slot` from `@ui8kit/dsl` for dynamic content
2. **Add data-class** - Every semantic element should have a `data-class` attribute
3. **Test in dev mode** - Test blocks with actual data before generating templates
4. **Validate output** - Check generated templates match expected syntax
5. **Document variables** - Use JSDoc comments to describe expected data structure

## Troubleshooting

### Templates not generating

- Check that source directories exist and contain `.tsx` files
- Verify exclude patterns aren't too broad
- Check plugin is registered correctly

### Incorrect syntax in generated templates

- Ensure DSL components are used correctly
- Check that `data-class` attributes are present
- Verify props match expected types

### Missing variables

- Check that `Var` components have `name` prop
- Verify variable names match data structure
- Ensure `value` prop is provided for dev mode
