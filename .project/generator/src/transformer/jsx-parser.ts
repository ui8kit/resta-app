/**
 * JSX Parser - Parses JSX/TSX source code using Babel
 */

import { parse, type ParserOptions } from '@babel/parser';
import type { File, Statement } from '@babel/types';
import type { AnalyzedImport } from './types';

// =============================================================================
// Parser Options
// =============================================================================

/**
 * Default Babel parser options for JSX/TSX
 */
export const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'typescript',
    'decorators-legacy',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'dynamicImport',
    'nullishCoalescingOperator',
    'optionalChaining',
    'optionalCatchBinding',
  ],
  errorRecovery: true,
};

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse JSX/TSX source code to Babel AST
 */
export function parseJsx(
  source: string,
  options: Partial<ParserOptions> = {}
): File {
  const mergedOptions: ParserOptions = {
    ...DEFAULT_PARSER_OPTIONS,
    ...options,
  };
  
  return parse(source, mergedOptions);
}

/**
 * Parse JSX/TSX file and extract basic info
 */
export function parseJsxFile(
  source: string,
  filename?: string
): {
  ast: File;
  imports: AnalyzedImport[];
  hasJsx: boolean;
  hasDefaultExport: boolean;
  namedExports: string[];
} {
  const ast = parseJsx(source, {
    sourceFilename: filename,
  });
  
  const imports: AnalyzedImport[] = [];
  const namedExports: string[] = [];
  let hasJsx = false;
  let hasDefaultExport = false;
  
  for (const node of ast.program.body) {
    // Collect imports
    if (node.type === 'ImportDeclaration') {
      imports.push(analyzeImport(node));
    }
    
    // Check for default export
    if (node.type === 'ExportDefaultDeclaration') {
      hasDefaultExport = true;
    }
    
    // Collect named exports
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        const names = extractDeclarationNames(node.declaration);
        namedExports.push(...names);
      }
      if (node.specifiers) {
        for (const spec of node.specifiers) {
          if (spec.type === 'ExportSpecifier') {
            const name = spec.exported.type === 'Identifier' 
              ? spec.exported.name 
              : spec.exported.value;
            namedExports.push(name);
          }
        }
      }
    }
  }
  
  // Check for JSX (simple heuristic)
  hasJsx = source.includes('<') && (
    source.includes('/>') || 
    source.includes('</') ||
    /<[A-Z]/.test(source)
  );
  
  return {
    ast,
    imports,
    hasJsx,
    hasDefaultExport,
    namedExports,
  };
}

// =============================================================================
// Import Analysis
// =============================================================================

/**
 * Analyze an import declaration
 */
function analyzeImport(node: any): AnalyzedImport {
  const result: AnalyzedImport = {
    source: node.source.value,
    namedImports: [],
    isTypeOnly: node.importKind === 'type',
  };
  
  for (const spec of node.specifiers || []) {
    if (spec.type === 'ImportDefaultSpecifier') {
      result.defaultImport = spec.local.name;
    } else if (spec.type === 'ImportSpecifier') {
      result.namedImports.push(spec.local.name);
    } else if (spec.type === 'ImportNamespaceSpecifier') {
      result.namespaceImport = spec.local.name;
    }
  }
  
  return result;
}

/**
 * Extract names from a declaration
 */
function extractDeclarationNames(decl: Statement): string[] {
  const names: string[] = [];
  
  if (decl.type === 'FunctionDeclaration' && decl.id) {
    names.push(decl.id.name);
  } else if (decl.type === 'ClassDeclaration' && decl.id) {
    names.push(decl.id.name);
  } else if (decl.type === 'VariableDeclaration') {
    for (const declarator of decl.declarations) {
      if (declarator.id.type === 'Identifier') {
        names.push(declarator.id.name);
      } else if (declarator.id.type === 'ObjectPattern') {
        for (const prop of declarator.id.properties) {
          if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
            names.push(prop.key.name);
          }
        }
      }
    }
  } else if (decl.type === 'TSTypeAliasDeclaration') {
    names.push(decl.id.name);
  } else if (decl.type === 'TSInterfaceDeclaration') {
    names.push(decl.id.name);
  }
  
  return names;
}

// =============================================================================
// Source Helpers
// =============================================================================

/**
 * Get source code for a node
 */
export function getNodeSource(source: string, node: { start?: number | null; end?: number | null }): string {
  if (node.start == null || node.end == null) {
    return '';
  }
  return source.slice(node.start, node.end);
}

/**
 * Get line/column for position
 */
export function getPosition(source: string, pos: number): { line: number; column: number } {
  const lines = source.slice(0, pos).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length,
  };
}
