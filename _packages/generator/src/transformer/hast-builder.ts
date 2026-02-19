/**
 * HAST Builder - Builds GenHAST tree from JSX AST
 *
 * Transforms Babel JSX AST into GenHAST with annotations for:
 * - Loops (items.map)
 * - Conditions (&& and ternary)
 * - Variables
 * - Slots (children)
 * - Includes (component references)
 */

import traverse from '@babel/traverse';
import type * as t from '@babel/types';
import type { File } from '@babel/types';
import {
  element,
  text,
  root,
  annotate,
  type GenRoot,
  type GenElement,
  type GenChild,
  type GenText,
  type GenAnnotations,
  type GenComponentMeta,
} from '../hast';
import { analyzeExpression, extractVariables } from './expression-analyzer';
import { getNodeSource } from './jsx-parser';
import { DslRegistry, type DslHandlerContext, type IDslComponentHandler } from './dsl-handler';
import { BUILT_IN_DSL_HANDLERS } from './dsl-handlers';
import type { TransformOptions, AnalyzedComponent, DEFAULT_COMPONENT_PATTERNS } from './types';

// =============================================================================
// Main Builder
// =============================================================================

/**
 * Build GenHAST tree from Babel AST
 */
export function buildHast(
  ast: File,
  source: string,
  options: TransformOptions = {}
): GenRoot {
  const builder = new HastBuilder(ast, source, options);
  return builder.build();
}

// =============================================================================
// Builder Class
// =============================================================================

class HastBuilder {
  private ast: File;
  private source: string;
  private options: TransformOptions;
  private variables = new Set<string>();
  private dependencies = new Set<string>();
  private warnings: string[] = [];
  private componentInfo: AnalyzedComponent | null = null;
  private dslRegistry: DslRegistry;
  
  constructor(ast: File, source: string, options: TransformOptions) {
    this.ast = ast;
    this.source = source;
    this.options = options;
    
    // Initialize DSL registry
    this.dslRegistry = new DslRegistry();
    for (const handler of BUILT_IN_DSL_HANDLERS) {
      this.dslRegistry.register(handler);
    }
  }
  
  build(): GenRoot {
    // Find the component to transform
    const componentNode = this.findMainComponent();
    
    if (!componentNode) {
      return root([], this.createMeta());
    }
    
    // Extract preamble (statements before return) and vars declared there
    const { preamble, preambleVars } = this.findPreamble(componentNode);
    
    // Get the JSX return
    const jsxRoot = this.findJsxReturn(componentNode);
    
    if (!jsxRoot) {
      return root([], this.createMeta(preamble, preambleVars));
    }
    
    // Transform JSX to HAST
    const children = this.transformJsxNode(jsxRoot);
    
    return root(
      Array.isArray(children) ? children : [children].filter(Boolean) as GenChild[],
      this.createMeta(preamble, preambleVars)
    );
  }
  
  // ===========================================================================
  // Component Discovery
  // ===========================================================================
  
  /**
   * Find the main component to transform
   */
  private findMainComponent(): t.Node | null {
    let foundComponent: t.Node | null = null;
    const targetName = this.options.componentName;
    
    traverse(this.ast, {
      // Function declaration: function MyComponent() {}
      FunctionDeclaration: (path) => {
        if (this.isValidComponent(path.node, targetName)) {
          foundComponent = path.node;
          this.componentInfo = this.analyzeComponent(path.node);
          path.stop();
        }
      },
      
      // Variable declaration: const MyComponent = () => {} or ({ a, b }) => {}
      VariableDeclarator: (path) => {
        if (path.node.id.type === 'Identifier') {
          const name = path.node.id.name;
          if (targetName ? name === targetName : this.looksLikeComponent(name)) {
            const init = path.node.init;
            if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
              foundComponent = init;
              const params = init.params;
              this.componentInfo = {
                name,
                type: this.detectComponentType(name),
                props: this.extractPropsFromParams(params as t.FunctionDeclaration['params']),
                exportType: 'named',
                isFunctionComponent: true,
                usesForwardRef: false,
                sourceFile: this.options.sourceFile,
              };
              path.stop();
            }
          }
        }
      },
      
      // Export default: export default function MyComponent() {}
      ExportDefaultDeclaration: (path) => {
        const decl = path.node.declaration;
        if (decl.type === 'FunctionDeclaration' && decl.id) {
          foundComponent = decl;
          this.componentInfo = this.analyzeComponent(decl);
          path.stop();
        } else if (decl.type === 'ArrowFunctionExpression' || decl.type === 'FunctionExpression') {
          foundComponent = decl;
          const params = decl.params;
          this.componentInfo = {
            name: this.options.componentName || 'Component',
            type: 'component',
            props: this.extractPropsFromParams(params as t.FunctionDeclaration['params']),
            exportType: 'default',
            isFunctionComponent: true,
            usesForwardRef: false,
            sourceFile: this.options.sourceFile,
          };
          path.stop();
        }
      },
    });
    
