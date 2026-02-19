/**
 * BasePlugin - Abstract Base Class for Template Plugins
 *
 * Provides common functionality for template plugins.
 * Plugins extend this class and implement engine-specific methods.
 */

import type {
  ITemplatePlugin,
  TemplatePluginFeatures,
  TemplatePluginContext,
  TemplatePluginConfig,
  TransformResult,
  FilterDefinition,
  StandardFilter,
} from './ITemplatePlugin';

import type {
  GenRoot,
  GenElement,
  GenChild,
  TemplateOutput,
  GenLoop,
  GenCondition,
  GenVariable,
  GenSlot,
  GenInclude,
  GenBlock,
} from '../../hast';

import {
  isElement,
  isText,
  isComment,
  getAnnotations,
  collectVariables,
  collectDependencies,
} from '../../hast';

// =============================================================================
// Self-Closing Tags
// =============================================================================

const SELF_CLOSING_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// =============================================================================
// BasePlugin Abstract Class
// =============================================================================

/**
 * Abstract base class for template plugins
 */
export abstract class BasePlugin implements ITemplatePlugin {
  // ===========================================================================
  // Abstract Properties (must be implemented by subclasses)
  // ===========================================================================

  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly runtime: 'js' | 'php';
  abstract readonly fileExtension: string;
  abstract readonly description?: string;
  abstract readonly features: TemplatePluginFeatures;

  // ===========================================================================
  // Protected State
  // ===========================================================================

  protected context!: TemplatePluginContext;
  protected config!: TemplatePluginConfig;
  protected indent: string = '  ';
  protected currentDepth: number = 0;
  protected warnings: string[] = [];

  /** Filter mappings for this engine */
  protected filterMappings: Map<StandardFilter, FilterDefinition> = new Map();

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  async initialize(context: TemplatePluginContext): Promise<void> {
    this.context = context;
    this.config = context.config;
    this.indent = context.config.indent ?? '  ';
    this.initializeFilterMappings();
  }

  async dispose(): Promise<void> {
    this.warnings = [];
    this.currentDepth = 0;
  }

  /**
   * Initialize filter mappings (override in subclass)
   */
  protected initializeFilterMappings(): void {
    // Default mappings - subclasses should override
  }

  // ===========================================================================
  // Core Transformation
  // ===========================================================================

  async transform(tree: GenRoot): Promise<TemplateOutput> {
    this.warnings = [];
    this.currentDepth = 0;

    // Transform children
    const content = await this.transformChildren(tree.children);

    return {
      filename: this.getOutputFilename(tree),
      content: this.formatOutput(content),
      variables: collectVariables(tree),
      dependencies: collectDependencies(tree),
      warnings: this.warnings.length > 0 ? this.warnings : undefined,
    };
  }

  async transformElement(element: GenElement): Promise<TransformResult> {
    const content = await this.processElement(element);
    return {
      content,
      warnings: this.warnings.length > 0 ? [...this.warnings] : undefined,
    };
  }

  /**
   * Transform array of children
   */
  protected async transformChildren(children: GenChild[]): Promise<string> {
    const results: string[] = [];

    for (const child of children) {
      if (isElement(child)) {
        results.push(await this.processElement(child));
      } else if (isText(child)) {
        results.push(child.value);
      } else if (isComment(child)) {
        results.push(this.renderComment(child.value));
      }
    }

    return results.join('');
  }

  /**
   * Process a single element with its annotations
   */
  protected async processElement(element: GenElement): Promise<string> {
    const annotations = getAnnotations(element);

    // For unwrapped elements, only render children (skip the wrapper tag).
    // This avoids generating extra <div> wrappers from DSL annotation nodes.
    let content: string;
    if (annotations?.unwrap) {
      // Variable and include annotations don't need children content
      if (annotations.variable || annotations.include) {
        content = '';
      } else {
        content = await this.transformChildren(element.children);
      }
    } else {
      content = await this.renderElementContent(element);
    }

    // Apply annotations in order
    if (annotations) {
      // Condition wrapping
      if (annotations.condition) {
        content = this.renderCondition(annotations.condition, content);
      }

      // Loop wrapping
      if (annotations.loop) {
        content = this.renderLoop(annotations.loop, content);
      }

      // Variable replacement
      if (annotations.variable) {
        content = this.renderVariable(annotations.variable);
      }

      // Include replacement (pass transformed children when present for React <Comp>{children}</Comp>)
      if (annotations.include) {
        const includeChildren =
          element.children.length > 0 ? await this.transformChildren(element.children) : undefined;
        content = this.renderInclude(annotations.include, includeChildren);
      }

      // Slot handling
      if (annotations.slot) {
        content = this.renderSlot(annotations.slot, content);
      }

      // Block wrapping
      if (annotations.block) {
        content = this.renderBlock(annotations.block, content);
      }

      // Unwrap: return content without wrapping element tag
      if (annotations.unwrap) {
        return content;
      }
    }

    return content;
  }

