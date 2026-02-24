/**
 * TwigPlugin - Template Plugin for Twig Template Engine
 *
 * Transforms GenHAST trees into Twig templates.
 * Twig is the default template engine for Symfony and is also used standalone.
 *
 * @see https://twig.symfony.com/
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
// TwigPlugin Implementation
// =============================================================================

export class TwigPlugin extends BasePlugin {
  // ===========================================================================
  // Identity
  // ===========================================================================

  readonly name = 'twig';
  readonly version = '1.0.0';
  readonly runtime = 'php' as const;
  readonly fileExtension = '.twig';
  readonly description = 'Twig template engine plugin for Symfony and PHP applications';

  // ===========================================================================
  // Features
  // ===========================================================================

  readonly features: TemplatePluginFeatures = {
    supportsInheritance: true, // extends/block
    supportsPartials: true, // include
    supportsFilters: true,
    supportsMacros: true,
    supportsAsync: false,
    supportsRaw: true,
    supportsComments: true,
  };

  // ===========================================================================
  // Filter Mappings
  // ===========================================================================

  protected override initializeFilterMappings(): void {
    const mappings: Array<[StandardFilter, FilterDefinition]> = [
      ['uppercase', { name: 'upper' }],
      ['lowercase', { name: 'lower' }],
      ['capitalize', { name: 'capitalize' }],
      ['trim', { name: 'trim' }],
      ['date', { name: 'date', formatArgs: (args) => `"${args[0] || 'Y-m-d'}"` }],
      ['currency', { name: 'format_currency', formatArgs: (args) => `"${args[0] || 'USD'}"` }],
      ['number', { name: 'number_format' }],
      ['json', { name: 'json_encode' }],
      ['escape', { name: 'e' }],
      ['raw', { name: 'raw' }],
      ['default', { name: 'default', formatArgs: (args) => `"${args[0]}"` }],
      ['first', { name: 'first' }],
      ['last', { name: 'last' }],
      ['length', { name: 'length' }],
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
    const { item, collection, key, index } = loop;

    let forTag: string;

    if (key && index) {
      forTag = `{% for ${key}, ${item} in ${collection} %}`;
    } else if (index) {
      forTag = `{% for ${item} in ${collection} %}`;
    } else {
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
      return `{% elseif ${this.formatExpression(expression)} %}\n${content}`;
    }

    return `{% if ${this.formatExpression(expression)} %}\n${content}\n{% endif %}`;
  }

  /**
   * Render else/elseif
   */
  renderElse(condition?: string): string {
    if (condition) {
      return `{% elseif ${this.formatExpression(condition)} %}`;
    }
    return '{% else %}';
  }

  /**
   * Render variable output
   *
   * @example
   * {{ title }}
   * {{ title ?? 'Default' }}
   * {{ title|upper }}
   */
  renderVariable(variable: GenVariable): string {
    const { name, default: defaultValue, filter, filterArgs } = variable;

    let expr = name;

    // Apply default using null coalescing
    if (defaultValue !== undefined) {
      expr = `${expr} ?? "${defaultValue}"`;
    }

    // Apply filter
    if (filter) {
      expr = this.applyFilter(expr, filter, filterArgs);
    }

    return `{{ ${expr} }}`;
  }

  /**
   * Render slot placeholder (using blocks)
   */
  renderSlot(slot: GenSlot, defaultContent: string): string {
    const { name } = slot;
    return `{% block ${name} %}${defaultContent}{% endblock %}`;
  }

  /**
   * Render include/partial
   *
   * @example
   * {% include 'partials/header.twig' %}
   * {% include 'partials/card.twig' with {title: cardTitle} %}
   */
  renderInclude(include: GenInclude, _childrenContent?: string): string {
    const { partial, props } = include;

    // Add extension if not present
    const partialPath = partial.endsWith('.twig') ? partial : `${partial}.twig`;

    if (!props || Object.keys(props).length === 0) {
      return `{% include '${partialPath}' %}`;
    }

    // Format props as Twig hash
    const propsString = Object.entries(props)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return `{% include '${partialPath}' with {${propsString}} %}`;
  }

  /**
   * Render block
   */
  renderBlock(block: GenBlock, content: string): string {
    const { name } = block;
    return `{% block ${name} %}${content}{% endblock %}`;
  }

  /**
   * Render extends
   */
  renderExtends(parent: string): string {
    const parentPath = parent.endsWith('.twig') ? parent : `${parent}.twig`;
    return `{% extends '${parentPath}' %}`;
  }

  /**
   * Render comment
   */
  renderComment(comment: string): string {
    return `{# ${comment} #}`;
  }

  // ===========================================================================
  // Filter Application
  // ===========================================================================

  override applyFilter(expression: string, filter: string, args?: string[]): string {
    const mapping = this.filterMappings.get(filter as StandardFilter);
    const filterName = mapping?.name || filter;

    if (args && args.length > 0) {
      const formattedArgs = mapping?.formatArgs
        ? mapping.formatArgs(args)
        : args.join(', ');
      return `${expression}|${filterName}(${formattedArgs})`;
    }

    return `${expression}|${filterName}`;
  }

  // ===========================================================================
  // Validation
  // ===========================================================================

  override validate(output: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Check for balanced tags
    const blockOpens = output.match(/\{%\s*(if|for|block|macro)\b/g) || [];
    const blockCloses = output.match(/\{%\s*end(if|for|block|macro)\s*%\}/g) || [];

    if (blockOpens.length !== blockCloses.length) {
      errors.push(`Unbalanced block tags: ${blockOpens.length} open, ${blockCloses.length} close`);
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
   * Format expression for Twig
   */
  protected override formatExpression(expr: string): string {
    return expr
      // Twig uses 'and' and 'or' like Python
      .replace(/\s*&&\s*/g, ' and ')
      .replace(/\s*\|\|\s*/g, ' or ')
      // Twig uses 'not' for negation
      .replace(/!\s*(?=\w)/g, 'not ')
      // Keep == and != as-is (Twig supports them)
      .trim();
  }
}
