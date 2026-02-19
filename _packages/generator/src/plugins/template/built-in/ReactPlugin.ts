/**
 * ReactPlugin - Template Plugin for React JSX Output
 *
 * Transforms GenHAST trees into React JSX markup.
 * Fifth official template plugin alongside Liquid, Handlebars, Twig, and Latte.
 *
 * DSL → React transformation rules:
 * - Var       → {value} or {value ?? "default"}
 * - If        → {condition ? (<>content</>) : null}
 * - If/Else   → {condition ? (<>ifContent</>) : (<>elseContent</>)}
 * - If/ElseIf → IIFE {(() => { if (c1) return ...; if (c2) return ...; return null; })()}
 * - Loop      → {collection.map((item, index) => (<Fragment key=...>content</Fragment>))}
 * - Slot      → {name ?? (<>default</>)} or {children}
 * - Include   → <ComponentName prop={value} />
 *
 * @see https://react.dev/
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
  GenElement,
  GenSourceImport,
} from '../../../hast';
import { collectVariables, collectDependencies } from '../../../hast';

// =============================================================================
// Branch Markers
// =============================================================================

/**
 * Internal markers for condition branch detection.
 * Used to communicate between renderCondition calls
 * (else/elseif branches → parent if block).
 */
const MARKERS = {
  ELSE: '___REACT_ELSE___',
  ELSEIF: '___REACT_ELSEIF___',
  SEP: '___REACT_SEP___',
  END: '___REACT_END___',
} as const;

// =============================================================================
// ReactPlugin Implementation
// =============================================================================

export class ReactPlugin extends BasePlugin {
  // ===========================================================================
  // Identity
  // ===========================================================================

  readonly name = 'react';
  readonly version = '1.0.0';
  readonly runtime = 'js' as const;
  readonly fileExtension = '.tsx';
  readonly description = 'React JSX template plugin for UI8Kit';

  // ===========================================================================
  // Features
  // ===========================================================================

  readonly features: TemplatePluginFeatures = {
    supportsInheritance: false,
    supportsPartials: true,
    supportsFilters: false, // React uses JS expressions, not template filters
    supportsMacros: false,
    supportsAsync: true,
    supportsRaw: true,
    supportsComments: true,
  };

  // ===========================================================================
  // Filter Mappings (React uses native JS methods)
  // ===========================================================================

  protected override initializeFilterMappings(): void {
    // React doesn't use template filters.
  }

  // ===========================================================================
  // Full-File Transformation (imports + export function)
  // ===========================================================================

  /**
   * Override: when tree.meta.imports is present, emit full .tsx file
   * (import block + export function) for use in apps; otherwise JSX body only.
   */
  async transform(tree: import('../../../hast').GenRoot): Promise<import('../../../hast').TemplateOutput> {
    this.warnings = [];
    this.currentDepth = 0;

    const content = await this.transformChildren(tree.children);
    const formattedJsx = this.formatOutput(content);
    const componentName = tree.meta?.componentName ?? 'Template';
    const imports = tree.meta?.imports;

    if (imports && imports.length > 0) {
      const needsFragment = formattedJsx.includes('<Fragment') || formattedJsx.includes('</Fragment>');
      const importsWithFragment = needsFragment ? this.ensureFragmentImport(imports) : imports;
      let importBlock = this.emitImportBlock(importsWithFragment);
      const bodyIndented = formattedJsx
        .split('\n')
        .map((line) => (line.trim() ? '    ' + line : ''))
        .join('\n')
        .trimEnd();
      const propNames = this.getEmittedPropNames(tree);

      // Build typed signature when prop types are available from source
      const propsInterface = this.buildPropsInterface(componentName, tree.meta?.props ?? [], propNames);
      const preamble = tree.meta?.preamble ?? [];
      const preambleBlock = preamble.length > 0 ? preamble.map((s) => '  ' + s).join('\n') + '\n\n' : '';
      const sig = propNames.length > 0
        ? `(props: ${componentName}Props) {\n  const { ${propNames.join(', ')} } = props;\n\n${preambleBlock}`
        : `() {\n${preambleBlock}`;

      const fullContent =
        importBlock +
        '\n\n' +
        (propsInterface ? propsInterface + '\n\n' : '') +
        `export function ${componentName}${sig}` +
        '  return (\n' +
        (bodyIndented ? bodyIndented + '\n' : '') +
        '  );\n' +
        '}\n';
      return {
        filename: `${componentName}${this.fileExtension}`,
        content: fullContent,
        variables: collectVariables(tree),
        dependencies: collectDependencies(tree),
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
      };
    }

    return {
      filename: this.getOutputFilename(tree),
      content: formattedJsx,
      variables: collectVariables(tree),
      dependencies: collectDependencies(tree),
      warnings: this.warnings.length > 0 ? this.warnings : undefined,
    };
  }