    return foundComponent;
  }
  
  /**
   * Check if a function is a valid React component
   */
  private isValidComponent(node: t.FunctionDeclaration, targetName?: string): boolean {
    if (!node.id) return false;
    const name = node.id.name;
    
    if (targetName) {
      return name === targetName;
    }
    
    return this.looksLikeComponent(name);
  }
  
  /**
   * Check if name looks like a component (PascalCase)
   */
  private looksLikeComponent(name: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }
  
  /**
   * Analyze component info
   */
  private analyzeComponent(node: t.FunctionDeclaration): AnalyzedComponent {
    const name = node.id?.name || 'Component';
    
    return {
      name,
      type: this.detectComponentType(name),
      props: this.extractPropsFromParams(node.params),
      exportType: 'named',
      isFunctionComponent: true,
      usesForwardRef: false,
      sourceFile: this.options.sourceFile,
    };
  }
  
  /**
   * Detect component type from name
   */
  private detectComponentType(name: string): 'layout' | 'partial' | 'page' | 'block' | 'component' {
    const patterns = this.options.componentPatterns || {
      layouts: [/Layout$/i],
      partials: [/^Header$/i, /^Footer$/i, /^Nav(bar)?$/i, /^Sidebar$/i],
      pages: [/Page$/i],
      blocks: [/Block$/i, /Section$/i],
    };
    
    for (const pattern of patterns.layouts || []) {
      if (pattern.test(name)) return 'layout';
    }
    for (const pattern of patterns.partials || []) {
      if (pattern.test(name)) return 'partial';
    }
    for (const pattern of patterns.pages || []) {
      if (pattern.test(name)) return 'page';
    }
    for (const pattern of patterns.blocks || []) {
      if (pattern.test(name)) return 'block';
    }
    
    return 'component';
  }
  
  /**
   * Extract props from function parameters.
   * Resolves TypeScript types when a type annotation references an interface/type in the same file.
   */
  private extractPropsFromParams(params: t.FunctionDeclaration['params']): AnalyzedComponent['props'] {
    const props: AnalyzedComponent['props'] = [];

    if (params.length === 0) return props;

    const firstParam = params[0];

    if (firstParam.type !== 'ObjectPattern') return props;

    // Try to resolve the TS type annotation to an interface/type in the file
    const typeMap = this.resolvePropsTypeAnnotation(firstParam);

    for (const prop of firstParam.properties) {
      if (prop.type !== 'ObjectProperty') continue;
      let name: string | undefined;
      if (prop.key.type === 'Identifier') {
        name = prop.key.name;
      } else if (prop.key.type === 'StringLiteral' && prop.value.type === 'Identifier') {
        name = prop.value.name;
      } else if (prop.key.type === 'StringLiteral' && prop.value.type === 'AssignmentPattern' && prop.value.left.type === 'Identifier') {
        name = prop.value.left.name;
      }
      if (!name) continue;
      const hasDefault = prop.value.type === 'AssignmentPattern';

      // Look up TS type from interface (use original key name for lookup)
      const keyName = prop.key.type === 'Identifier' ? prop.key.name
        : prop.key.type === 'StringLiteral' ? prop.key.value
        : name;
      const tsType = typeMap.get(keyName) ?? 'unknown';

      props.push({
        name,
        type: tsType,
        required: !hasDefault && !typeMap.get(`__optional_${keyName}`),
        defaultValue: hasDefault && prop.value.type === 'AssignmentPattern'
          ? getNodeSource(this.source, prop.value.right)
          : undefined,
      });
    }

    return props;
  }

  /**
   * Resolve the TypeAnnotation on an ObjectPattern parameter to a Map<propName, tsType>.
   * Walks the AST to find the referenced interface/type alias.
   */
  private resolvePropsTypeAnnotation(param: t.ObjectPattern): Map<string, string> {
    const map = new Map<string, string>();
    const ann = (param as any).typeAnnotation;
    if (!ann || ann.type !== 'TSTypeAnnotation') return map;

    const typeRef = ann.typeAnnotation;
    if (!typeRef || typeRef.type !== 'TSTypeReference') return map;
    if (typeRef.typeName.type !== 'Identifier') return map;

    const typeName = typeRef.typeName.name;

    // Walk AST to find the interface/type declaration with this name
    traverse(this.ast, {
      TSInterfaceDeclaration: (path) => {
        if (path.node.id.name !== typeName) return;
        for (const member of path.node.body.body) {
          if (member.type !== 'TSPropertySignature') continue;
          const key = member.key.type === 'Identifier' ? member.key.name
            : member.key.type === 'StringLiteral' ? member.key.value
            : null;
          if (!key) continue;
          map.set(key, member.typeAnnotation ? getNodeSource(this.source, member.typeAnnotation.typeAnnotation) : 'unknown');
          if (member.optional) map.set(`__optional_${key}`, 'true');
        }
      },
      TSTypeAliasDeclaration: (path) => {
        if (path.node.id.name !== typeName) return;
        const node = path.node.typeAnnotation;
        if (node.type !== 'TSTypeLiteral') return;
        for (const member of node.members) {
          if (member.type !== 'TSPropertySignature') continue;
          const key = member.key.type === 'Identifier' ? member.key.name
            : member.key.type === 'StringLiteral' ? member.key.value
            : null;
          if (!key) continue;
          map.set(key, member.typeAnnotation ? getNodeSource(this.source, member.typeAnnotation.typeAnnotation) : 'unknown');
          if (member.optional) map.set(`__optional_${key}`, 'true');
        }
      },
      noScope: true,
    });

    return map;
  }
  
  // ===========================================================================
  // JSX Return Discovery
  // ===========================================================================
  
  /**
   * Extract statements before the return (preamble) and variable names declared there.
   * Preserves const/let/var declarations and expression statements (e.g. hook calls).
   */
  private findPreamble(componentNode: t.Node): { preamble: string[]; preambleVars: string[] } {
    const preamble: string[] = [];
    const preambleVars: string[] = [];
    let body: t.Statement[] | null = null;

    if (componentNode.type === 'FunctionDeclaration' && componentNode.body.type === 'BlockStatement') {
      body = componentNode.body.body;
    } else if (
      (componentNode.type === 'ArrowFunctionExpression' || componentNode.type === 'FunctionExpression') &&
      componentNode.body.type === 'BlockStatement'
    ) {
      body = componentNode.body.body;
    }
    if (!body || body.length === 0) return { preamble, preambleVars };

    for (const stmt of body) {
      if (stmt.type === 'ReturnStatement') break;
      if (stmt.type === 'VariableDeclaration') {
        for (const decl of stmt.declarations) {
          if (decl.id.type === 'Identifier') {
            preambleVars.push(decl.id.name);
          }
        }
        preamble.push(getNodeSource(this.source, stmt));
      } else if (stmt.type === 'ExpressionStatement') {
        preamble.push(getNodeSource(this.source, stmt));
      }
    }
    return { preamble, preambleVars };
  }

  /**
   * Find the JSX return statement in a component
   */
  private findJsxReturn(componentNode: t.Node): t.JSXElement | t.JSXFragment | null {
    // Handle arrow function with implicit JSX return
    if (componentNode.type === 'ArrowFunctionExpression') {
      const body = componentNode.body;
      if (body.type === 'JSXElement' || body.type === 'JSXFragment') {
        return body;
      }
      if (body.type === 'ParenthesizedExpression') {
        const expr = body.expression;
        if (expr.type === 'JSXElement' || expr.type === 'JSXFragment') {
          return expr;
        }
      }
    }
    
    // Search for return statement
    let jsxReturn: t.JSXElement | t.JSXFragment | null = null;
    
    const searchNode = (node: t.Node): void => {
      if (jsxReturn) return;
      
      if (node.type === 'ReturnStatement') {
        const arg = node.argument;
        if (arg && (arg.type === 'JSXElement' || arg.type === 'JSXFragment')) {
          jsxReturn = arg;
          return;
        } else if (arg && arg.type === 'ParenthesizedExpression') {
          const expr = arg.expression;
          if (expr.type === 'JSXElement' || expr.type === 'JSXFragment') {
            jsxReturn = expr;
            return;
          }
        }
      }
      
      // Recurse into child nodes
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end') continue;
        const child = (node as any)[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item.type === 'string') {
                searchNode(item);
                if (jsxReturn) return;
              }
            }
          } else if (typeof child.type === 'string') {
            searchNode(child);
            if (jsxReturn) return;
          }
        }
      }
    };
    
    searchNode(componentNode);
    return jsxReturn;
  }
  
  // ===========================================================================
  // JSX Transformation
  // ===========================================================================
  
  /**
   * Transform JSX node to HAST
   */
  private transformJsxNode(node: t.JSXElement | t.JSXFragment | t.JSXText | t.JSXExpressionContainer): GenChild | GenChild[] | null {
    if (node.type === 'JSXElement') {
      return this.transformJsxElement(node);
    }
    
    if (node.type === 'JSXFragment') {
      return this.transformJsxFragment(node);
    }
    
    if (node.type === 'JSXText') {
      return this.transformJsxText(node);
    }
    
    if (node.type === 'JSXExpressionContainer') {
      return this.transformJsxExpression(node);
    }
    
    return null;
  }
  
  /**
   * Transform JSX element to HAST element
   */
  private transformJsxElement(node: t.JSXElement): GenElement {
    const tagName = this.getTagName(node);
    const properties = this.transformAttributes(node.openingElement.attributes);
    const children = this.transformChildren(node.children);
    
    // Check for DSL components first
    const dslResult = this.handleDslComponent(tagName, node, children);
    if (dslResult) {
      return dslResult;
    }
    
    // Check if this is a component reference
    if (this.isComponentTag(tagName)) {
      // Passthrough components: keep as elements with children
      if (this.isPassthroughComponent(tagName)) {
        return element(tagName, properties, children);
      }

      // Add include annotation; keep children so React can emit <Component>{children}</Component>
      const annotations: GenAnnotations = {
        include: {
          partial: this.componentToPartialPath(tagName),
          props: this.extractComponentProps(node.openingElement.attributes),
          originalName: tagName,
        },
      };
      
      this.dependencies.add(tagName);
      
      return element('div', { ...properties, _gen: annotations }, children);
    }
    
    return element(tagName, properties, children);
  }

  /**
   * Handle DSL components using registry
   */
  private handleDslComponent(
    tagName: string,
    node: t.JSXElement,
    children: GenChild[]
  ): GenElement | null {
    // Check if handler exists for this DSL component
    if (!this.dslRegistry.has(tagName)) {
      return null; // Not a DSL component, handled elsewhere
    }
    
    const handler = this.dslRegistry.get(tagName)!;
    
    // For Loop: extract render-function body as children
    // Handles {(item) => (<JSX/>)} pattern that transformChildren can't parse
    let effectiveChildren = children;
    if (tagName === 'Loop') {
      const loopBody = this.extractLoopBody(node);
      if (loopBody.length > 0) {
        effectiveChildren = loopBody;
      }
    }
    
    const context: DslHandlerContext = {
      source: this.source,
      warnings: this.warnings,
      variables: this.variables,
      dependencies: this.dependencies,
      options: this.options,
    };
    
    return handler.handle(node, effectiveChildren, context);
  }
  
  /**
   * Get tag name from JSX element
   */
  private getTagName(node: t.JSXElement): string {
    const name = node.openingElement.name;
    
    if (name.type === 'JSXIdentifier') {
      return name.name;
    }
    
    if (name.type === 'JSXMemberExpression') {
      // e.g., Header.Nav
      return this.getJsxMemberName(name);
    }
    
    return 'div';
  }
  
  /**
   * Get member expression name
   */
  private getJsxMemberName(node: t.JSXMemberExpression): string {
    const parts: string[] = [];
    let current: t.JSXMemberExpression | t.JSXIdentifier = node;
    
    while (current.type === 'JSXMemberExpression') {
      if (current.property.type === 'JSXIdentifier') {
        parts.unshift(current.property.name);
      }
      current = current.object;
    }
    
    if (current.type === 'JSXIdentifier') {
      parts.unshift(current.name);
    }
    
    return parts.join('.');
  }
  
  /**
   * Check if tag is a component (PascalCase)
   */
  private isComponentTag(tagName: string): boolean {
    return /^[A-Z]/.test(tagName);
  }

  /**
   * Check if component should be preserved as an element (passthrough)
   * rather than converted to an include annotation.
   * Used for UI primitives (Block, Stack, Container, etc.)
   */
  private isPassthroughComponent(tagName: string): boolean {
    const passthrough = this.options.passthroughComponents;
    if (!passthrough || passthrough.length === 0) return false;
    return passthrough.includes(tagName);
  }
  
  /**
   * Convert component name to partial path
   */
  private componentToPartialPath(componentName: string): string {
    // Convert PascalCase/acronyms to kebab-case:
    //   CTABlock → cta-block, SidebarContent → sidebar-content, DashSidebar → dash-sidebar
    const kebab = componentName
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')  // split acronym from next word (CTABlock → CTA-Block)
      .replace(/([a-z])([A-Z])/g, '$1-$2')          // split camel (sideBar → side-Bar)
      .toLowerCase();

    return `partials/${kebab}`;
  }
  
  /**
   * Transform JSX attributes to HAST properties
   */
  private transformAttributes(attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[]): GenElement['properties'] {
    const properties: GenElement['properties'] = {};
    
    for (const attr of attributes) {
      if (attr.type === 'JSXSpreadAttribute') {
        // Can't handle spread in static templates
        this.warnings.push(`Spread attribute not supported in templates: ${getNodeSource(this.source, attr)}`);
        continue;
      }
      
      const name = attr.name.type === 'JSXIdentifier' 
        ? attr.name.name 
        : `${attr.name.namespace.name}:${attr.name.name.name}`;
      
      // Skip key prop (used for React reconciliation only)
      if (name === 'key') continue;
      
      const value = this.getAttributeValue(attr);
      
      // Convert className
      if (name === 'className') {
        if (typeof value === 'string') {
          properties.className = value.split(/\s+/).filter(Boolean);
        }
        continue;
      }
      
      properties[name] = value;
    }
    
    return properties;
  }
  
  /**
   * Get attribute value
   */
  private getAttributeValue(attr: t.JSXAttribute): unknown {
    const value = attr.value;
    
    if (!value) {
      // Boolean true
      return true;
    }
    
    if (value.type === 'StringLiteral') {
      return value.value;
    }
    
    if (value.type === 'JSXExpressionContainer') {
      const expr = value.expression;
      
      if (expr.type === 'StringLiteral') {
        return expr.value;
      }
      
      if (expr.type === 'NumericLiteral') {
        return expr.value;
      }
      
      if (expr.type === 'BooleanLiteral') {
        return expr.value;
      }
      
      // Dynamic value - mark as expression for template rendering
      return { __expression: getNodeSource(this.source, expr) };
    }
    
    return undefined;
  }
  
  /**
   * Extract props passed to component
   */
  private extractComponentProps(attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[]): Record<string, string> {
    const props: Record<string, string> = {};
    
    for (const attr of attributes) {
      if (attr.type === 'JSXSpreadAttribute') {
        // Preserve spread as a special key so React plugin can emit {...expr}
        const expr = getNodeSource(this.source, attr.argument);
        props[`__spread_${Object.keys(props).length}`] = expr;
        continue;
      }
      if (attr.name.type !== 'JSXIdentifier') continue;
      
      const name = attr.name.name;
      if (name === 'key') continue;
      
      const value = attr.value;
      
      if (!value) {
        props[name] = 'true';
      } else if (value.type === 'StringLiteral') {
        props[name] = `"${value.value}"`;
      } else if (value.type === 'JSXExpressionContainer') {
        props[name] = getNodeSource(this.source, value.expression);
      }
    }
    
    return props;
  }
  
  /**
   * Transform JSX children
   */
  private transformChildren(children: t.JSXElement['children']): GenChild[] {
    const result: GenChild[] = [];
    
    for (const child of children) {
      const transformed = this.transformJsxNode(child as any);
      
      if (transformed === null) continue;
      
      if (Array.isArray(transformed)) {
        result.push(...transformed);
      } else {
        result.push(transformed);
      }
    }
    
    return result;
  }
  
  /**
   * Transform JSX fragment
   */
  private transformJsxFragment(node: t.JSXFragment): GenChild[] {
    return this.transformChildren(node.children);
  }
  
  /**
   * Transform JSX text
   */
  private transformJsxText(node: t.JSXText): GenText | null {
    // Normalize internal whitespace but preserve meaningful content.
    // JSX text like "  at  " between expressions must keep " at ".
    const normalized = node.value.replace(/\s+/g, ' ');

    // Purely empty or newline-only JSX text between tags — drop
    if (normalized === ' ' && /^\s*\n/.test(node.value)) {
      return null;
    }

    if (!normalized || normalized === '') {
      return null;
    }

    return text(normalized);
  }
  
  /**
   * Transform JSX expression container
   */
  private transformJsxExpression(node: t.JSXExpressionContainer): GenChild | GenChild[] | null {
    const expr = node.expression;
    
    if (expr.type === 'JSXEmptyExpression') {
      return null;
    }
    
    // Analyze the expression
    const analyzed = analyzeExpression(expr, this.source);
    
    // Track variables
    const vars = extractVariables(expr);
    for (const v of vars) {
      this.variables.add(v);
    }
    
    switch (analyzed.type) {
      case 'variable':
      case 'member':
        return this.createVariableElement(analyzed.path || analyzed.raw);
      
      case 'loop':
        return this.createLoopElement(expr as t.CallExpression, analyzed);
      
      case 'conditional':
        return this.createConditionalElement(expr, analyzed);
      
      case 'children':
        return this.createSlotElement('default');
      
      case 'literal':
        return text(analyzed.raw);
      
      case 'template':
        // Template literals need special handling
        return this.createTemplateElement(expr as t.TemplateLiteral);
      
      default:
        this.warnings.push(`Unknown expression type: ${analyzed.raw}`);
        return null;
    }
  }
  
  /**
   * Create variable element with annotation
   */
  private createVariableElement(path: string): GenElement {
    return annotate(
      element('span', {}, []),
      {
        variable: { name: path },
        unwrap: true,
      }
    );
  }
  
  /**
   * Create loop element with annotation
   */
  private createLoopElement(expr: t.CallExpression, analyzed: ReturnType<typeof analyzeExpression>): GenElement {
    // Get the callback and transform its body
    const callback = expr.arguments[0];
    let loopContent: GenChild[] = [];
    
    if (callback && (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')) {
      const body = callback.body;
      
      if (body.type === 'JSXElement') {
        const transformed = this.transformJsxElement(body);
        loopContent = [transformed];
      } else if (body.type === 'BlockStatement') {
        // Find return statement
        for (const stmt of body.body) {
          if (stmt.type === 'ReturnStatement' && stmt.argument) {
            if (stmt.argument.type === 'JSXElement') {
              const transformed = this.transformJsxElement(stmt.argument);
              loopContent = [transformed];
              break;
            }
          }
        }
      }
    }
    
    return annotate(
      element('div', {}, loopContent),
      {
        loop: {
          item: analyzed.loopItem!,
          collection: analyzed.loopCollection!,
          key: analyzed.loopKey,
        },
        unwrap: true,
      }
    );
  }
  
  /**
   * Create conditional element with annotation
   */
  private createConditionalElement(expr: t.Expression, analyzed: ReturnType<typeof analyzeExpression>): GenElement | GenChild[] {
    if (analyzed.isTernary && expr.type === 'ConditionalExpression') {
      // Ternary: condition ? consequent : alternate
      const consequent = expr.consequent;
      const alternate = expr.alternate;
      
      const ifContent = this.transformJsxChild(consequent);
      const elseContent = this.transformJsxChild(alternate);
      
      // Else element nested inside if — so the plugin can detect
      // branch markers within the if element's content
      const elseElement = annotate(
        element('div', {}, elseContent),
        {
          condition: { expression: '', isElse: true },
          unwrap: true,
        }
      );
      
      // Single if element containing both branches
      return annotate(
        element('div', {}, [...ifContent, elseElement]),
        {
          condition: { expression: analyzed.condition! },
          unwrap: true,
        }
      );
    }
    
    // Logical AND: condition && content
    if (expr.type === 'LogicalExpression' && expr.operator === '&&') {
      const content = this.transformJsxChild(expr.right);
      
      return annotate(
        element('div', {}, content),
        {
          condition: { expression: analyzed.condition! },
          unwrap: true,
        }
      );
    }
    
    return element('div', {}, []);
  }
  
  /**
   * Extract JSX body from Loop's render-function children.
   * Handles: {(item) => (<Button>...</Button>)}
   * and: {(item) => { return (<Button>...</Button>); }}
   */
  private extractLoopBody(node: t.JSXElement): GenChild[] {
    for (const child of node.children) {
      if (child.type !== 'JSXExpressionContainer') continue;
      const expr = child.expression;
      if (expr.type !== 'ArrowFunctionExpression' && expr.type !== 'FunctionExpression') continue;
      
      const body = expr.body;
      
      // Implicit return: (item) => (<JSX/>)
      if (body.type === 'JSXElement') {
        return [this.transformJsxElement(body)];
      }
      if (body.type === 'JSXFragment') {
        return this.transformJsxFragment(body);
      }
      if (body.type === 'ParenthesizedExpression') {
        const inner = body.expression;
        if (inner.type === 'JSXElement') return [this.transformJsxElement(inner)];
        if (inner.type === 'JSXFragment') return this.transformJsxFragment(inner);
      }
      
      // Block body: (item) => { return (<JSX/>) }
      if (body.type === 'BlockStatement') {
        for (const stmt of body.body) {
          if (stmt.type !== 'ReturnStatement' || !stmt.argument) continue;
          const arg = stmt.argument;
          if (arg.type === 'JSXElement') return [this.transformJsxElement(arg)];
          if (arg.type === 'JSXFragment') return this.transformJsxFragment(arg);
          if (arg.type === 'ParenthesizedExpression') {
            const inner = arg.expression;
            if (inner.type === 'JSXElement') return [this.transformJsxElement(inner)];
            if (inner.type === 'JSXFragment') return this.transformJsxFragment(inner);
          }
        }
      }
    }
    return [];
  }

  /**
   * Transform a JSX expression node to GenChild array
   * Handles JSXElement, JSXFragment, and parenthesized expressions
   */
  private transformJsxChild(node: t.Expression): GenChild[] {
    if (node.type === 'JSXElement') {
      return [this.transformJsxElement(node)];
    }
    if (node.type === 'JSXFragment') {
      return this.transformJsxFragment(node);
    }
    if (node.type === 'ParenthesizedExpression') {
      return this.transformJsxChild(node.expression);
    }
    if (node.type === 'NullLiteral') {
      return [];
    }
    return [];
  }
  
  /**
   * Create slot element with annotation
   */
  private createSlotElement(name: string): GenElement {
    return annotate(
      element('div', {}, []),
      {
        slot: { name },
        unwrap: true,
      }
    );
  }
  
  /**
   * Create template literal element
   */
  private createTemplateElement(node: t.TemplateLiteral): GenChild[] {
    const result: GenChild[] = [];
    
    for (let i = 0; i < node.quasis.length; i++) {
      const quasi = node.quasis[i];
      
      // Add text part
      if (quasi.value.cooked) {
        result.push(text(quasi.value.cooked));
      }
      
      // Add expression part
      if (i < node.expressions.length) {
        const expr = node.expressions[i];
        const path = getNodeSource(this.source, expr);
        result.push(this.createVariableElement(path));
      }
    }
    
    return result;
  }
  
  // ===========================================================================
  // Metadata
  // ===========================================================================
  
  /**
   * Create component metadata
   */
  private createMeta(preamble?: string[], preambleVars?: string[]): GenComponentMeta {
    return {
      sourceFile: this.options.sourceFile || 'unknown',
      componentName: this.componentInfo?.name || 'Component',
      exports: this.componentInfo ? [this.componentInfo.name] : [],
      dependencies: Array.from(this.dependencies),
      componentType: this.componentInfo?.type,
      props: this.componentInfo?.props.map(p => ({
        name: p.name,
        type: p.type,
        required: p.required,
        defaultValue: p.defaultValue,
      })),
      ...(preamble && preamble.length > 0 ? { preamble, preambleVars: preambleVars ?? [] } : {}),
    };
  }
}
