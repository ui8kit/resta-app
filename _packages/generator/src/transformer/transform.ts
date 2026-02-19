/**
 * Transform API - High-level API for JSX to HAST transformation
 */

import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { parseJsxFile } from './jsx-parser';
import { buildHast } from './hast-builder';
import type { TransformOptions, TransformResult, AnalyzedImport } from './types';
import type { GenRoot } from '../hast';
import { collectVariables, collectDependencies } from '../hast';

// =============================================================================
// Main API
// =============================================================================

/**
 * Transform JSX/TSX source code to GenHAST
 *
 * @param source - JSX/TSX source code
 * @param options - Transform options
 * @returns Transform result with HAST tree
 *
 * @example
 * ```ts
 * const result = transformJsx(`
 *   export function ProductList({ products }) {
 *     return (
 *       <ul>
 *         {products.map(product => (
 *           <li key={product.id}>{product.name}</li>
 *         ))}
 *       </ul>
 *     );
 *   }
 * `);
 *
 * console.log(result.tree);
 * // GenRoot with loop annotation
 * ```
 */
export function transformJsx(
  source: string,
  options: TransformOptions = {}
): TransformResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    // Parse source
    const { ast, imports, hasJsx } = parseJsxFile(source, options.sourceFile);
    
    if (!hasJsx) {
      warnings.push('No JSX found in source');
    }
    
    // Build HAST
    const tree = buildHast(ast, source, options);
    
    // Collect variables and dependencies
    const variables = collectVariables(tree);
    const dependencies = collectDependencies(tree);
    
    // Add imports as dependencies
    for (const imp of imports) {
      if (!imp.isTypeOnly && imp.source.startsWith('.')) {
        for (const name of imp.namedImports) {
          if (/^[A-Z]/.test(name)) {
            dependencies.push(name);
          }
        }
        if (imp.defaultImport && /^[A-Z]/.test(imp.defaultImport)) {
          dependencies.push(imp.defaultImport);
        }
      }
    }

    // Attach imports to tree.meta for React plugin (full-file emission)
    if (imports.length > 0 && tree.meta) {
      tree.meta.imports = imports.map(
        (imp): import('../hast').GenSourceImport => ({
          source: imp.source,
          defaultImport: imp.defaultImport,
          namedImports: imp.namedImports,
          namespaceImport: imp.namespaceImport,
          isTypeOnly: imp.isTypeOnly,
        })
      );
    }
    
    return {
      tree,
      variables: [...new Set(variables)],
      dependencies: [...new Set(dependencies)],
      warnings,
      errors,
      imports,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    
    return {
      tree: { type: 'root', children: [] },
      variables: [],
      dependencies: [],
      warnings,
      errors,
      imports: [],
    };
  }
}

/**
 * Transform JSX/TSX file to GenHAST
 *
 * @param filePath - Path to JSX/TSX file
 * @param options - Transform options
 * @returns Transform result with HAST tree
 */
export async function transformJsxFile(
  filePath: string,
  options: TransformOptions = {}
): Promise<TransformResult> {
  const source = await readFile(filePath, 'utf-8');
  
  // Auto-detect component name from filename
  const ext = extname(filePath);
  const componentName = options.componentName || pascalCase(basename(filePath, ext));
  
  return transformJsx(source, {
    ...options,
    sourceFile: filePath,
    componentName,
  });
}

/**
 * Transform multiple JSX/TSX files to GenHAST
 *
 * @param filePaths - Paths to JSX/TSX files
 * @param options - Transform options (applied to all files)
 * @returns Map of file path to transform result
 */
export async function transformJsxFiles(
  filePaths: string[],
  options: TransformOptions = {}
): Promise<Map<string, TransformResult>> {
  const results = new Map<string, TransformResult>();
  
  await Promise.all(
    filePaths.map(async (filePath) => {
      const result = await transformJsxFile(filePath, options);
      results.set(filePath, result);
    })
  );
  
  return results;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert string to PascalCase
 */
function pascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { parseJsx, parseJsxFile } from './jsx-parser';
export { buildHast } from './hast-builder';
export { analyzeExpression, extractVariables } from './expression-analyzer';
