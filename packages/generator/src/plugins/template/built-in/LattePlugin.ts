/**
 * LattePlugin - Template Plugin for Latte Template Engine
 *
 * Transforms GenHAST trees into Latte templates.
 * Latte is the default template engine for Nette Framework.
 *
 * @see https://latte.nette.org/
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
// LattePlugin Implementation
// =============================================================================

export class LattePlugin extends BasePlugin {
  // ===========================================================================
  // Identity
  // ===========================================================================

  readonly name = 'latte';
  readonly version = '1.0.0';
  readonly runtime = 'php' as const;
  readonly fileExtension = '.latte';
  readonly description = 'Latte template engine plugin for Nette Framework';

  // ===========================================================================
  // Features
  // ===========================================================================

  readonly features: TemplatePluginFeatures = {
    supportsInheritance: true, // layout/block
    supportsPartials: true, // include
    supportsFilters: true,
    supportsMacros: true,
    supportsAsync: false,
    supportsRaw: true, // |noescape
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
      ['currency', { name: 'number', formatArgs: (args) => `2, ',', ' '` }],
      ['number', { name: 'number' }],
      ['json', { name: 'json' }],
      ['escape', { name: 'escapeHtml' }],
      ['raw', { name: 'noescape' }],
      ['default', { name: 'default', formatArgs: (args) => `"${args[0]}"` }],
      ['first', { name: 'first' }],
      ['last', { name: 'last' }],
      ['length', { name: 'length' }],
      ['join', { name: 'implode', formatArgs: (args) => `"${args[0] || ', '}"` }],
      ['split', { name: 'explode', formatArgs: (args) => `"${args[0] || ','}"` }],
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
   * Latte supports n:attributes for cleaner syntax:
   * <div n:foreach="$items as $item">
   *
   * Or block syntax:
   * {foreach $items as $item}
   *   <div>{$item.name}</div>
   * {/foreach}
   */
  renderLoop(loop: GenLoop, content: string): string {
    const { item, collection, key, index } = loop;

    let forTag: string;

    if (key) {
      forTag = `{foreach $${collection} as $${key} => $${item}}`;
    } else {
      forTag = `{foreach $${collection} as $${item}}`;
    }

    return `${forTag}\n${content}\n{/foreach}`;
  }

  /**
   * Render conditional construct
   *
   * @example
   * {if $isActive}
   *   <span>Active</span>
   * {/if}
   */
  renderCondition(condition: GenCondition, content: string): string {
    const { expression, isElse, isElseIf } = condition;

    if (isElse) {
      return `{else}\n${content}`;
    }

    if (isElseIf) {
      return `{elseif ${this.formatExpression(expression)}}\n${content}`;
    }

    return `{if ${this.formatExpression(expression)}}\n${content}\n{/if}`;
  }

  /**
   * Render else/elseif
   */
  renderElse(condition?: string): string {
    if (condition) {
      return `{elseif ${this.formatExpression(condition)}}`;
    }
    return '{else}';
  }

  /**
   * Render variable output
   *
   * @example
   * {$title}
   * {$title ?? 'Default'}
   * {$title|upper}
   */
  renderVariable(variable: GenVariable): string {
    const { name, default: defaultValue, filter, filterArgs } = variable;

    let expr = `$${name}`;

    // Apply default using null coalescing
    if (defaultValue !== undefined) {
      expr = `${expr} ?? "${defaultValue}"`;
    }

    // Apply filter
    if (filter) {
      expr = this.applyFilter(expr, filter, filterArgs);
    }

    return `{${expr}}`;
  }

  /**
   * Render slot placeholder (using blocks)
   */
  renderSlot(slot: GenSlot, defaultContent: string): string {
    const { name } = slot;
    return `{block ${name}}${defaultContent}{/block}`;
  }

  /**
   * Render include/partial
   *
   * @example
   * {include 'partials/header.latte'}
   * {include 'partials/card.latte', title: $cardTitle}
   */
  renderInclude(include: GenInclude, _childrenContent?: string): string {
    const { partial, props } = include;

    // Add extension if not present
    const partialPath = partial.endsWith('.latte') ? partial : `${partial}.latte`;

    if (!props || Object.keys(props).length === 0) {
      return `{include '${partialPath}'}`;
    }

    // Format props
    const propsString = Object.entries(props)
      .map(([key, value]) => `${key}: $${value}`)
      .join(', ');

    return `{include '${partialPath}', ${propsString}}`;
  }

  /**
   * Render block
   */
  renderBlock(block: GenBlock, content: string): string {
    const { name } = block;
    return `{block ${name}}${content}{/block}`;
  }

  /**
   * Render extends (layout in Latte)
   */
  renderExtends(parent: string): string {
    const parentPath = parent.endsWith('.latte') ? parent : `${parent}.latte`;
    return `{layout '${parentPath}'}`;
  }

  /**
   * Render comment
   */
  renderComment(comment: string): string {
    return `{* ${comment} *}`;
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
      return `${expression}|${filterName}:${formattedArgs}`;
    }

    return `${expression}|${filterName}`;
  }

  // ===========================================================================
  // Validation
  // ===========================================================================

  override validate(output: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Check for balanced tags
    const blockOpens = output.match(/\{(if|foreach|block|define)\b/g) || [];
    const blockCloses = output.match(/\{\/(if|foreach|block|define)\}/g) || [];

    if (blockOpens.length !== blockCloses.length) {
      errors.push(`Unbalanced block tags: ${blockOpens.length} open, ${blockCloses.length} close`);
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
   * Format expression for Latte (PHP-like)
   */
  protected override formatExpression(expr: string): string {
    // Add $ prefix to variables if not present
    return expr
      .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\()/g, (match, p1) => {
        // Don't add $ to keywords
        const keywords = ['true', 'false', 'null', 'and', 'or', 'not', 'in', 'as'];
        if (keywords.includes(p1.toLowerCase())) {
          return p1;
        }
        // Don't add $ if already has it
        if (match.startsWith('$')) {
          return match;
        }
        return `$${p1}`;
      })
      .trim();
  }
}
