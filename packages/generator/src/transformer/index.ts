/**
 * Transformer Module - JSX to HAST Transformation
 *
 * Converts React JSX/TSX components to GenHAST trees with annotations.
 * The resulting tree is used by:
 * - static runtime generation pipeline internals
 * - template-plugin legacy track (optional)
 *
 * @example
 * ```ts
 * import { transformJsx, transformJsxFile } from '@ui8kit/generator/transformer';
 *
 * // Transform source code
 * const result = transformJsx(`
 *   export function MyComponent({ items }) {
 *     return (
 *       <ul>
 *         {items.map(item => <li>{item.name}</li>)}
 *       </ul>
 *     );
 *   }
 * `);
 *
 * // Transform file
 * const fileResult = await transformJsxFile('./src/components/MyComponent.tsx');
 *
 * // Inspect extracted metadata
 * console.log(result.variables, result.dependencies);
 * ```
 */

// Main API
export {
  transformJsx,
  transformJsxFile,
  transformJsxFiles,
  // Lower-level exports
  parseJsx,
  parseJsxFile,
  buildHast,
  analyzeExpression,
  extractVariables,
} from './transform';

// Parser
export { DEFAULT_PARSER_OPTIONS, getNodeSource, getPosition } from './jsx-parser';

// DSL Handler System
export { DslRegistry, type IDslComponentHandler, type DslHandlerContext } from './dsl-handler';
export { BUILT_IN_DSL_HANDLERS } from './dsl-handlers';

// Types
export type {
  TransformOptions,
  TransformResult,
  ComponentPatterns,
  ExpressionType,
  AnalyzedExpression,
  AnalyzedComponent,
  AnalyzedProp,
  AnalyzedImport,
} from './types';

export { DEFAULT_COMPONENT_PATTERNS } from './types';