  /** Valid JS identifier for destructuring (avoids emitting JSX or expressions as prop names). */
  private static readonly VALID_PROP_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  /**
   * Prop names to emit in the function signature (destructured from props).
   * Uses only tree.meta.props (from function signature). No variable-based inference.
   * Only emits valid JavaScript identifiers so "copy-paste" output never has invalid destructuring.
   */
  private getEmittedPropNames(tree: import('../../../hast').GenRoot): string[] {
    const fromMeta = tree.meta?.props?.map((p) => p.name).filter((n) => ReactPlugin.VALID_PROP_NAME.test(n));
    return fromMeta ?? [];
  }

  /**
   * Ensure Fragment is in react imports when output uses Loop.
   * Adds Fragment to existing runtime react import, or creates a new one (keeps type-only imports separate).
   */
  private ensureFragmentImport(imports: GenSourceImport[]): GenSourceImport[] {
    const reactRuntimeIdx = imports.findIndex((i) => i.source === 'react' && !i.isTypeOnly);
    if (reactRuntimeIdx >= 0) {
      const imp = imports[reactRuntimeIdx];
      if (!imp.namedImports.includes('Fragment')) {
        const updated = [...imports];
        updated[reactRuntimeIdx] = {
          ...imp,
          namedImports: [...imp.namedImports, 'Fragment'],
        };
        return updated;
      }
      return imports;
    }
    // No runtime react import: add Fragment (type-only imports stay separate)
    return [...imports, { source: 'react', namedImports: ['Fragment'], isTypeOnly: false }];
  }

  /** TS primitives and well-known types that don't need imports. */
  private static readonly SAFE_TYPES = new Set([
    'string', 'number', 'boolean', 'any', 'unknown', 'void', 'never', 'null', 'undefined',
    'ReactNode', 'ReactElement', 'JSX.Element', 'React.ReactNode', 'React.ReactElement',
    'Record', 'Array', 'Promise', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit',
  ]);

