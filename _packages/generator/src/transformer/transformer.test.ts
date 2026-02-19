/**
 * Tests for JSX to HAST Transformer
 */

import { describe, it, expect } from 'vitest';
import {
  transformJsx,
  parseJsx,
  analyzeExpression,
  extractVariables,
} from './index';
import {
  isElement,
  hasAnnotation,
  getAnnotations,
  findByAnnotation,
  collectVariables,
  findByTag,
} from '../hast';

// =============================================================================
// Parser Tests
// =============================================================================

describe('JSX Parser', () => {
  it('parses simple JSX', () => {
    const source = `const App = () => <div>Hello</div>`;
    const ast = parseJsx(source);
    
    expect(ast.type).toBe('File');
    expect(ast.program.body.length).toBeGreaterThan(0);
  });
  
  it('parses TypeScript JSX', () => {
    const source = `
      interface Props { name: string }
      const App: React.FC<Props> = ({ name }) => <div>{name}</div>
    `;
    const ast = parseJsx(source);
    
    expect(ast.type).toBe('File');
  });
  
  it('parses complex JSX with expressions', () => {
    const source = `
      function Component({ items, isActive }) {
        return (
          <div>
            {isActive && <span>Active</span>}
            {items.map(item => <li key={item.id}>{item.name}</li>)}
          </div>
        );
      }
    `;
    const ast = parseJsx(source);
    
    expect(ast.type).toBe('File');
  });
});

// =============================================================================
// Expression Analyzer Tests
// =============================================================================

describe('Expression Analyzer', () => {
  describe('analyzeExpression', () => {
    it('detects simple variable', () => {
      const source = 'title';
      const ast = parseJsx(`const x = ${source}`);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const result = analyzeExpression(expr, source);
      
      expect(result.type).toBe('variable');
      expect(result.path).toBe('title');
    });
    
    it('detects member expression', () => {
      const source = 'user.profile.name';
      const ast = parseJsx(`const x = ${source}`);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const result = analyzeExpression(expr, source);
      
      expect(result.type).toBe('member');
      expect(result.path).toBe('user.profile.name');
    });
    
    it('detects .map() loop', () => {
      const source = 'items.map(item => <div>{item}</div>)';
      const ast = parseJsx(`const x = ${source}`);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const result = analyzeExpression(expr, source);
      
      expect(result.type).toBe('loop');
      expect(result.loopItem).toBe('item');
      expect(result.loopCollection).toBe('items');
    });
    
    it('detects .map() with nested collection', () => {
      const source = 'user.orders.map(order => <div>{order.id}</div>)';
      const ast = parseJsx(`const x = ${source}`);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const result = analyzeExpression(expr, source);
      
      expect(result.type).toBe('loop');
      expect(result.loopItem).toBe('order');
      expect(result.loopCollection).toBe('user.orders');
    });
    
    it('detects && conditional', () => {
      const exprSource = 'isActive && <span>Active</span>';
      const fullSource = `const x = ${exprSource}`;
      const ast = parseJsx(fullSource);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const result = analyzeExpression(expr, fullSource);
      
      expect(result.type).toBe('conditional');
      expect(result.condition).toBe('isActive');
      expect(result.isTernary).toBe(false);
    });
    
    it('detects ternary conditional', () => {
      const exprSource = 'isLoading ? <Spinner /> : <Content />';
      const fullSource = `const x = ${exprSource}`;
      const ast = parseJsx(fullSource);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const result = analyzeExpression(expr, fullSource);
      
      expect(result.type).toBe('conditional');
      expect(result.condition).toBe('isLoading');
      expect(result.isTernary).toBe(true);
    });
    
    it('detects children', () => {
      const source = 'children';
      const ast = parseJsx(`const x = ${source}`);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const result = analyzeExpression(expr, source);
      
      expect(result.type).toBe('children');
    });
  });
  
  describe('extractVariables', () => {
    it('extracts simple variable', () => {
      const source = 'title';
      const ast = parseJsx(`const x = ${source}`);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const vars = extractVariables(expr);
      
      expect(vars).toContain('title');
    });
    
    it('extracts root of member expression', () => {
      const source = 'user.profile.name';
      const ast = parseJsx(`const x = ${source}`);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const vars = extractVariables(expr);
      
      expect(vars).toContain('user');
      expect(vars).not.toContain('profile');
    });
    
    it('ignores known globals', () => {
      const source = 'console.log(value)';
      const ast = parseJsx(`const x = ${source}`);
      const decl = ast.program.body[0] as any;
      const expr = decl.declarations[0].init;
      
      const vars = extractVariables(expr);
      
      expect(vars).not.toContain('console');
      expect(vars).toContain('value');
    });
  });
});

