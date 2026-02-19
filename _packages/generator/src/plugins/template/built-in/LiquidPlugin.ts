/**
 * LiquidPlugin - Template Plugin for Liquid Template Engine
 *
 * Transforms GenHAST trees into Liquid templates.
 * Liquid is commonly used with Jekyll, Shopify, and Eleventy.
 *
 * @see https://liquidjs.com/
 * @see https://shopify.github.io/liquid/
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
// LiquidPlugin Implementation
// =============================================================================

export class LiquidPlugin extends BasePlugin {
  // ===========================================================================
  // Identity
  // ===========================================================================

  readonly name = 'liquid';
  readonly version = '1.0.0';
  readonly runtime = 'js' as const;
  readonly fileExtension = '.liquid';
  readonly description = 'Liquid template engine plugin for Shopify, Jekyll, and Eleventy';

  // ===========================================================================
  // Features
  // ===========================================================================

  readonly features: TemplatePluginFeatures = {
    supportsInheritance: false, // Liquid uses include, not extends
    supportsPartials: true,
    supportsFilters: true,
    supportsMacros: false,
    supportsAsync: true,
    supportsRaw: true,
    supportsComments: true,
  };

  // ===========================================================================
  // Filter Mappings
  // ===========================================================================

  protected override initializeFilterMappings(): void {
    const mappings: Array<[StandardFilter, FilterDefinition]> = [
      ['uppercase', { name: 'upcase' }],
      ['lowercase', { name: 'downcase' }],
      ['capitalize', { name: 'capitalize' }],
      ['trim', { name: 'strip' }],
      ['date', { name: 'date', formatArgs: (args) => `"${args[0] || '%Y-%m-%d'}"` }],
      ['currency', { name: 'money' }],
      ['number', { name: 'round' }],
      ['json', { name: 'json' }],
      ['escape', { name: 'escape' }],
      ['raw', { name: 'raw' }],
      ['default', { name: 'default', formatArgs: (args) => args[0] }],
      ['first', { name: 'first' }],
      ['last', { name: 'last' }],
      ['length', { name: 'size' }],
      ['join', { name: 'join', formatArgs: (args) => `"${args[0] || ', '}"` }],
      ['split', { name: 'split', formatArgs: (args) => `"${args[0] || ','}"` }],
      ['reverse', { name: 'reverse' }],
      ['sort', { name: 'sort' }],
      ['slice', { name: 'slice', formatArgs: (args) => args.join(', ') }],
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
   * {% for item in items %}
   *   <div>{{ item.name }}</div>
   * {% endfor %}
   */
  renderLoop(loop: GenLoop, content: string): string {
    const { item, collection, key } = loop;

    let forTag = `{% for ${item} in ${collection} %}`;

    // Add limit/offset if specified via key (advanced usage)
    if (key) {
      forTag = `{% for ${item} in ${collection} %}`;
    }

    return `${forTag}\n${content}\n{% endfor %}`;
  }

  /**
   * Render conditional construct
   *
   * @example
   * {% if isActive %}
   *   <span>Active</span>
   * {% endif %}
   */
  renderCondition(condition: GenCondition, content: string): string {
    const { expression, isElse, isElseIf } = condition;

    if (isElse) {
      return `{% else %}\n${content}`;
    }

    if (isElseIf) {
      return `{% elsif ${this.formatExpression(expression)} %}\n${content}`;
    }

    return `{% if ${this.formatExpression(expression)} %}\n${content}\n{% endif %}`;
  }

  /**
   * Render else/elseif
   */
  renderElse(condition?: string): string {
    if (condition) {
      return `{% elsif ${this.formatExpression(condition)} %}`;
    }
    return '{% else %}';
  }

  /**
   * Render variable output
   *
   * @example
   * {{ title | default: "Untitled" }}
   * {{ price | money }}
   */
  renderVariable(variable: GenVariable): string {
    const { name, default: defaultValue, filter, filterArgs } = variable;

    let expr = name;

    // Apply default
    if (defaultValue !== undefined) {
      expr = `${expr} | default: ${this.formatValue(defaultValue)}`;
    }

    // Apply filter
    if (filter) {
      expr = this.applyFilter(expr, filter, filterArgs);
    }

    return `{{ ${expr} }}`;
  }

  /**
   * Render slot placeholder
   *
   * Liquid doesn't have native blocks, so we use a variable pattern:
   * - If slot_content exists, render it
   * - Otherwise, render default content
   */
  renderSlot(slot: GenSlot, defaultContent: string): string {
    const { name } = slot;
    const slotVar = `${name}_content`;

    if (defaultContent.trim()) {
      return `{% if ${slotVar} %}{{ ${slotVar} }}{% else %}${defaultContent}{% endif %}`;
    }

    return `{{ ${slotVar} }}`;
  }

  /**
   * Render include/partial
   *
   * @example
   * {% include 'partials/header.liquid' %}
   * {% include 'partials/card.liquid', title: cardTitle, image: cardImage %}
   */
  renderInclude(include: GenInclude, _childrenContent?: string): string {
    const { partial, props } = include;

    // Add extension if not present
    const partialPath = partial.endsWith('.liquid') ? partial : `${partial}.liquid`;

    if (!props || Object.keys(props).length === 0) {
      return `{% include '${partialPath}' %}`;
    }

    // Format props
    const propsString = Object.entries(props)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return `{% include '${partialPath}', ${propsString} %}`;
  }

  /**
   * Render block (Liquid uses capture for similar functionality)
   */
  renderBlock(block: GenBlock, content: string): string {
    const { name } = block;
    return `{% capture ${name} %}${content}{% endcapture %}`;
  }

  /**
   * Render extends (not supported in standard Liquid)
   */
  renderExtends(parent: string): string {
    this.addWarning('Liquid does not support template inheritance (extends). Use includes instead.');
    return `{# extends '${parent}' - not supported in Liquid #}`;
  }

  /**
   * Render comment
   */
  renderComment(comment: string): string {
    return `{% comment %}${comment}{% endcomment %}`;
  }

  // ===========================================================================
  // Filter Application
  // ===========================================================================

  override applyFilter(expression: string, filter: string, args?: string[]): string {
    // Check if it's a standard filter with mapping
    const standardFilter = filter as StandardFilter;
    const mapping = this.filterMappings.get(standardFilter);

    if (mapping) {
      const filterName = mapping.name;
      if (args && args.length > 0 && mapping.formatArgs) {
        return `${expression} | ${filterName}: ${mapping.formatArgs(args)}`;
      }
      return `${expression} | ${filterName}`;
    }

    // Use filter as-is
    if (args && args.length > 0) {
      return `${expression} | ${filter}: ${args.join(', ')}`;
    }
    return `${expression} | ${filter}`;
  }

  // ===========================================================================
  // Validation
  // ===========================================================================

  override validate(output: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Check for balanced tags
    const openTags = (output.match(/\{%\s*(if|for|unless|case|capture)\b/g) || []).length;
    const closeTags = (output.match(/\{%\s*end(if|for|unless|case|capture)\s*%\}/g) || []).length;

    if (openTags !== closeTags) {
      errors.push(`Unbalanced control tags: ${openTags} open, ${closeTags} close`);
    }

    // Check for unclosed output tags
    const outputOpens = (output.match(/\{\{/g) || []).length;
    const outputCloses = (output.match(/\}\}/g) || []).length;

    if (outputOpens !== outputCloses) {
      errors.push(`Unbalanced output tags: ${outputOpens} {{ vs ${outputCloses} }}`);
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
   * Format expression for Liquid (convert JS-style to Liquid-style)
   */
  protected override formatExpression(expr: string): string {
    return expr
      // Convert && to and
      .replace(/\s*&&\s*/g, ' and ')
      // Convert || to or
      .replace(/\s*\|\|\s*/g, ' or ')
      // Convert ! to not (at word boundaries)
      .replace(/!\s*(?=\w)/g, 'not ')
      // Convert === to ==
      .replace(/===/g, '==')
      // Convert !== to !=
      .replace(/!==/g, '!=')
      // Keep other expressions as-is
      .trim();
  }

  /**
   * Format value for Liquid (always quote string literals)
   */
  private formatValue(value: string): string {
    // Always quote the default value as a string literal
    return `"${value}"`;
  }
}