  /**
   * Build a TypeScript props interface from extracted prop definitions.
   * Replaces undefined/external type references with `any` so the output compiles standalone.
   */
  private buildPropsInterface(
    componentName: string,
    propDefs: import('../../../hast').GenPropDefinition[],
    emittedNames: string[],
  ): string {
    if (emittedNames.length === 0) return '';

    // Build a lookup from full prop definitions (may include type info)
    const defMap = new Map(propDefs.map((p) => [p.name, p]));

    const lines: string[] = [];
    lines.push(`interface ${componentName}Props {`);
    for (const name of emittedNames) {
      const def = defMap.get(name);
      let tsType = def && def.type !== 'unknown' ? def.type : 'any';
      tsType = this.sanitizePropType(tsType);
      const optional = def ? !def.required : true;
      lines.push(`  ${name}${optional ? '?' : ''}: ${tsType};`);
    }
    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Ensure a TS type string is safe for standalone output.
   * Replaces unknown type references (NavItem[], LayoutMode, etc.) with `any`.
   * Keeps primitives, ReactNode, generic wrappers, and inline object/union types.
   */
  private sanitizePropType(tsType: string): string {
    // Remove trailing [] to check the base type, then re-add
    const isArray = tsType.endsWith('[]');
    const base = isArray ? tsType.slice(0, -2) : tsType;

    // Inline types (unions, objects, tuples) are kept as-is
    if (/[|&{}<>()]/.test(base)) return tsType;

    // Primitives and well-known types
    if (ReactPlugin.SAFE_TYPES.has(base)) return tsType;

    // String literal types like 'full' | 'sidebar-left'
    if (/^['"]/.test(base.trim())) return tsType;

    // Unknown external type reference → replace with any
    return isArray ? 'any[]' : 'any';
  }

  /**
   * Emit import statements from source (React-only; other engines ignore meta.imports).
   * Emits type-only imports (e.g. ReactNode) for props interface; emits Fragment when Loop is used.
   */
  private emitImportBlock(imports: GenSourceImport[]): string {
    const lines: string[] = [];
    for (const imp of imports) {
      if (imp.isTypeOnly) {
        // Emit type imports (e.g. ReactNode for props interface) — required for TS compilation
        if (imp.namedImports.length > 0) {
          lines.push(`import type { ${imp.namedImports.join(', ')} } from '${imp.source}';`);
        }
        continue;
      }
      if (imp.namespaceImport) {
        lines.push(`import * as ${imp.namespaceImport} from '${imp.source}';`);
      } else if (imp.defaultImport && imp.namedImports.length === 0) {
        lines.push(`import ${imp.defaultImport} from '${imp.source}';`);
      } else if (imp.defaultImport && imp.namedImports.length > 0) {
        lines.push(
          `import ${imp.defaultImport}, { ${imp.namedImports.join(', ')} } from '${imp.source}';`
        );
      } else if (imp.namedImports.length > 0) {
        lines.push(`import { ${imp.namedImports.join(', ')} } from '${imp.source}';`);
      }
    }
    return lines.join('\n');
  }

  // ===========================================================================
  // Annotation Renderers
  // ===========================================================================

  /**
   * Render loop construct
   *
   * Key strategy:
   * 1. Explicit key field from DSL → item.{key}
   * 2. Auto-detect item.id → item.id
   * 3. Fallback → index
   *
   * @example
   * {items.map((item, index) => (
   *   <React.Fragment key={item.id ?? index}>
   *     <div>{item.name}</div>
   *   </React.Fragment>
   * ))}
   */
  renderLoop(loop: GenLoop, content: string): string {
    const { item, collection, key, index: indexVar } = loop;
    const idx = indexVar ?? 'index';

    // Key resolution: explicit key → auto id → fallback index.
    // If key is already a full expression (e.g. "link.href"), do not prepend item again.
    let keyExpr: string;
    if (key) {
      keyExpr = key.startsWith(`${item}.`) || key === item ? key : `${item}.${key}`;
    } else {
      keyExpr = `${item}.id ?? ${idx}`;
    }

    // Wrap optional collection paths (e.g. docsInstallation.sections) with ?? [] for safe iteration
    const safeCollection = collection.includes('.') ? `(${collection} ?? [])` : collection;

    const lines = [
      `{${safeCollection}.map((${item}, ${idx}) => (`,
      `<Fragment key={${keyExpr}}>`,
      content,
      '</Fragment>',
      '))}',
    ];

    return lines.join('\n');
  }

  /**
   * Render conditional construct
   *
   * Strategy (decided by architecture review):
   * - Simple if         → ternary: {expr ? (<>content</>) : null}
   * - If/Else           → ternary: {expr ? (<>A</>) : (<>B</>)}
   * - If/ElseIf[/Else]  → IIFE (teaches junior devs real JS patterns)
   *
   * Else/ElseIf branches emit markers that the parent if block consumes.
   */
  renderCondition(condition: GenCondition, content: string): string {
    const { expression, isElse, isElseIf } = condition;

    // Else branch: emit marker for parent if to consume
    if (isElse) {
      return `${MARKERS.ELSE}${content}${MARKERS.END}`;
    }

    // ElseIf branch: emit marker with expression and content
    if (isElseIf) {
      return `${MARKERS.ELSEIF}${expression}${MARKERS.SEP}${content}${MARKERS.END}`;
    }

    // Main if: analyze content for branch markers and build output
    return this.buildConditionOutput(expression, content);
  }

  /**
   * Render standalone else/elseif tag
   */
  renderElse(condition?: string): string {
    if (condition) {
      return `${MARKERS.ELSEIF}${condition}${MARKERS.SEP}`;
    }
    return MARKERS.ELSE;
  }

  /**
   * Render variable output
   *
   * @example
   * {title}
   * {title ?? "Untitled"}
   * {price.toFixed(2)}
   */
  renderVariable(variable: GenVariable): string {
    const { name, default: defaultValue, filter, filterArgs } = variable;

    let expr = name;

    // Apply default with nullish coalescing
    if (defaultValue !== undefined) {
      expr = `${expr} ?? ${this.formatJsValue(defaultValue)}`;
    }

    // Apply filter as JS method
    if (filter) {
      expr = this.applyJsFilter(expr, filter, filterArgs);
    }

    return `{${expr}}`;
  }

  /**
   * Render slot placeholder
   *
   * - Default slot → {children} or {children ?? (<>fallback</>)}
   * - Named slot  → {slotName} or {slotName ?? (<>fallback</>)}
   *
   * @example
   * {children}
   * {header ?? (<>Default Header</>)}
   */
  renderSlot(slot: GenSlot, defaultContent: string): string {
    const { name } = slot;

    // Default slot uses children prop
    if (name === 'default' || name === 'children') {
      if (defaultContent.trim()) {
        return `{children ?? (<>${defaultContent}</>)}`;
      }
      return '{children}';
    }

    // Named slot uses prop
    if (defaultContent.trim()) {
      return `{${name} ?? (<>${defaultContent}</>)}`;
    }

    return `{${name}}`;
  }

  /**
   * Render include/partial as React component import
   *
   * Converts partial paths to PascalCase component names:
   * - "partials/header" → <Header />
   * - "components/user-card" → <UserCard />
   *
   * @example
   * <Header />
   * <Card title={cardTitle} image={cardImage} />
   */
  renderInclude(include: GenInclude, childrenContent?: string): string {
    const { partial, props, originalName } = include;

    // Use preserved original name when available; fall back to path-based conversion
    const componentName = originalName || this.toComponentName(partial);

    const hasChildren = childrenContent !== undefined && childrenContent.trim().length > 0;

    // Build props string; __spread_* keys emit as {...expr}, regular keys as key={value}
    const propsFragments: string[] = [];
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (key.startsWith('__spread_')) {
          propsFragments.push(`{...${value}}`);
        } else {
          propsFragments.push(`${key}={${value}}`);
        }
      }
    }
    const propsString = propsFragments.join(' ');

    if (hasChildren) {
      const attrs = propsString ? ` ${propsString}` : '';
      return `<${componentName}${attrs}>${childrenContent.trim()}</${componentName}>`;
    }
    if (propsString) {
      return `<${componentName} ${propsString} />`;
    }
    return `<${componentName} />`;
  }

  /**
   * Render block (React uses comment markers for documentation)
   */
  renderBlock(block: GenBlock, content: string): string {
    return `{/* block: ${block.name} */}\n${content}\n{/* /block: ${block.name} */}`;
  }

  /**
   * Render extends (not supported in React — use composition)
   */
  renderExtends(parent: string): string {
    this.addWarning('React does not support template inheritance. Use composition instead.');
    return `{/* extends: ${parent} — use composition instead */}`;
  }

  /**
   * Render JSX comment
   */
  renderComment(comment: string): string {
    return `{/* ${comment} */}`;
  }

  // ===========================================================================
  // JSX Attribute Rendering (overrides)
  // ===========================================================================

  /**
   * Override: Keep className (not class) and style as object for React/JSX
   */
  protected override getHtmlAttributes(properties: GenElement['properties']): Record<string, unknown> {
    const attributes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (key === '_gen') continue;

      if (key === 'className' && Array.isArray(value)) {
        // React uses className, not class
        attributes['className'] = value.join(' ');
      } else if (key === 'style' && typeof value === 'object' && value !== null && !('__expression' in (value as object))) {
        // React uses style as object (skip expression markers)
        attributes['style'] = value;
      } else if (key === 'for') {
        // React uses htmlFor
        attributes['htmlFor'] = value;
      } else {
        attributes[key] = value;
      }
    }

    return attributes;
  }