// =============================================================================
// Transform Tests
// =============================================================================

describe('transformJsx', () => {
  describe('Basic Transformation', () => {
    it('transforms simple component', () => {
      const source = `
        export function HelloWorld() {
          return <div>Hello, World!</div>;
        }
      `;
      
      const result = transformJsx(source);
      
      expect(result.errors).toHaveLength(0);
      expect(result.tree.type).toBe('root');
      expect(result.tree.children.length).toBeGreaterThan(0);
    });
    
    it('transforms arrow function component', () => {
      const source = `
        export const MyComponent = () => {
          return <div className="container">Content</div>;
        };
      `;
      
      const result = transformJsx(source);
      
      expect(result.errors).toHaveLength(0);
      expect(result.tree.children.length).toBeGreaterThan(0);
      
      const div = result.tree.children[0];
      expect(isElement(div)).toBe(true);
      if (isElement(div)) {
        expect(div.tagName).toBe('div');
        expect(div.properties.className).toContain('container');
      }
    });
    
    it('preserves nested structure', () => {
      const source = `
        function Layout() {
          return (
            <div>
              <header>Header</header>
              <main>Content</main>
              <footer>Footer</footer>
            </div>
          );
        }
      `;
      
      const result = transformJsx(source);
      
      const div = result.tree.children[0];
      expect(isElement(div)).toBe(true);
      if (isElement(div)) {
        expect(div.children.length).toBe(3);
        
        const header = findByTag(result.tree, 'header');
        expect(header).toBeDefined();
        
        const main = findByTag(result.tree, 'main');
        expect(main).toBeDefined();
        
        const footer = findByTag(result.tree, 'footer');
        expect(footer).toBeDefined();
      }
    });
  });
  
  describe('Variable Detection', () => {
    it('detects simple variable expression', () => {
      const source = `
        function Greeting({ name }) {
          return <h1>{name}</h1>;
        }
      `;
      
      const result = transformJsx(source);
      
      expect(result.variables).toContain('name');
      
      const variables = findByAnnotation(result.tree, 'variable');
      expect(variables.length).toBeGreaterThan(0);
    });
    
    it('detects member expression variable', () => {
      const source = `
        function UserProfile({ user }) {
          return <div>{user.profile.name}</div>;
        }
      `;
      
      const result = transformJsx(source);
      
      // Variables are stored as full paths for template generation
      expect(result.variables).toContain('user.profile.name');
    });
  });
  
  describe('Loop Detection', () => {
    it('transforms .map() to loop annotation', () => {
      const source = `
        function ProductList({ products }) {
          return (
            <ul>
              {products.map(product => (
                <li key={product.id}>{product.name}</li>
              ))}
            </ul>
          );
        }
      `;
      
      const result = transformJsx(source);
      
      expect(result.variables).toContain('products');
      
      const loops = findByAnnotation(result.tree, 'loop');
      expect(loops.length).toBeGreaterThan(0);
      
      const loop = getAnnotations(loops[0]);
      expect(loop?.loop?.item).toBe('product');
      expect(loop?.loop?.collection).toBe('products');
    });
    
    it('handles nested .map()', () => {
      const source = `
        function NestedList({ categories }) {
          return (
            <div>
              {categories.map(category => (
                <section key={category.id}>
                  <h2>{category.name}</h2>
                </section>
              ))}
            </div>
          );
        }
      `;
      
      const result = transformJsx(source);
      
      const loops = findByAnnotation(result.tree, 'loop');
      expect(loops.length).toBeGreaterThan(0);
    });
  });
  
  describe('Conditional Detection', () => {
    it('transforms && conditional', () => {
      const source = `
        function Status({ isActive }) {
          return (
            <div>
              {isActive && <span className="active">Active</span>}
            </div>
          );
        }
      `;
      
      const result = transformJsx(source);
      
      expect(result.variables).toContain('isActive');
      
      const conditions = findByAnnotation(result.tree, 'condition');
      expect(conditions.length).toBeGreaterThan(0);
      
      const condition = getAnnotations(conditions[0]);
      expect(condition?.condition?.expression).toBe('isActive');
    });
    
    it('transforms ternary conditional', () => {
      const source = `
        function LoadingState({ isLoading }) {
          return (
            <div>
              {isLoading ? <span>Loading...</span> : <span>Loaded</span>}
            </div>
          );
        }
      `;
      
      const result = transformJsx(source);
      
      const conditions = findByAnnotation(result.tree, 'condition');
      expect(conditions.length).toBeGreaterThanOrEqual(1);
    });
    
    it('handles complex conditions', () => {
      const source = `
        function Dashboard({ user, isAdmin }) {
          return (
            <div>
              {user && isAdmin && <AdminPanel />}
            </div>
          );
        }
      `;
      
      const result = transformJsx(source);
      
      expect(result.variables).toContain('user');
      expect(result.variables).toContain('isAdmin');
    });
  });
  
  describe('Slot Detection', () => {
    it('transforms children to slot annotation', () => {
      const source = `
        function Card({ children }) {
          return (
            <div className="card">
              {children}
            </div>
          );
        }
      `;
      
      const result = transformJsx(source);
      
      const slots = findByAnnotation(result.tree, 'slot');
      expect(slots.length).toBeGreaterThan(0);
      
      const slot = getAnnotations(slots[0]);
      expect(slot?.slot?.name).toBe('default');
    });
  });
  
  describe('Component References', () => {
    it('detects component references as includes', () => {
      const source = `
        function Page() {
          return (
            <div>
              <Header title="My App" />
              <main>Content</main>
              <Footer />
            </div>
          );
        }
      `;
      
      const result = transformJsx(source);
      
      // Dependencies are stored as partial paths
      expect(result.dependencies).toContain('partials/header');
      expect(result.dependencies).toContain('partials/footer');
      
      const includes = findByAnnotation(result.tree, 'include');
      expect(includes.length).toBeGreaterThanOrEqual(2);
    });
    
    it('extracts props from component references', () => {
      const source = `
        function App() {
          return <Button variant="primary" size="lg" onClick={handleClick} />;
        }
      `;
      
      const result = transformJsx(source);
      
      const includes = findByAnnotation(result.tree, 'include');
      expect(includes.length).toBeGreaterThan(0);
      
      const include = getAnnotations(includes[0]);
      expect(include?.include?.props).toHaveProperty('variant');
      expect(include?.include?.props).toHaveProperty('size');
    });
  });
  
  describe('Metadata', () => {
    it('extracts component name', () => {
      const source = `
        export function MyAwesomeComponent() {
          return <div>Content</div>;
        }
      `;
      
      const result = transformJsx(source);
      
      expect(result.tree.meta?.componentName).toBe('MyAwesomeComponent');
    });
    
    it('detects component type from name', () => {
      const layoutSource = `
        export function MainLayout() {
          return <div>Layout</div>;
        }
      `;
      
      const result = transformJsx(layoutSource);
      
      expect(result.tree.meta?.componentType).toBe('layout');
    });
    
    it('extracts props from destructuring', () => {
      const source = `
        export function Card({ title, description, children }) {
          return <div>{title}</div>;
        }
      `;
      
      const result = transformJsx(source);
      
      const props = result.tree.meta?.props || [];
      const propNames = props.map(p => p.name);
      
      expect(propNames).toContain('title');
      expect(propNames).toContain('description');
      expect(propNames).toContain('children');
    });
  });
  
  describe('Error Handling', () => {
    it('handles empty source', () => {
      const result = transformJsx('');
      
      expect(result.tree.type).toBe('root');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
    
    it('handles source without JSX', () => {
      const source = `
        const x = 1;
        const y = 2;
      `;
      
      const result = transformJsx(source);
      
      expect(result.warnings).toContain('No JSX found in source');
    });
    
    it('handles syntax errors gracefully', () => {
      const source = `
        function Broken() {
          return <div>
        }
      `;
      
      const result = transformJsx(source);
      
      // Parser has error recovery, should still work partially
      expect(result.tree.type).toBe('root');
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration: Transform + Plugin', () => {
  it('produces valid HAST for Liquid plugin', async () => {
    const source = `
      export function ProductCard({ product, isOnSale }) {
        return (
          <article className="product-card">
            <h2>{product.name}</h2>
            <p className="price">{product.price}</p>
            {isOnSale && <span className="sale-badge">SALE</span>}
          </article>
        );
      }
    `;
    
    const result = transformJsx(source);
    
    // Verify structure
    expect(result.tree.type).toBe('root');
    expect(result.errors).toHaveLength(0);
    
    // Verify annotations
    const variables = collectVariables(result.tree);
    expect(variables).toContain('product.name');
    expect(variables).toContain('isOnSale');
    
    // Verify conditional
    const conditions = findByAnnotation(result.tree, 'condition');
    expect(conditions.length).toBeGreaterThan(0);
    
    // Verify variable annotations
    const varAnnotations = findByAnnotation(result.tree, 'variable');
    expect(varAnnotations.length).toBeGreaterThan(0);
  });
});
