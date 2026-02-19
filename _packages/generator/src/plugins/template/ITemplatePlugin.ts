/**
 * ITemplatePlugin - Interface for Template Engine Plugins
 *
 * Template plugins transform GenHAST trees into template files
 * for various template engines (Liquid, Handlebars, Twig, Latte, etc.)
 */

import type { z } from 'zod';
import type { GenRoot, GenElement, TemplateOutput, GenLoop, GenCondition, GenVariable, GenSlot, GenInclude, GenBlock } from '../../hast';
import type { ILogger } from '../../core/interfaces';

// =============================================================================
// Plugin Features
// =============================================================================

/**
 * Features supported by the template engine
 */
export interface TemplatePluginFeatures {
  /** Supports template inheritance (extends/blocks) */
  supportsInheritance: boolean;
  /** Supports partial includes */
  supportsPartials: boolean;
  /** Supports filters/pipes on variables */
  supportsFilters: boolean;
  /** Supports macros/reusable snippets */
  supportsMacros: boolean;
  /** Supports async/await */
  supportsAsync: boolean;
  /** Supports raw output (unescaped) */
  supportsRaw: boolean;
  /** Supports comments */
  supportsComments: boolean;
}

// =============================================================================
// Plugin Context
// =============================================================================

/**
 * Context provided to plugins during transformation
 */
export interface TemplatePluginContext {
  /** Logger instance */
  logger: ILogger;
  /** Configuration options */
  config: TemplatePluginConfig;
  /** Source file being processed */
  sourceFile?: string;
  /** Output directory */
  outputDir: string;
}

/**
 * Plugin configuration
 */
export interface TemplatePluginConfig {
  /** Output file extension (e.g., '.liquid', '.twig') */
  fileExtension: string;
  /** Output directory for templates */
  outputDir: string;
  /** Indentation style */
  indent?: string;
  /** Pretty print output */
  prettyPrint?: boolean;
  /** Custom filter mappings */
  filterMappings?: Record<string, string>;
  /** Custom options for specific plugin */
  [key: string]: unknown;
}

// =============================================================================
// Filter Mapping
// =============================================================================

/**
 * Filter definition for mapping between engines
 */
export interface FilterDefinition {
  /** Filter name in the target engine */
  name: string;
  /** How to format arguments */
  formatArgs?: (args: string[]) => string;
}

/**
 * Standard filters that plugins should support
 */
export type StandardFilter =
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'trim'
  | 'date'
  | 'currency'
  | 'number'
  | 'json'
  | 'escape'
  | 'raw'
  | 'default'
  | 'first'
  | 'last'
  | 'length'
  | 'join'
  | 'split'
  | 'reverse'
  | 'sort'
  | 'slice'
  | 'truncate';

// =============================================================================
// Transform Result
// =============================================================================

/**
 * Result of a single element transformation
 */
export interface TransformResult {
  /** Generated content */
  content: string;
  /** Warnings during transformation */
  warnings?: string[];
}

// =============================================================================
// ITemplatePlugin Interface
// =============================================================================

/**
 * Main interface for template plugins
 */
export interface ITemplatePlugin {
  // ===========================================================================
  // Identity
  // ===========================================================================

  /** Unique plugin name (e.g., 'liquid', 'twig', 'handlebars') */
  readonly name: string;

  /** Plugin version */
  readonly version: string;

  /** Target runtime ('js' for Node.js/Browser, 'php' for PHP) */
  readonly runtime: 'js' | 'php';

  /** File extension for output (e.g., '.liquid', '.twig') */
  readonly fileExtension: string;

  /** Human-readable description */
  readonly description?: string;

  // ===========================================================================
  // Capabilities
  // ===========================================================================

  /** Features supported by this plugin */
  readonly features: TemplatePluginFeatures;

  /** Configuration schema (Zod) */
  readonly configSchema?: z.ZodSchema;

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  /**
   * Initialize the plugin with context
   */
  initialize(context: TemplatePluginContext): Promise<void>;

  /**
   * Cleanup resources
   */
  dispose(): Promise<void>;

  // ===========================================================================
  // Core Transformation
  // ===========================================================================

  /**
   * Transform entire GenHAST tree to template output
   *
   * @param tree - GenHAST tree to transform
   * @returns Template output with content and metadata
   */
  transform(tree: GenRoot): Promise<TemplateOutput>;

  /**
   * Transform a single element
   *
   * @param element - Element to transform
   * @returns Transformed content
   */
  transformElement(element: GenElement): Promise<TransformResult>;

