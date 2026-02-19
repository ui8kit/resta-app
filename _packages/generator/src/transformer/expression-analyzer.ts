/**
 * Expression Analyzer - Analyzes JSX expressions to detect patterns
 *
 * Detects:
 * - {variable} → variable
 * - {obj.prop} → member access
 * - {items.map(item => ...)} → loop
 * - {cond && <div>} → conditional
 * - {cond ? <a> : <b>} → ternary conditional
 * - {children} → slot
 */

import type * as t from '@babel/types';
import type { AnalyzedExpression, ExpressionType } from './types';
import { getNodeSource } from './jsx-parser';

// =============================================================================
// Main Analyzer
// =============================================================================

/**
 * Analyze a JSX expression
 */
export function analyzeExpression(
  node: t.Expression,
  source: string
): AnalyzedExpression {
  const raw = getNodeSource(source, node);
  const loc = node.loc ? {
    start: { line: node.loc.start.line, column: node.loc.start.column },
    end: { line: node.loc.end.line, column: node.loc.end.column },
  } : undefined;
  
  // Check for specific patterns in order of precedence
  
  // 1. Check for .map() loop pattern
  const loopResult = analyzeLoopExpression(node, source);
  if (loopResult) {
    return { type: loopResult.type!, ...loopResult, raw, loc };
  }
  
  // 2. Check for conditional (&&) pattern
  const logicalResult = analyzeLogicalExpression(node, source);
  if (logicalResult) {
    return { type: logicalResult.type!, ...logicalResult, raw, loc };
  }
  
  // 3. Check for ternary pattern
  const ternaryResult = analyzeTernaryExpression(node, source);
  if (ternaryResult) {
    return { type: ternaryResult.type!, ...ternaryResult, raw, loc };
  }
  
  // 4. Check for children
  if (isChildrenIdentifier(node)) {
    return { type: 'children', raw, loc };
  }
  
  // 5. Check for simple identifier
  if (node.type === 'Identifier') {
    return {
      type: 'variable',
      raw,
      path: node.name,
      loc,
    };
  }
  
  // 6. Check for member expression (obj.prop)
  if (node.type === 'MemberExpression') {
    const path = getMemberExpressionPath(node);
    return {
      type: 'member',
      raw,
      path,
      loc,
    };
  }
  
  // 7. Check for template literal
  if (node.type === 'TemplateLiteral') {
    return { type: 'template', raw, loc };
  }
  
  // 8. Check for literal
  if (isLiteral(node)) {
    return { type: 'literal', raw, loc };
  }
  
  // 9. Check for spread (handled at parent level, but keep for safety)
  // SpreadElement is not an Expression type in Babel, skip this check
  
  // 10. Check for function call
  if (node.type === 'CallExpression') {
    return { type: 'call', raw, loc };
  }
  
  // Unknown
  return { type: 'unknown', raw, loc };
}

// =============================================================================
// Loop Detection
// =============================================================================

/**
 * Detect .map() pattern for loops
 *
 * Patterns:
 * - items.map(item => <div>{item}</div>)
 * - items.map((item, index) => <div>{item}</div>)
 * - items.map(function(item) { return <div>{item}</div> })
 */
function analyzeLoopExpression(
  node: t.Expression,
  source: string
): Partial<AnalyzedExpression> | null {
  if (node.type !== 'CallExpression') return null;
  
  const callee = node.callee;
  if (callee.type !== 'MemberExpression') return null;
  
  // Check if method is .map()
  const property = callee.property;
  if (property.type !== 'Identifier' || property.name !== 'map') return null;
  
  // Get collection path
  const collection = getMemberExpressionPath(callee.object as t.MemberExpression | t.Identifier);
  
  // Get callback argument
  const callback = node.arguments[0];
  if (!callback) return null;
  
  // Extract item name from callback
  let itemName: string | undefined;
  let indexName: string | undefined;
  
  if (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') {
    const params = callback.params;
    
    if (params[0]) {
      if (params[0].type === 'Identifier') {
        itemName = params[0].name;
      } else if (params[0].type === 'ObjectPattern') {
        // Destructured: ({name, id}) => ...
        itemName = 'item'; // Use generic name
      }
    }
    
    if (params[1] && params[1].type === 'Identifier') {
      indexName = params[1].name;
    }
  }
  
  if (!itemName) return null;
  
  // Look for key prop in returned JSX
  let keyExpression: string | undefined;
  const body = getCallbackBody(callback as t.ArrowFunctionExpression | t.FunctionExpression);
  if (body && body.type === 'JSXElement') {
    keyExpression = extractKeyProp(body, source);
  }
  
  return {
    type: 'loop',
    loopItem: itemName,
    loopCollection: collection,
    loopKey: keyExpression,
  };
}

/**
 * Get callback body
 */
