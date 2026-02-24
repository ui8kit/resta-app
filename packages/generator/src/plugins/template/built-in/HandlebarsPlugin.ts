/**
 * HandlebarsPlugin - Template Plugin for Handlebars Template Engine
 *
 * Transforms GenHAST trees into Handlebars templates.
 * Handlebars is commonly used with Express.js and static site generators.
 *
 * @see https://handlebarsjs.com/
 */

import { BasePlugin } from '../BasePlugin';
import type {
  TemplatePluginFeatures,
  FilterDefinition,
  StandardFilter,
} from '../ITemplatePlugin';
import type {
  GenLoop,
  GenCondition,
  GenVariable,
  GenSlot,
  GenInclude,
  GenBlock,
} from '../../../hast';

// =============================================================================
// HandlebarsPlugin Implementation
// =============================================================================

export class HandlebarsPlugin extends BasePlugin {
  // ===========================================================================
  // Identity
  // ===========================================================================

  readonly name = 'handlebars';
  readonly version = '1.0.0';
  readonly runtime = 'js' as const;
  readonly fileExtension = '.hbs';
  readonly description = 'Handlebars template engine plugin for Express.js and static sites';

  // ===========================================================================
  // Features
  // ===========================================================================

  readonly features: TemplatePluginFeatures = {
    supportsInheritance: true, // Via layouts
    supportsPartials: true,
    supportsFilters: true, // Via helpers
    supportsMacros: true, // Via helpers
    supportsAsync: false,
    supportsRaw: true,
    supportsComments: true,
  };

  // ===========================================================================
  // Filter Mappings (Handlebars uses helpers)
  // ===========================================================================

  protected override initializeFilterMappings(): void {
    // Handlebars uses helpers instead of filters
    // These are common helper names
    const mappings: Array<[StandardFilter, FilterDefinition]> = [
      ['uppercase', { name: 'uppercase' }],
      ['lowercase', { name: 'lowercase' }],
      ['capitalize', { name: 'capitalize' }],
      ['trim', { name: 'trim' }],
      ['date', { name: 'formatDate', formatArgs: (args) => `"${args[0] || 'YYYY-MM-DD'}"` }],
      ['currency', { name: 'formatCurrency' }],
      ['number', { name: 'formatNumber' }],
      ['json', { name: 'json' }],
      ['escape', { name: 'escape' }],
      ['raw', { name: 'raw' }],
      ['default', { name: 'default', formatArgs: (args) => `"${args[0]}"` }],
      ['first', { name: 'first' }],
      ['last', { name: 'last' }],
      ['length', { name: 'length' }],
      ['join', { name: 'join', formatArgs: (args) => `"${args[0] || ', '}"` }],
      ['split', { name: 'split', formatArgs: (args) => `"${args[0] || ','}"` }],
      ['reverse', { name: 'reverse' }],
      ['sort', { name: 'sort' }],
      ['slice', { name: 'slice', formatArgs: (args) => args.join(' ') }],
      ['truncate', { name: 'truncate', formatArgs: (args) => args[0] || '50' }],
    ];

    for (const [standard, definition] of mappings) {
      this.filterMappings.set(standard, definition);
    }
  }

  // ===========================================================================
  // Annotation Renderers
  // ===========================================================================

  /**
   * Render loop construct
   *
   * @example
   * {{#each items}}
   *   <div>{{this.name}}</div>
   * {{/each}}
   *
   * Or with named variable:
   * {{#each items as |item|}}
   *   <div>{{item.name}}</div>
   * {{/each}}
   */
  renderLoop(loop: GenLoop, content: string): string {
    const { item, collection, index } = loop;

    // Handlebars uses #each with optional block params
    let eachTag: string;
    if (index) {
      eachTag = `{{#each ${collection} as |${item} ${index}|}}`;
    } else {
      eachTag = `{{#each ${collection} as |${item}|}}`;
    }

    return `${eachTag}\n${content}\n{{/each}}`;
  }

  /**
   * Render conditional construct
   *
   * @example
   * {{#if isActive}}
   *   <span>Active</span>
   * {{/if}}
   */
  renderCondition(condition: GenCondition, content: string): string {
    const { expression, isElse, isElseIf } = condition;

    if (isElse) {
      return `{{else}}\n${content}`;
    }

    if (isElseIf) {
      return `{{else if ${this.formatExpression(expression)}}}\n${content}`;
    }

    return `{{#if ${this.formatExpression(expression)}}}\n${content}\n{{/if}}`;
  }