  // ===========================================================================
  // Annotation Renderers
  // ===========================================================================

  /**
   * Render loop construct
   *
   * @param loop - Loop annotation
   * @param content - Content inside the loop
   * @returns Template syntax for loop
   *
   * @example Liquid: {% for item in items %}...{% endfor %}
   * @example Twig: {% for item in items %}...{% endfor %}
   */
  renderLoop(loop: GenLoop, content: string): string;

  /**
   * Render conditional construct
   *
   * @param condition - Condition annotation
   * @param content - Content inside the condition
   * @returns Template syntax for condition
   *
   * @example Liquid: {% if condition %}...{% endif %}
   * @example Twig: {% if condition %}...{% endif %}
   */
  renderCondition(condition: GenCondition, content: string): string;

  /**
   * Render else/elseif branch
   *
   * @param condition - Condition (undefined for plain else)
   * @returns Template syntax for else/elseif
   */
  renderElse(condition?: string): string;

  /**
   * Render variable output
   *
   * @param variable - Variable annotation
   * @returns Template syntax for variable
   *
   * @example Liquid: {{ name | default: 'Guest' }}
   * @example Twig: {{ name ?? 'Guest' }}
   */
  renderVariable(variable: GenVariable): string;

  /**
   * Render slot placeholder
   *
   * @param slot - Slot annotation
   * @param defaultContent - Default content if slot is empty
   * @returns Template syntax for slot
   */
  renderSlot(slot: GenSlot, defaultContent: string): string;

  /**
   * Render include/partial
   *
   * @param include - Include annotation
   * @param childrenContent - Optional transformed children (React: <Component>{childrenContent}</Component>)
   * @returns Template syntax for include
   *
   * @example Liquid: {% include 'partial.liquid', prop: value %}
   * @example Twig: {% include 'partial.twig' with {prop: value} %}
   */
  renderInclude(include: GenInclude, childrenContent?: string): string;

  /**
   * Render block (for inheritance)
   *
   * @param block - Block annotation
   * @param content - Block content
   * @returns Template syntax for block
   */
  renderBlock(block: GenBlock, content: string): string;

  /**
   * Render extends (for inheritance)
   *
   * @param parent - Parent template path
   * @returns Template syntax for extends
   */
  renderExtends(parent: string): string;

  // ===========================================================================
  // HTML Rendering
  // ===========================================================================

  /**
   * Render opening tag
   *
   * @param tagName - HTML tag name
   * @param attributes - Tag attributes
   * @returns Opening tag string
   */
  renderOpeningTag(tagName: string, attributes: Record<string, unknown>): string;

  /**
   * Render closing tag
   *
   * @param tagName - HTML tag name
   * @returns Closing tag string
   */
  renderClosingTag(tagName: string): string;

  /**
   * Render self-closing tag
   *
   * @param tagName - HTML tag name
   * @param attributes - Tag attributes
   * @returns Self-closing tag string
   */
  renderSelfClosingTag(tagName: string, attributes: Record<string, unknown>): string;

  // ===========================================================================
  // Filter Support
  // ===========================================================================

  /**
   * Get filter mapping for this engine
   *
   * @param standardFilter - Standard filter name
   * @returns Engine-specific filter definition
   */
  getFilter(standardFilter: StandardFilter): FilterDefinition | undefined;

  /**
   * Apply filter to expression
   *
   * @param expression - Expression to filter
   * @param filter - Filter name
   * @param args - Filter arguments
   * @returns Filtered expression
   */
  applyFilter(expression: string, filter: string, args?: string[]): string;

  // ===========================================================================
  // Comments
  // ===========================================================================

  /**
   * Render template comment
   *
   * @param comment - Comment text
   * @returns Template comment syntax
   */
  renderComment(comment: string): string;

  // ===========================================================================
  // Validation
  // ===========================================================================

  /**
   * Validate generated output
   *
   * @param output - Generated template content
   * @returns Validation result
   */
  validate(output: string): { valid: boolean; errors?: string[] };
}

// =============================================================================
// Plugin Registration
// =============================================================================

/**
 * Plugin factory function type
 */
export type TemplatePluginFactory = (config?: Partial<TemplatePluginConfig>) => ITemplatePlugin;

/**
 * Plugin metadata for registry
 */
export interface TemplatePluginMetadata {
  name: string;
  version: string;
  runtime: 'js' | 'php';
  fileExtension: string;
  description?: string;
  author?: string;
  homepage?: string;
}
