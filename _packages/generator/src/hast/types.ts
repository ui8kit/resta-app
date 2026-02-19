/**
 * HAST Types for Generator
 *
 * Extended HAST (Hypertext Abstract Syntax Tree) types with generator-specific
 * metadata for template generation. Based on the unified ecosystem standard.
 *
 * @see https://github.com/syntax-tree/hast
 */

// =============================================================================
// Base HAST Types (compatible with unified ecosystem)
// =============================================================================

/**
 * Node types in the HAST tree
 */
export type GenNodeType = 'root' | 'element' | 'text' | 'comment' | 'doctype';

/**
 * Base node interface
 */
export interface GenNode {
  type: GenNodeType;
}

/**
 * Text node - contains raw text content
 */
export interface GenText extends GenNode {
  type: 'text';
  value: string;
}

/**
 * Comment node - HTML comment
 */
export interface GenComment extends GenNode {
  type: 'comment';
  value: string;
}

/**
 * Doctype node - document type declaration
 */
export interface GenDoctype extends GenNode {
  type: 'doctype';
}

// =============================================================================
// Generator Annotations (metadata for template generation)
// =============================================================================

/**
 * Loop annotation - represents iteration over a collection
 *
 * @example
 * React: {items.map(item => <div>{item.name}</div>)}
 * Liquid: {% for item in items %}...{% endfor %}
 * Twig: {% for item in items %}...{% endfor %}
 */
export interface GenLoop {
  /** Variable name for each item: "item", "product" */
  item: string;
  /** Collection to iterate: "items", "products", "user.orders" */
  collection: string;
  /** Key field for React reconciliation (optional) */
  key?: string;
  /** Index variable name (optional): "index", "i" */
  index?: string;
}

/**
 * Conditional annotation - represents if/else logic
 *
 * @example
 * React: {isActive && <div>Active</div>}
 * Liquid: {% if isActive %}...{% endif %}
 * Twig: {% if isActive %}...{% endif %}
 */
export interface GenCondition {
  /** Condition expression: "isActive", "user.isAdmin", "items.length > 0" */
  expression: string;
  /** Is this an else branch? */
  isElse?: boolean;
  /** Is this an elseif branch? If so, expression is the condition */
  isElseIf?: boolean;
}

/**
 * Variable annotation - represents dynamic value insertion
 *
 * @example
 * React: {title}
 * Liquid: {{ title | default: 'Untitled' }}
 * Twig: {{ title ?? 'Untitled' }}
 */
export interface GenVariable {
  /** Variable name/path: "title", "user.name", "product.price" */
  name: string;
  /** Default value if variable is undefined */
  default?: string;
  /** Filter/pipe to apply: "uppercase", "currency", "date" */
  filter?: string;
  /** Filter arguments */
  filterArgs?: string[];
}

/**
 * Slot annotation - represents a placeholder for content injection
 *
 * @example
 * React: {children} or <Slot name="header" />
 * Liquid: {{ header_content }} or {% include %}
 * Twig: {% block header %}...{% endblock %}
 */
export interface GenSlot {
  /** Slot name: "default", "header", "footer", "sidebar" */
  name: string;
  /** Accepted component types (optional) */
  accepts?: string[];
  /** Can contain multiple components? */
  multiple?: boolean;
  /** Is this slot required? */
  required?: boolean;
}

/**
 * Include annotation - represents partial/component inclusion
 *
 * @example
 * React: <Header siteName={siteName} />
 * Liquid: {% include 'partials/header.liquid', siteName: siteName %}
 * Twig: {% include 'partials/header.twig' with {siteName: siteName} %}
 */
export interface GenInclude {
  /** Partial/component path: "partials/header", "components/cta-block" */
  partial: string;
  /** Props to pass to the partial */
  props?: Record<string, string>;
  /** Original component name (preserves casing: "CTABlock", "DashSidebar") */
  originalName?: string;
}

/**
 * Block annotation - represents template inheritance block
 *
 * @example
 * Twig: {% block content %}...{% endblock %}
 * Latte: {block content}...{/block}
 */
export interface GenBlock {
  /** Block name: "content", "scripts", "styles" */
  name: string;
  /** Parent block to extend (for inheritance) */
  extends?: string;
}

/**
 * Complete generator annotations object
 */
export interface GenAnnotations {
  /** Loop annotation */
  loop?: GenLoop;
  /** Conditional annotation */
  condition?: GenCondition;
  /** Variable annotation */
  variable?: GenVariable;
  /** Slot annotation */
  slot?: GenSlot;
  /** Include annotation */
  include?: GenInclude;
  /** Block annotation */
  block?: GenBlock;
  /** Remove wrapper element in output (keep children only) */
  unwrap?: boolean;
  /** Don't process children (raw output) */
  raw?: boolean;
  /** Original React component name */
  component?: string;
  /** Source file location */
  source?: {
    file: string;
    line: number;
    column: number;
  };
}