  /**
   * Render else/elseif
   */
  renderElse(condition?: string): string {
    if (condition) {
      return `{{else if ${this.formatExpression(condition)}}}`;
    }
    return '{{else}}';
  }

  /**
   * Render variable output
   *
   * @example
   * {{title}}
   * {{{rawHtml}}}
   * {{helper title "default"}}
   */
  renderVariable(variable: GenVariable): string {
    const { name, default: defaultValue, filter, filterArgs } = variable;

    // Apply filter (as helper)
    if (filter) {
      const mapping = this.filterMappings.get(filter as StandardFilter);
      const helperName = mapping?.name || filter;

      if (defaultValue !== undefined || (filterArgs && filterArgs.length > 0)) {
        const args = filterArgs ? filterArgs.join(' ') : '';
        const defArg = defaultValue ? `default="${defaultValue}"` : '';
        return `{{${helperName} ${name} ${args} ${defArg}}}`.replace(/\s+/g, ' ').trim().replace(/}}$/, '}}');
      }

      return `{{${helperName} ${name}}}`;
    }

    // With default value (using default helper)
    if (defaultValue !== undefined) {
      return `{{default ${name} "${defaultValue}"}}`;
    }

    // Simple variable
    return `{{${name}}}`;
  }

  /**
   * Render slot placeholder (using partials with context)
   */
  renderSlot(slot: GenSlot, defaultContent: string): string {
    const { name } = slot;

    if (defaultContent.trim()) {
      return `{{#if @partial-block}}{{> @partial-block}}{{else}}${defaultContent}{{/if}}`;
    }

    // Render partial block if available
    return `{{> ${name}}}`;
  }

  /**
   * Render include/partial
   *
   * @example
   * {{> header}}
   * {{> card title=cardTitle image=cardImage}}
   */
  renderInclude(include: GenInclude, _childrenContent?: string): string {
    const { partial, props } = include;

    // Remove extension if present
    const partialName = partial.replace(/\.hbs$/, '').replace(/\//g, '/');

    if (!props || Object.keys(props).length === 0) {
      return `{{> ${partialName}}}`;
    }

    // Format props
    const propsString = Object.entries(props)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    return `{{> ${partialName} ${propsString}}}`;
  }

  /**
   * Render block (inline partial definition)
   */
  renderBlock(block: GenBlock, content: string): string {
    const { name } = block;
    return `{{#*inline "${name}"}}${content}{{/inline}}`;
  }

  /**
   * Render extends (layout pattern)
   */
  renderExtends(parent: string): string {
    // Handlebars uses layout pattern via helpers or manually
    return `{{!-- layout: ${parent} --}}`;
  }

  /**
   * Render comment
   */
  renderComment(comment: string): string {
    return `{{!-- ${comment} --}}`;
  }

  // ===========================================================================
  // Filter Application (as Helpers)
  // ===========================================================================

  override applyFilter(expression: string, filter: string, args?: string[]): string {
    const mapping = this.filterMappings.get(filter as StandardFilter);
    const helperName = mapping?.name || filter;

    if (args && args.length > 0) {
      const formattedArgs = mapping?.formatArgs
        ? mapping.formatArgs(args)
        : args.join(' ');
      return `(${helperName} ${expression} ${formattedArgs})`;
    }

    return `(${helperName} ${expression})`;
  }

  // ===========================================================================
  // Validation
  // ===========================================================================

  override validate(output: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Check for balanced block helpers
    const blockOpens = output.match(/\{\{#(if|each|unless|with)\b/g) || [];
    const blockCloses = output.match(/\{\{\/(if|each|unless|with)\}\}/g) || [];

    if (blockOpens.length !== blockCloses.length) {
      errors.push(`Unbalanced block helpers: ${blockOpens.length} open, ${blockCloses.length} close`);
    }

    // Check for unclosed mustaches
    const opens = (output.match(/\{\{(?!\{)/g) || []).length;
    const closes = (output.match(/(?<!\})\}\}/g) || []).length;

    if (opens !== closes) {
      errors.push(`Unbalanced mustaches: ${opens} {{ vs ${closes} }}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Format expression for Handlebars
   */
  protected override formatExpression(expr: string): string {
    // Handlebars conditions are simpler - just the variable
    // Complex expressions need subexpressions
    return expr
      .replace(/\s*===?\s*/g, ' ')
      .replace(/\s*!==?\s*/g, ' ')
      .trim();
  }
}
