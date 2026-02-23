# JSX Transformer

The transformer converts React JSX/TSX into GenHAST with annotations.

## Status

- This module is active and used by current generator internals.
- Primary runtime is static HTML/CSS generation (`generate()` pipeline).
- Template plugins may still consume transformer output, but that is a separate legacy track.

## Where It Is Used

In this project, transformer output is used in two practical ways:

1. Internal/static generation helpers (DSL-aware transformations).
2. Optional template-plugin workflows (legacy track in `PLUGINS.md`).

## Quick Start

```typescript
import { transformJsx, transformJsxFile } from '@ui8kit/generator';

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
console.log(result.variables);
console.log(result.dependencies);

const fileResult = await transformJsxFile('./src/components/ProductCard.tsx');
```

## Core API

### `transformJsx(source, options?)`

- Transforms source string into GenHAST.
- Returns `TransformResult`.
- Does not throw on most parse/analysis issues; collects them in `errors`/`warnings`.

### `transformJsxFile(filePath, options?)`

- Reads one `.tsx/.jsx` file.
- Auto-detects component name from filename if `componentName` is not provided.

### `transformJsxFiles(filePaths, options?)`

- Batch async transform helper.
- Returns `Map<string, TransformResult>`.

## What Gets Detected

### Variables

Examples:

```jsx
<h1>{title}</h1>
<p>{user.profile.name}</p>
```

### Loops

`.map()` patterns are recognized:

```jsx
{items.map((item) => (
  <li key={item.id}>{item.name}</li>
))}
```

### Conditionals

Both `&&` and ternary are supported:

```jsx
{isActive && <span>Active</span>}
{isLoading ? <Spinner /> : <Content />}
```

### Children Slot

`{children}` is recognized as slot-like dynamic content.

### Component References

PascalCase tags are tracked as component dependencies.

## Transform Options

```typescript
interface TransformOptions {
  sourceFile?: string;
  componentName?: string;
  extractProps?: boolean;
  componentPatterns?: {
    layouts?: RegExp[];
    partials?: RegExp[];
    pages?: RegExp[];
    blocks?: RegExp[];
  };
  includeSourceLocations?: boolean;
  passthroughComponents?: string[];
}
```

Important option:

- `passthroughComponents` keeps specific PascalCase components as elements (instead of converting to includes), useful for UI primitives.

## Transform Result

```typescript
interface TransformResult {
  tree: GenRoot;
  variables: string[];
  dependencies: string[];
  warnings: string[];
  errors: string[];
  imports?: AnalyzedImport[];
}
```

Notes:

- `imports` are preserved for downstream full-file React emission flows.
- `dependencies` are de-duplicated before return.

## Practical Integration Example

```typescript
import { transformJsxFile } from '@ui8kit/generator';
import { ReactPlugin } from '@ui8kit/generator/plugins';

const transformed = await transformJsxFile('./src/blocks/HeroView.tsx', {
  passthroughComponents: ['Block', 'Stack', 'Container'],
});

if (transformed.errors.length > 0) {
  throw new Error(transformed.errors.join('; '));
}

const plugin = new ReactPlugin();
const output = await plugin.transform(transformed.tree);
console.log(output.content);
```

## Limitations

1. Complex dynamic expressions (`{fn()}` with side effects, nested logic) are only partially analyzable.
2. Spread-heavy patterns can reduce metadata quality.
3. React hooks/context runtime behavior is not executed/analyzed by transformer.
4. HOC unwrapping is limited; prefer transforming concrete components.

## Validation and Tests

Run transformer tests from package root:

```bash
cd _packages/generator
bun run test
```

For static checks:

```bash
bun run typecheck
```

## Related Docs

- `README.md` — package overview and quick runtime usage.
- `GUIDE.md` — full static runtime scenarios, commands, checks.
- `PLUGINS.md` — template plugin legacy track.