// =============================================================================
// Element Properties
// =============================================================================

/**
 * Standard HTML properties
 */
export interface GenProperties {
  /** CSS classes */
  className?: string[];
  /** Element ID */
  id?: string;
  /** Inline styles */
  style?: string | Record<string, string>;
  /** Data attributes */
  [key: `data-${string}`]: string | undefined;
  /** ARIA attributes */
  [key: `aria-${string}`]: string | undefined;
  /** Any other HTML attribute */
  [key: string]: unknown;
}

/**
 * Extended properties with generator annotations
 */
export interface GenElementProperties extends GenProperties {
  /** Generator annotations (internal, not rendered to HTML) */
  _gen?: GenAnnotations;
}

// =============================================================================
// Element Node
// =============================================================================

/**
 * Element node - represents an HTML element with optional generator annotations
 */
export interface GenElement extends GenNode {
  type: 'element';
  /** HTML tag name: "div", "span", "button", "custom-element" */
  tagName: string;
  /** Element properties including generator annotations */
  properties: GenElementProperties;
  /** Child nodes */
  children: GenChild[];
}

/**
 * Possible child node types
 */
export type GenChild = GenElement | GenText | GenComment;

// =============================================================================
// Root Node (Document)
// =============================================================================

/**
 * Source import for emission (e.g. React full-file output).
 * Used by React plugin only; other engines ignore.
 */
export interface GenSourceImport {
  source: string;
  defaultImport?: string;
  namedImports: string[];
  namespaceImport?: string;
  isTypeOnly: boolean;
}

/**
 * Component metadata extracted from source
 */
export interface GenComponentMeta {
  /** Source file path */
  sourceFile: string;
  /** Component/function name */
  componentName: string;
  /** Exported identifiers */
  exports: string[];
  /** Import dependencies */
  dependencies: string[];
  /** Component type */
  componentType?: 'layout' | 'partial' | 'page' | 'block' | 'component';
  /** Props interface/type if extractable */
  props?: GenPropDefinition[];
  /** Imports from source (for React full-file emission) */
  imports?: GenSourceImport[];
  /** Statements before return (const, let, hook calls) — emitted as body preamble */
  preamble?: string[];
  /** Variable names declared in preamble — excluded from emitted props */
  preambleVars?: string[];
}

/**
 * Prop definition extracted from TypeScript
 */
export interface GenPropDefinition {
  /** Prop name */
  name: string;
  /** TypeScript type as string */
  type: string;
  /** Is this prop required? */
  required: boolean;
  /** Default value if any */
  defaultValue?: unknown;
  /** JSDoc description */
  description?: string;
}

/**
 * Root node - represents the document/component root
 */
export interface GenRoot extends GenNode {
  type: 'root';
  /** Child elements */
  children: GenChild[];
  /** Component metadata */
  meta?: GenComponentMeta;
}

// =============================================================================
// Tree Traversal Types
// =============================================================================

/**
 * Visitor callback for tree traversal
 */
export type GenVisitor = (
  node: GenNode,
  index: number | null,
  parent: GenElement | GenRoot | null
) => void | boolean | 'skip';

/**
 * Visitor object with enter/exit callbacks
 */
export interface GenVisitorObject {
  enter?: GenVisitor;
  exit?: GenVisitor;
}

/**
 * Node predicate for filtering
 */
export type GenNodePredicate = (node: GenNode) => boolean;

// =============================================================================
// Template Output Types
// =============================================================================

/**
 * Result of template transformation
 */
export interface TemplateOutput {
  /** Output filename */
  filename: string;
  /** Generated template content */
  content: string;
  /** Variables used in template */
  variables: string[];
  /** Dependencies (other templates) */
  dependencies: string[];
  /** Warnings during generation */
  warnings?: string[];
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if node is an element
 */
export function isElement(node: GenNode): node is GenElement {
  return node.type === 'element';
}

/**
 * Check if node is a text node
 */
export function isText(node: GenNode): node is GenText {
  return node.type === 'text';
}

/**
 * Check if node is a comment
 */
export function isComment(node: GenNode): node is GenComment {
  return node.type === 'comment';
}

/**
 * Check if node is a root
 */
export function isRoot(node: GenNode): node is GenRoot {
  return node.type === 'root';
}

/**
 * Check if element has generator annotations
 */
export function hasAnnotations(node: GenNode): boolean {
  if (!isElement(node)) return false;
  return node.properties._gen !== undefined;
}

/**
 * Check if element has a specific annotation
 */
export function hasAnnotation(
  node: GenNode,
  annotation: keyof GenAnnotations
): boolean {
  if (!isElement(node)) return false;
  return node.properties._gen?.[annotation] !== undefined;
}

/**
 * Get annotations from element (safe)
 */
export function getAnnotations(node: GenNode): GenAnnotations | undefined {
  if (!isElement(node)) return undefined;
  return node.properties._gen;
}