function getCallbackBody(callback: t.ArrowFunctionExpression | t.FunctionExpression): t.Expression | null {
  if (callback.type === 'ArrowFunctionExpression') {
    if (callback.body.type !== 'BlockStatement') {
      return callback.body;
    }
    // Look for return statement
    for (const stmt of callback.body.body) {
      if (stmt.type === 'ReturnStatement' && stmt.argument) {
        return stmt.argument;
      }
    }
  } else if (callback.type === 'FunctionExpression') {
    for (const stmt of callback.body.body) {
      if (stmt.type === 'ReturnStatement' && stmt.argument) {
        return stmt.argument;
      }
    }
  }
  return null;
}

/**
 * Extract key prop from JSX element
 */
function extractKeyProp(element: t.JSXElement, source: string): string | undefined {
  for (const attr of element.openingElement.attributes) {
    if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier' && attr.name.name === 'key') {
      if (attr.value) {
        if (attr.value.type === 'JSXExpressionContainer') {
          return getNodeSource(source, attr.value.expression);
        } else if (attr.value.type === 'StringLiteral') {
          return attr.value.value;
        }
      }
    }
  }
  return undefined;
}

// =============================================================================
// Conditional Detection
// =============================================================================

/**
 * Detect logical && pattern
 *
 * Patterns:
 * - condition && <div>Content</div>
 * - isActive && <span>Active</span>
 * - user?.isAdmin && <AdminPanel />
 */
function analyzeLogicalExpression(
  node: t.Expression,
  source: string
): Partial<AnalyzedExpression> | null {
  if (node.type !== 'LogicalExpression') return null;
  if (node.operator !== '&&') return null;
  
  // Right side should be JSX or another expression
  // Left side is the condition
  const condition = getNodeSource(source, node.left);
  
  return {
    type: 'conditional',
    condition: condition,
    isTernary: false,
  };
}

/**
 * Detect ternary pattern
 *
 * Patterns:
 * - condition ? <TrueComponent /> : <FalseComponent />
 * - isLoading ? <Spinner /> : <Content />
 */
function analyzeTernaryExpression(
  node: t.Expression,
  source: string
): Partial<AnalyzedExpression> | null {
  if (node.type !== 'ConditionalExpression') return null;
  
  const condition = getNodeSource(source, node.test);
  
  return {
    type: 'conditional',
    condition,
    isTernary: true,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if node is the special 'children' identifier
 */
function isChildrenIdentifier(node: t.Expression): boolean {
  return node.type === 'Identifier' && node.name === 'children';
}

/**
 * Get full path from member expression
 *
 * user.profile.name → "user.profile.name"
 */
function getMemberExpressionPath(node: t.MemberExpression | t.Identifier): string {
  if (node.type === 'Identifier') {
    return node.name;
  }
  
  const parts: string[] = [];
  let current: t.Expression = node;
  
  while (current.type === 'MemberExpression') {
    const property = current.property;
    
    if (property.type === 'Identifier') {
      parts.unshift(property.name);
    } else if (property.type === 'StringLiteral') {
      parts.unshift(property.value);
    } else if (property.type === 'NumericLiteral') {
      parts.unshift(String(property.value));
    }
    
    current = current.object;
  }
  
  if (current.type === 'Identifier') {
    parts.unshift(current.name);
  }
  
  return parts.join('.');
}

/**
 * Check if node is a literal value
 */
function isLiteral(node: t.Expression): boolean {
  return (
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral' ||
    node.type === 'NullLiteral'
  );
}

// =============================================================================
// Variable Extraction
// =============================================================================

/**
 * Extract all variable references from an expression
 */
export function extractVariables(node: t.Expression | t.Node): string[] {
  const variables = new Set<string>();
  
  function walk(n: t.Node): void {
    if (n.type === 'Identifier') {
      // Skip known globals and React internals
      const name = n.name;
      if (!isKnownGlobal(name)) {
        variables.add(name);
      }
    } else if (n.type === 'MemberExpression') {
      // Get root identifier
      let current: t.Expression = n;
      while (current.type === 'MemberExpression') {
        current = current.object;
      }
      if (current.type === 'Identifier' && !isKnownGlobal(current.name)) {
        variables.add(current.name);
      }
    } else {
      // Walk children
      for (const key of Object.keys(n)) {
        const child = (n as any)[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item.type === 'string') {
                walk(item);
              }
            }
          } else if (typeof child.type === 'string') {
            walk(child);
          }
        }
      }
    }
  }
  
  walk(node);
  return Array.from(variables);
}

/**
 * Known globals that shouldn't be treated as variables
 */
function isKnownGlobal(name: string): boolean {
  const globals = new Set([
    'undefined', 'null', 'true', 'false',
    'console', 'window', 'document', 'navigator',
    'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON',
    'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
    'React', 'Fragment', 'Component', 'PureComponent',
    'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext',
    'useReducer', 'useLayoutEffect', 'useImperativeHandle', 'useDebugValue',
    'forwardRef', 'memo', 'lazy', 'Suspense',
    'clsx', 'cn', 'classNames',
  ]);
  return globals.has(name);
}