  /**
   * Render element content (tag + children)
   */
  protected async renderElementContent(element: GenElement): Promise<string> {
    const { tagName, properties, children } = element;
    const annotations = getAnnotations(element);

    // Skip rendering if this is purely an annotation node
    if (annotations?.variable || annotations?.include) {
      return '';
    }

    // Get attributes (exclude _gen)
    const attributes = this.getHtmlAttributes(properties);

    // Self-closing tag
    if (SELF_CLOSING_TAGS.has(tagName) && children.length === 0) {
      return this.renderSelfClosingTag(tagName, attributes);
    }

    // Regular tag
    const opening = this.renderOpeningTag(tagName, attributes);
    const closing = this.renderClosingTag(tagName);
    const childContent = await this.transformChildren(children);

    return `${opening}${childContent}${closing}`;
  }

  // ===========================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ===========================================================================

  abstract renderLoop(loop: GenLoop, content: string): string;
  abstract renderCondition(condition: GenCondition, content: string): string;
  abstract renderElse(condition?: string): string;
  abstract renderVariable(variable: GenVariable): string;
  abstract renderSlot(slot: GenSlot, defaultContent: string): string;
  abstract renderInclude(include: GenInclude, childrenContent?: string): string;
  abstract renderBlock(block: GenBlock, content: string): string;
  abstract renderExtends(parent: string): string;
  abstract renderComment(comment: string): string;

  // ===========================================================================
  // HTML Rendering (default implementation)
  // ===========================================================================

  renderOpeningTag(tagName: string, attributes: Record<string, unknown>): string {
    const attrString = this.formatAttributes(attributes);
    return attrString ? `<${tagName} ${attrString}>` : `<${tagName}>`;
  }

  renderClosingTag(tagName: string): string {
    return `</${tagName}>`;
  }

  renderSelfClosingTag(tagName: string, attributes: Record<string, unknown>): string {
    const attrString = this.formatAttributes(attributes);
    return attrString ? `<${tagName} ${attrString} />` : `<${tagName} />`;
  }

  // ===========================================================================
  // Filter Support
  // ===========================================================================

  getFilter(standardFilter: StandardFilter): FilterDefinition | undefined {
    return this.filterMappings.get(standardFilter);
  }

  applyFilter(expression: string, filter: string, args?: string[]): string {
    // Default pipe syntax - override in subclass if different
    if (args && args.length > 0) {
      return `${expression} | ${filter}: ${args.join(', ')}`;
    }
    return `${expression} | ${filter}`;
  }

  // ===========================================================================
  // Validation
  // ===========================================================================

  validate(output: string): { valid: boolean; errors?: string[] } {
    // Basic validation - subclasses can override for specific syntax
    const errors: string[] = [];

    if (!output || output.trim().length === 0) {
      errors.push('Output is empty');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Get output filename based on metadata
   */
  protected getOutputFilename(tree: GenRoot): string {
    const componentName = tree.meta?.componentName ?? 'template';
    const baseName = this.toKebabCase(componentName);
    return `${baseName}${this.fileExtension}`;
  }

  /**
   * Extract HTML attributes from properties (exclude _gen)
   */
  protected getHtmlAttributes(properties: GenElement['properties']): Record<string, unknown> {
    const attributes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (key === '_gen') continue; // Skip generator annotations

      if (key === 'className' && Array.isArray(value)) {
        attributes['class'] = value.join(' ');
      } else if (key === 'style' && typeof value === 'object' && value !== null && !('__expression' in (value as object))) {
        attributes['style'] = this.formatStyleObject(value as Record<string, string>);
      } else {
        attributes[key] = value;
      }
    }

    return attributes;
  }

  /**
   * Format attributes object to string
   */
  protected formatAttributes(attributes: Record<string, unknown>): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(attributes)) {
      if (value === true) {
        parts.push(key);
      } else if (value !== false && value !== undefined && value !== null) {
        // Dynamic expression: use engine-specific expression syntax
        if (typeof value === 'object' && value !== null && '__expression' in (value as object)) {
          const expr = (value as { __expression: string }).__expression;
          parts.push(`${key}="${this.formatExpression(expr)}"`);
        } else {
          const escaped = this.escapeAttributeValue(String(value));
          parts.push(`${key}="${escaped}"`);
        }
      }
    }

    return parts.join(' ');
  }

  /**
   * Format style object to CSS string
   */
  protected formatStyleObject(style: Record<string, string>): string {
    return Object.entries(style)
      .map(([prop, value]) => `${this.toKebabCase(prop)}: ${value}`)
      .join('; ');
  }

  /**
   * Escape attribute value
   */
  protected escapeAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Convert to kebab-case
   */
  protected toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Get current indentation string
   */
  protected getIndent(): string {
    return this.indent.repeat(this.currentDepth);
  }

  /**
   * Format output (pretty print if enabled)
   */
  protected formatOutput(content: string): string {
    if (this.config.prettyPrint) {
      return this.prettyPrint(content);
    }
    return content;
  }

  /**
   * Pretty print content (basic implementation)
   */
  protected prettyPrint(content: string): string {
    // Basic pretty printing - subclasses can override
    return content.trim() + '\n';
  }

  /**
   * Add warning message
   */
  protected addWarning(message: string): void {
    this.warnings.push(message);
    this.context.logger.warn(`[${this.name}] ${message}`);
  }

  /**
   * Format expression for template engine
   */
  protected formatExpression(expr: string): string {
    return expr;
  }
}
