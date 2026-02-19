# Template Plugin System

This document describes the template plugin architecture for converting React components to various template formats.

## Overview

The template plugin system allows you to generate templates for different template engines from React components. Currently supported engines:

| Engine | Runtime | Extension | Description |
|--------|---------|-----------|-------------|
| Liquid | JS | `.liquid` | Shopify, Jekyll, Eleventy |
| Handlebars | JS | `.hbs` | Express.js, static sites |
| Twig | PHP | `.twig` | Symfony, PHP applications |
| Latte | PHP | `.latte` | Nette Framework |

## Quick Start

```typescript
import {
  PluginRegistry,
  LiquidPlugin,
  registerBuiltInPlugins,
} from '@ui8kit/generator';

// Create registry and register all built-in plugins
const registry = new PluginRegistry();
registerBuiltInPlugins(registry);

// Get a plugin
const liquidPlugin = registry.get('liquid');

// Initialize with context
await liquidPlugin.initialize({
  logger: console,
  config: {
    fileExtension: '.liquid',
    outputDir: './dist/templates',
    prettyPrint: true,
  },
  outputDir: './dist/templates',
});

// Transform a HAST tree to template
const output = await liquidPlugin.transform(hastTree);

console.log(output.content);
// {% for product in products %}
//   <div>{{ product.name }}</div>
// {% endfor %}
```

## HAST Tree Structure

The generator uses an extended HAST (Hypertext Abstract Syntax Tree) format with generator-specific annotations:

```typescript
import { root, element, text, annotate } from '@ui8kit/generator';

// Create a tree with annotations
const tree = root([
  element('div', { className: ['container'] }, [
    // Loop annotation
    annotate(
      element('ul', {}, [
        element('li', {}, [text('Item')]),
      ]),
      { loop: { item: 'product', collection: 'products' } }
    ),
    
    // Variable annotation
    annotate(
      element('span', {}, []),
      { variable: { name: 'title', default: 'Untitled' } }
    ),
    
    // Conditional annotation
    annotate(
      element('div', {}, [text('Active')]),
      { condition: { expression: 'isActive' } }
    ),
  ]),
], {
  sourceFile: 'ProductList.tsx',
  componentName: 'ProductList',
  exports: ['ProductList'],
  dependencies: [],
});
```

## Annotations

### Loop

Represents iteration over a collection:

```typescript
interface GenLoop {
  item: string;       // "product"
  collection: string; // "products"
  key?: string;       // "id"
  index?: string;     // "i"
}
```

**Output examples:**

| Engine | Output |
|--------|--------|
| Liquid | `{% for product in products %}...{% endfor %}` |
| Twig | `{% for product in products %}...{% endfor %}` |
| Handlebars | `{{#each products as \|product\|}}...{{/each}}` |
| Latte | `{foreach $products as $product}...{/foreach}` |

### Condition

Represents conditional logic:

```typescript
interface GenCondition {
  expression: string; // "isActive && isVisible"
  isElse?: boolean;
  isElseIf?: boolean;
}
```

**Output examples:**

| Engine | Output |
|--------|--------|
| Liquid | `{% if isActive and isVisible %}...{% endif %}` |
| Twig | `{% if isActive and isVisible %}...{% endif %}` |
| Handlebars | `{{#if isActive}}...{{/if}}` |
| Latte | `{if $isActive and $isVisible}...{/if}` |

### Variable

Represents dynamic value output:

```typescript
interface GenVariable {
  name: string;        // "title"
  default?: string;    // "Untitled"
  filter?: string;     // "uppercase"
  filterArgs?: string[];
}
```

**Output examples:**

| Engine | Output |
|--------|--------|
| Liquid | `{{ title \| default: "Untitled" \| upcase }}` |
| Twig | `{{ title ?? "Untitled" \| upper }}` |
| Handlebars | `{{uppercase (default title "Untitled")}}` |
| Latte | `{$title ?? "Untitled" \| upper}` |

### Include

Represents partial/component inclusion:

```typescript
interface GenInclude {
  partial: string;              // "partials/header"
  props?: Record<string, string>;
}
```

**Output examples:**

| Engine | Output |
|--------|--------|
| Liquid | `{% include 'partials/header.liquid', title: title %}` |
| Twig | `{% include 'partials/header.twig' with {title: title} %}` |
| Handlebars | `{{> partials/header title=title}}` |
| Latte | `{include 'partials/header.latte', title: $title}` |