  /**
   * Override: Format attributes in JSX syntax
   *
   * - String props: name="value"
   * - Boolean props: disabled (true) / omitted (false)
   * - Object props: style={{ ... }}
   * - Expression props: count={42}
   */
  protected override formatAttributes(attributes: Record<string, unknown>): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(attributes)) {
      if (value === true) {
        parts.push(key);
      } else if (value === false || value === undefined || value === null) {
        continue;
      } else if (typeof value === 'object' && value !== null && '__expression' in (value as object)) {
        // Dynamic expression → JSX expression binding: prop={expr}
        parts.push(`${key}={${(value as { __expression: string }).__expression}}`);
      } else if (key === 'style' && typeof value === 'object') {
        const styleStr = this.formatStyleJsx(value as Record<string, string>);
        parts.push(`style={${styleStr}}`);
      } else if (typeof value === 'string') {
        parts.push(`${key}="${this.escapeJsxAttributeValue(value)}"`);
      } else {
        parts.push(`${key}={${JSON.stringify(value)}}`);
      }
    }

    return parts.join(' ');
  }

  // ===========================================================================
  // Output Filename (React convention: PascalCase.tsx)
  // ===========================================================================

  /**
   * Override: React components use PascalCase filenames
   */
  protected override getOutputFilename(tree: import('../../../hast').GenRoot): string {
    const componentName = tree.meta?.componentName ?? 'Template';
    return `${componentName}${this.fileExtension}`;
  }

  // ===========================================================================
  // Filter Application (JS-native)
  // ===========================================================================

  override applyFilter(expression: string, filter: string, args?: string[]): string {
    return this.applyJsFilter(expression, filter, args);
  }

  // ===========================================================================
  // Validation
  // ===========================================================================

  override validate(output: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Check for leftover branch markers (indicates broken condition chain)
    if (output.includes(MARKERS.ELSE) || output.includes(MARKERS.ELSEIF)) {
      errors.push('Unprocessed condition branch markers found in output');
    }

    // Check balanced JSX expression braces
    let braceDepth = 0;
    for (const char of output) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      if (braceDepth < 0) {
        errors.push('Unbalanced JSX expression braces: extra closing brace');
        break;
      }
    }

    if (braceDepth > 0) {
      errors.push(`Unbalanced JSX expression braces: ${braceDepth} unclosed`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ===========================================================================
  // Private: Condition Builders
  // ===========================================================================

  /**
   * Build condition output based on branch complexity:
   * - No branches     → ternary with null
   * - Else only       → ternary
   * - ElseIf present  → IIFE
   */
  private buildConditionOutput(expression: string, content: string): string {
    const hasElseIf = content.includes(MARKERS.ELSEIF);
    const hasElse = content.includes(MARKERS.ELSE);

    if (!hasElseIf && !hasElse) {
      // Simple: {expr ? (<>content</>) : null}
      return `{${expression} ? (<>${content}</>) : null}`;
    }

    if (!hasElseIf && hasElse) {
      // Ternary: {expr ? (<>A</>) : (<>B</>)}
      return this.buildTernary(expression, content);
    }

    // IIFE: {(() => { if... })()}
    return this.buildIIFE(expression, content);
  }

  /**
   * Build ternary for if/else
   */
  private buildTernary(expression: string, content: string): string {
    const elseStart = content.indexOf(MARKERS.ELSE);
    const elseEndMarker = content.indexOf(MARKERS.END, elseStart);

    const ifContent = content.substring(0, elseStart).trim();
    const elseContent = content
      .substring(elseStart + MARKERS.ELSE.length, elseEndMarker)
      .trim();

    return `{${expression} ? (<>${ifContent}</>) : (<>${elseContent}</>)}`;
  }

  /**
   * Build IIFE for if/elseif/else chains
   *
   * Output:
   * {(() => {
   *   if (cond1) return (<>content1</>);
   *   if (cond2) return (<>content2</>);
   *   return (<>elseContent</>);
   * })()}
   */
  private buildIIFE(expression: string, content: string): string {
    const lines: string[] = ['{(() => {'];

    // Main if branch: everything before first marker
    const firstMarkerPos = this.findFirstMarkerPos(content);
    const mainContent = content.substring(0, firstMarkerPos).trim();
    lines.push(`  if (${expression}) return (<>${mainContent}</>);`);

    // Parse remaining content for elseif and else branches
    let remaining = content.substring(firstMarkerPos);

    // Process elseif branches
    while (remaining.includes(MARKERS.ELSEIF)) {
      const markerStart = remaining.indexOf(MARKERS.ELSEIF);
      const exprStart = markerStart + MARKERS.ELSEIF.length;
      const sepIdx = remaining.indexOf(MARKERS.SEP, exprStart);
      const contentStart = sepIdx + MARKERS.SEP.length;
      const endIdx = remaining.indexOf(MARKERS.END, contentStart);

      const expr = remaining.substring(exprStart, sepIdx);
      const branchContent = remaining.substring(contentStart, endIdx).trim();

      lines.push(`  if (${expr}) return (<>${branchContent}</>);`);
      remaining = remaining.substring(endIdx + MARKERS.END.length);
    }

    // Process else branch (if present)
    if (remaining.includes(MARKERS.ELSE)) {
      const elseStart = remaining.indexOf(MARKERS.ELSE) + MARKERS.ELSE.length;
      const endIdx = remaining.indexOf(MARKERS.END, elseStart);
      const elseContent = remaining.substring(elseStart, endIdx).trim();
      lines.push(`  return (<>${elseContent}</>);`);
    } else {
      // No else branch: return null as fallback
      lines.push('  return null;');
    }

    lines.push('})()}');
    return lines.join('\n');
  }

  /**
   * Find position of first branch marker in content
   */
  private findFirstMarkerPos(content: string): number {
    const elseIfPos = content.indexOf(MARKERS.ELSEIF);
    const elsePos = content.indexOf(MARKERS.ELSE);

    if (elseIfPos === -1 && elsePos === -1) return content.length;
    if (elseIfPos === -1) return elsePos;
    if (elsePos === -1) return elseIfPos;

    return Math.min(elseIfPos, elsePos);
  }

  // ===========================================================================
  // Private: Helpers
  // ===========================================================================

  /**
   * Convert partial path to PascalCase React component name
   *
   * "partials/header"      → "Header"
   * "components/user-card"  → "UserCard"
   * "layout/main_footer"    → "MainFooter"
   */
  private toComponentName(partial: string): string {
    const basename = partial.split('/').pop() || partial;
    const name = basename.replace(/\.\w+$/, '');

    return name
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Format value as JS literal
   */
  private formatJsValue(value: string): string {
    if (!isNaN(Number(value)) && value.trim() !== '') return value;
    if (value === 'true' || value === 'false') return value;
    return `"${value}"`;
  }

  /**
   * Apply filter as native JS method
   */
  private applyJsFilter(expression: string, filter: string, args?: string[]): string {
    const jsFilters: Record<string, (e: string, a?: string[]) => string> = {
      uppercase: (e) => `${e}.toUpperCase()`,
      lowercase: (e) => `${e}.toLowerCase()`,
      capitalize: (e) => `${e}.charAt(0).toUpperCase() + ${e}.slice(1)`,
      trim: (e) => `${e}.trim()`,
      json: (e) => `JSON.stringify(${e})`,
      length: (e) => `${e}.length`,
      join: (e, a) => `${e}.join(${a?.[0] ? `"${a[0]}"` : '", "'})`,
      split: (e, a) => `${e}.split(${a?.[0] ? `"${a[0]}"` : '","'})`,
      reverse: (e) => `[...${e}].reverse()`,
      sort: (e) => `[...${e}].sort()`,
      first: (e) => `${e}[0]`,
      last: (e) => `${e}[${e}.length - 1]`,
      slice: (e, a) => `${e}.slice(${a?.join(', ') ?? '0'})`,
      truncate: (e, a) => `${e}.substring(0, ${a?.[0] ?? '50'})`,
    };

    const transformer = jsFilters[filter];
    if (transformer) {
      return transformer(expression, args);
    }

    // Unknown filter — warn and pass as method call
    this.addWarning(`Unknown filter "${filter}" — passing as method call`);
    return args?.length
      ? `${expression}.${filter}(${args.join(', ')})`
      : `${expression}.${filter}()`;
  }

  /**
   * Format style object for JSX: style={{ color: "red", fontSize: "16px" }}
   */
  private formatStyleJsx(style: Record<string, string>): string {
    const entries = Object.entries(style)
      .map(([prop, value]) => {
        const camelProp = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        return `${camelProp}: "${value}"`;
      })
      .join(', ');

    return `{ ${entries} }`;
  }

  /**
   * Escape attribute value for JSX string props
   */
  private escapeJsxAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ===========================================================================
  // Pretty-Print (JSX Formatter)
  // ===========================================================================

  /**
   * Override: always pretty-print React output for readability.
   */
  protected override formatOutput(content: string): string {
    return this.indentJsx(content);
  }

  /**
   * Tokenize flat JSX and re-indent with proper nesting depth.
   *
   * Token types:
   * - open:      <Tag ...>         → depth++
   * - close:     </Tag>            → depth--
   * - selfClose: <Tag ... />       → same depth
   * - expression: {... }           → same depth (multi-line: preserve relative indent)
   * - text:      plain text        → same depth
   */
  private indentJsx(input: string): string {
    const lines: string[] = [];
    let depth = 0;
    const indent = '  ';
    let pos = 0;

    while (pos < input.length) {
      // Skip whitespace between tokens
      while (pos < input.length && ' \t\r\n'.includes(input[pos])) pos++;
      if (pos >= input.length) break;

      if (input[pos] === '<' && pos + 1 < input.length && input[pos + 1] === '/') {
        // ── Closing tag: </Tag> ──
        const end = input.indexOf('>', pos);
        if (end === -1) break;
        depth = Math.max(0, depth - 1);
        lines.push(indent.repeat(depth) + input.substring(pos, end + 1));
        pos = end + 1;
      } else if (input[pos] === '<') {
        // ── Opening or self-closing tag ──
        const end = this.findTagEndPos(input, pos);
        if (end === -1) break;
        const tag = input.substring(pos, end + 1);
        const isSelfClosing = tag.endsWith('/>');
        lines.push(indent.repeat(depth) + tag);
        if (!isSelfClosing) depth++;
        pos = end + 1;
      } else if (input[pos] === '{') {
        // ── JSX expression ──
        const end = this.findMatchingBracePos(input, pos);
        if (end === -1) break;
        const expr = input.substring(pos, end + 1);
        const exprLines = expr.split('\n');

        if (exprLines.length === 1) {
          lines.push(indent.repeat(depth) + expr);
        } else {
          // Multi-line: first line at depth, rest preserve relative indent
          lines.push(indent.repeat(depth) + exprLines[0]);
          for (let i = 1; i < exprLines.length; i++) {
            const line = exprLines[i];
            if (line.trim()) {
              lines.push(indent.repeat(depth) + line);
            }
          }
        }
        pos = end + 1;
      } else {
        // ── Text content ──
        let end = pos;
        while (end < input.length && input[end] !== '<' && input[end] !== '{') end++;
        const textContent = input.substring(pos, end).trim();
        if (textContent) {
          lines.push(indent.repeat(depth) + textContent);
        }
        pos = end;
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Find the closing `>` of a tag, skipping over `{}` and quoted strings
   * inside attribute values.
   */
  private findTagEndPos(input: string, start: number): number {
    let pos = start + 1;
    let braceDepth = 0;
    let inString: string | null = null;

    while (pos < input.length) {
      const ch = input[pos];
      if (inString) {
        if (ch === inString) inString = null;
      } else if (ch === '"' || ch === "'") {
        inString = ch;
      } else if (ch === '{') {
        braceDepth++;
      } else if (ch === '}') {
        braceDepth--;
      } else if (ch === '>' && braceDepth === 0) {
        return pos;
      }
      pos++;
    }

    return -1;
  }

  /**
   * Find the matching `}` for a JSX expression `{...}`,
   * handling nested braces and quoted strings.
   */
  private findMatchingBracePos(input: string, start: number): number {
    let depth = 0;
    let pos = start;
    let inString: string | null = null;

    while (pos < input.length) {
      const ch = input[pos];
      if (inString) {
        if (ch === inString && input[pos - 1] !== '\\') inString = null;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) return pos;
      }
      pos++;
    }

    return -1;
  }
}
