# JSX Transformer

The JSX Transformer converts React components to GenHAST (Hypertext Abstract Syntax Tree) with annotations that can be processed by template plugins.

## Quick Start

```typescript
import { transformJsx, transformJsxFile } from '@ui8kit/generator';

// Transform source code
const result = transformJsx(`
  export function ProductCard({ product, isOnSale }) {
    return (
      <article className="product-card">
        <h2>{product.name}</h2>
        <p>{product.price}</p>
        {isOnSale && <span className="sale">SALE</span>}
      </article>
    );
  }
`);

console.log(result.tree);
// GenRoot with variable and conditional annotations

// Transform file
const fileResult = await transformJsxFile('./src/components/ProductCard.tsx');
```

## What Gets Detected

### Variables

Simple expressions like `{title}` or `{user.profile.name}`:

```jsx
<h1>{title}</h1>
<p>{user.profile.name}</p>
```

→ Creates `GenElement` with `variable` annotation:

```typescript
{
  type: 'element',
  tagName: 'span',
  properties: {
    _gen: {
      variable: { name: 'title' },
      unwrap: true
    }
  }
}
```

### Loops

`.map()` calls are detected as loops:

```jsx
<ul>
  {items.map(item => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>
```

→ Creates `GenElement` with `loop` annotation:

```typescript
{
  type: 'element',
  tagName: 'div',
  properties: {
    _gen: {
      loop: {
        item: 'item',
        collection: 'items',
        key: 'item.id'
      },
      unwrap: true
    }
  }
}
```

### Conditionals

Both `&&` and ternary `? :` patterns:

```jsx
// && pattern
{isActive && <span>Active</span>}

// Ternary pattern
{isLoading ? <Spinner /> : <Content />}
```

→ Creates `GenElement` with `condition` annotation:

```typescript
{
  type: 'element',
  tagName: 'div',
  properties: {
    _gen: {
      condition: {
        expression: 'isActive',
        isElse: false
      },
      unwrap: true
    }
  }
}
```

### Slots (Children)

`{children}` becomes a slot:

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}
```

→ Creates `GenElement` with `slot` annotation:

```typescript
{
  type: 'element',
  tagName: 'div',
  properties: {
    _gen: {
      slot: { name: 'default' },
      unwrap: true
    }
  }
}
```

### Component References

PascalCase tags are detected as includes:

```jsx
function Page() {
  return (
    <div>
      <Header title="My App" />
      <Footer />
    </div>
  );
}
```

→ Creates `GenElement` with `include` annotation:

```typescript
{
  type: 'element',
  tagName: 'div',
  properties: {
    _gen: {
      include: {
        partial: 'partials/header',
        props: { title: '"My App"' }
      }
    }
  }
}
```

## Transform Options

```typescript
interface TransformOptions {
  // Source file path (for error messages)
  sourceFile?: string;
  
  // Component name to transform (auto-detected if not specified)
  componentName?: string;
  
  // Extract props interface
  extractProps?: boolean;
  
  // Patterns for component type detection
  componentPatterns?: {
    layouts?: RegExp[];   // e.g., [/Layout$/]
    partials?: RegExp[];  // e.g., [/^Header$/]
    pages?: RegExp[];     // e.g., [/Page$/]
    blocks?: RegExp[];    // e.g., [/Block$/]
  };
  
  // Include source locations in annotations
  includeSourceLocations?: boolean;
}
```

## Transform Result

```typescript
interface TransformResult {
  // Generated HAST tree
  tree: GenRoot;
  
  // Detected variables (full paths)
  variables: string[];
  // ['product.name', 'product.price', 'isOnSale']
  
  // Detected component dependencies (as partial paths)
  dependencies: string[];
  // ['partials/header', 'partials/footer']
  
  // Warnings during transformation
  warnings: string[];
  
  // Errors during transformation
  errors: string[];
}
```

## Component Metadata

The transformer extracts metadata about the component:

```typescript
interface GenComponentMeta {
  sourceFile: string;          // 'src/components/Card.tsx'
  componentName: string;       // 'Card'
  exports: string[];           // ['Card']
  dependencies: string[];      // ['partials/header']
  componentType?: string;      // 'component' | 'layout' | 'partial' | 'page' | 'block'
  props?: GenPropDefinition[]; // Extracted props
}
```

Props are extracted from destructuring patterns:

```tsx
function Card({ title, description, children }) { ... }

// Results in:
props: [
  { name: 'title', type: 'unknown', required: true },
  { name: 'description', type: 'unknown', required: true },
  { name: 'children', type: 'unknown', required: true },
]
```

## Integration with Plugins

The transformed HAST tree can be passed directly to template plugins:

```typescript
import { transformJsx, LiquidPlugin, PluginRegistry } from '@ui8kit/generator';

// Transform React component
const result = transformJsx(source);

// Initialize Liquid plugin
const registry = new PluginRegistry();
const plugin = new LiquidPlugin();
await plugin.initialize({
  logger: console,
  config: { fileExtension: '.liquid', outputDir: './dist' },
  outputDir: './dist',
});

// Generate Liquid template
const output = await plugin.transform(result.tree);

console.log(output.content);
// {% for item in items %}
//   <li>{{ item.name }}</li>
// {% endfor %}
```

## TemplateService

For batch processing, use `TemplateService`:

```typescript
import { TemplateService } from '@ui8kit/generator';

const service = new TemplateService();
await service.initialize(context);

const result = await service.execute({
  sourceDirs: ['./src/components', './src/layouts'],
  outputDir: './dist/templates',
  engine: 'liquid',
  include: ['**/*.tsx'],
  exclude: ['**/*.test.tsx'],
  verbose: true,
});

console.log(`Generated ${result.files.length} templates`);
```

## Limitations

1. **Dynamic expressions**: Complex expressions like `{fn()}` are not fully analyzed
2. **Spread props**: `{...props}` generates a warning (not supported in templates)
3. **Hooks**: React hooks are ignored (not relevant for static templates)
4. **Context**: React context is not analyzed
5. **Higher-order components**: HOCs are not unwrapped

## Best Practices

1. **Keep components simple**: The simpler the JSX, the cleaner the template
2. **Use destructuring**: Props are extracted from destructuring patterns
3. **Name components clearly**: PascalCase names are used for type detection
4. **Use key prop**: Keys in `.map()` are extracted for template loops
5. **Avoid complex expressions**: Split complex logic into multiple expressions