### Slot

Represents content placeholder:

```typescript
interface GenSlot {
  name: string;        // "header"
  accepts?: string[];  // ["Header", "Nav"]
  multiple?: boolean;
  required?: boolean;
}
```

### Block

Represents template inheritance:

```typescript
interface GenBlock {
  name: string;    // "content"
  extends?: string; // "base.twig"
}
```

## Filter Mappings

Standard filters are automatically mapped to engine-specific names:

| Standard | Liquid | Twig | Handlebars | Latte |
|----------|--------|------|------------|-------|
| `uppercase` | `upcase` | `upper` | `uppercase` | `upper` |
| `lowercase` | `downcase` | `lower` | `lowercase` | `lower` |
| `trim` | `strip` | `trim` | `trim` | `trim` |
| `length` | `size` | `length` | `length` | `length` |
| `join` | `join` | `join` | `join` | `implode` |
| `default` | `default` | `default` | `default` | `default` |

## Creating a Custom Plugin

To create a plugin for a different template engine:

```typescript
import { BasePlugin, type TemplatePluginFeatures } from '@ui8kit/generator';

export class MyTemplatePlugin extends BasePlugin {
  readonly name = 'my-template';
  readonly version = '1.0.0';
  readonly runtime = 'js' as const;
  readonly fileExtension = '.my';
  readonly description = 'My custom template engine';
  
  readonly features: TemplatePluginFeatures = {
    supportsInheritance: true,
    supportsPartials: true,
    supportsFilters: true,
    supportsMacros: false,
    supportsAsync: false,
    supportsRaw: true,
    supportsComments: true,
  };
  
  renderLoop(loop: GenLoop, content: string): string {
    return `@for(${loop.item} in ${loop.collection})\n${content}\n@endfor`;
  }
  
  renderCondition(condition: GenCondition, content: string): string {
    if (condition.isElse) {
      return `@else\n${content}`;
    }
    return `@if(${condition.expression})\n${content}\n@endif`;
  }
  
  renderVariable(variable: GenVariable): string {
    let expr = variable.name;
    if (variable.default) {
      expr = `${expr} ?? "${variable.default}"`;
    }
    return `@{{ ${expr} }}`;
  }
  
  renderSlot(slot: GenSlot, defaultContent: string): string {
    return `@yield('${slot.name}', '${defaultContent}')`;
  }
  
  renderInclude(include: GenInclude): string {
    return `@include('${include.partial}')`;
  }
  
  renderBlock(block: GenBlock, content: string): string {
    return `@section('${block.name}')\n${content}\n@endsection`;
  }
  
  renderExtends(parent: string): string {
    return `@extends('${parent}')`;
  }
  
  renderComment(comment: string): string {
    return `{{-- ${comment} --}}`;
  }
}
```

Register your plugin:

```typescript
import { defaultRegistry } from '@ui8kit/generator';

defaultRegistry.register(
  {
    name: 'my-template',
    version: '1.0.0',
    runtime: 'js',
    fileExtension: '.my',
    description: 'My custom template engine',
  },
  (config) => new MyTemplatePlugin()
);
```

## Tree Utilities

The HAST module provides utilities for working with trees:

```typescript
import {
  visit,
  find,
  findAll,
  findByAnnotation,
  map,
  filter,
  collectVariables,
  collectDependencies,
} from '@ui8kit/generator';

// Visit all nodes
visit(tree, (node, index, parent) => {
  if (isElement(node)) {
    console.log(node.tagName);
  }
});

// Find elements with loop annotations
const loops = findByAnnotation(tree, 'loop');

// Collect all variables used in template
const variables = collectVariables(tree);
// ['products', 'product', 'title', 'isActive']

// Collect all dependencies (includes)
const deps = collectDependencies(tree);
// ['partials/header', 'partials/footer']
```

## Validation

Plugins include validation for generated output:

```typescript
const output = await plugin.transform(tree);
const validation = plugin.validate(output.content);

if (!validation.valid) {
  console.error('Template validation failed:', validation.errors);
}
```

## Next Steps

- Phase 2: JSX Transformer (React → HAST)
- Phase 6: Integration with Orchestrator
- Phase 8: Complete Documentation
