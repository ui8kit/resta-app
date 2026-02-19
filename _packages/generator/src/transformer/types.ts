/**
 * Types for JSX to HAST Transformer
 */

import type { GenRoot, GenComponentMeta } from '../hast';

// =============================================================================
// Transform Options
// =============================================================================

/**
 * Options for JSX transformation
 */
export interface TransformOptions {
  /** Source file path (for error messages and metadata) */
  sourceFile?: string;
  
  /** Component name to transform (default: auto-detect) */
  componentName?: string;
  
  /** Extract props interface/type */
  extractProps?: boolean;
  
  /** Patterns to identify component types */
  componentPatterns?: ComponentPatterns;
  
  /** Mock data for runtime transformation */
  mockData?: Record<string, unknown>;
  
  /** Include source locations in annotations */
  includeSourceLocations?: boolean;

  /**
   * Component names that should be preserved as elements (not converted to includes).
   * Useful for UI primitives (Block, Stack, Container, etc.) that should remain
   * as component references in the generated output with their children intact.
   *
   * @example ['Block', 'Stack', 'Container', 'Grid', 'Box', 'Text', 'Title', 'Button']
   */
  passthroughComponents?: string[];
}

/**
 * Patterns for identifying component types by name/path
 */
export interface ComponentPatterns {
  layouts?: RegExp[];
  partials?: RegExp[];
  pages?: RegExp[];
  blocks?: RegExp[];
}

/**
 * Default component patterns
 */
export const DEFAULT_COMPONENT_PATTERNS: ComponentPatterns = {
  layouts: [/Layout$/i, /^.*layouts?\/.*/i],
  partials: [/^Header$/i, /^Footer$/i, /^Nav(bar)?$/i, /^Sidebar$/i, /^.*partials?\/.*/i],
  pages: [/Page$/i, /^.*pages?\/.*/i, /^.*routes?\/.*/i],
  blocks: [/Block$/i, /Section$/i, /^.*blocks?\/.*/i],
};

// =============================================================================
// Transform Result
// =============================================================================

/**
 * Result of JSX transformation
 */
export interface TransformResult {
  /** Generated HAST tree */
  tree: GenRoot;
  
  /** Detected variables */
  variables: string[];
  
  /** Detected component dependencies */
  dependencies: string[];
  
  /** Warnings during transformation */
  warnings: string[];
  
  /** Errors during transformation (non-fatal) */
  errors: string[];
  
  /** Import declarations from source (for React full-file emission) */
  imports?: AnalyzedImport[];
}

// =============================================================================
// Expression Types
// =============================================================================

/**
 * Detected expression type in JSX
 */
export type ExpressionType =
  | 'variable'      // {title}
  | 'member'        // {user.name}
  | 'loop'          // {items.map(...)}
  | 'conditional'   // {cond && <div>} or {cond ? <a> : <b>}
  | 'children'      // {children}
  | 'spread'        // {...props}
  | 'call'          // {fn()}
  | 'literal'       // {"string"} or {123}
  | 'template'      // {`template ${var}`}
  | 'unknown';

/**
 * Analyzed expression
 */
export interface AnalyzedExpression {
  type: ExpressionType;
  
  /** Raw expression code */
  raw: string;
  
  /** For variable/member: variable path */
  path?: string;
  
  /** For loop: item name */
  loopItem?: string;
  
  /** For loop: collection path */
  loopCollection?: string;
  
  /** For loop: key expression */
  loopKey?: string;
  
  /** For conditional: condition expression */
  condition?: string;
  
  /** For conditional: is ternary? */
  isTernary?: boolean;
  
  /** Source location */
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// =============================================================================
// Component Analysis
// =============================================================================

/**
 * Analyzed component information
 */
export interface AnalyzedComponent {
  /** Component name */
  name: string;
  
  /** Component type based on patterns */
  type: 'layout' | 'partial' | 'page' | 'block' | 'component';
  
  /** Detected props */
  props: AnalyzedProp[];
  
  /** Export type */
  exportType: 'default' | 'named' | 'both';
  
  /** Is function component? */
  isFunctionComponent: boolean;
  
  /** Uses forwardRef? */
  usesForwardRef: boolean;
  
  /** Source file */
  sourceFile?: string;
}

/**
 * Analyzed prop
 */
export interface AnalyzedProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

// =============================================================================
// Import Analysis
// =============================================================================

/**
 * Analyzed import
 */
export interface AnalyzedImport {
  /** Import source */
  source: string;
  
  /** Default import name */
  defaultImport?: string;
  
  /** Named imports */
  namedImports: string[];
  
  /** Namespace import (import * as X) */
  namespaceImport?: string;
  
  /** Is type-only import */
  isTypeOnly: boolean;
}
