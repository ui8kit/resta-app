/**
 * HAST Tree Utilities
 *
 * Functions for traversing, transforming, and querying GenHAST trees.
 * Inspired by unist-util-visit and other unified utilities.
 */

import type {
  GenNode,
  GenElement,
  GenRoot,
  GenText,
  GenChild,
  GenVisitor,
  GenVisitorObject,
  GenNodePredicate,
  GenAnnotations,
} from './types';
import { isElement, isText, isComment, isRoot, getAnnotations } from './types';

// =============================================================================
// Tree Traversal
// =============================================================================

/**
 * Visit all nodes in the tree
 *
 * @param tree - Root node to traverse
 * @param visitor - Callback or visitor object
 *
 * @example
 * ```ts
 * visit(root, (node, index, parent) => {
 *   if (isElement(node)) {
 *     console.log(node.tagName);
 *   }
 * });
 * ```
 */
export function visit(
  tree: GenRoot | GenElement,
  visitor: GenVisitor | GenVisitorObject
): void {
  const enter = typeof visitor === 'function' ? visitor : visitor.enter;
  const exit = typeof visitor === 'function' ? undefined : visitor.exit;

  function visitNode(
    node: GenNode,
    index: number | null,
    parent: GenElement | GenRoot | null
  ): boolean {
    // Enter callback
    if (enter) {
      const result = enter(node, index, parent);
      if (result === false) return false; // Stop traversal
      if (result === 'skip') return true; // Skip children
    }

    // Visit children
    if (isElement(node) || isRoot(node)) {
      const children = node.children;
      for (let i = 0; i < children.length; i++) {
        const shouldContinue = visitNode(children[i], i, node);
        if (!shouldContinue) return false;
      }
    }

    // Exit callback
    if (exit) {
      const result = exit(node, index, parent);
      if (result === false) return false;
    }

    return true;
  }

  visitNode(tree, null, null);
}

/**
 * Visit nodes that match a predicate
 *
 * @param tree - Root node to traverse
 * @param predicate - Filter function
 * @param visitor - Callback for matching nodes
 *
 * @example
 * ```ts
 * visitMatch(root, isElement, (node) => {
 *   console.log(node.tagName);
 * });
 * ```
 */
export function visitMatch(
  tree: GenRoot | GenElement,
  predicate: GenNodePredicate,
  visitor: GenVisitor
): void {
  visit(tree, (node, index, parent) => {
    if (predicate(node)) {
      return visitor(node, index, parent);
    }
  });
}

/**
 * Visit only element nodes
 */
export function visitElements(
  tree: GenRoot | GenElement,
  visitor: (node: GenElement, index: number | null, parent: GenElement | GenRoot | null) => void | boolean | 'skip'
): void {
  visitMatch(tree, isElement, visitor as GenVisitor);
}

/**
 * Visit only text nodes
 */
export function visitText(
  tree: GenRoot | GenElement,
  visitor: (node: GenText, index: number | null, parent: GenElement | GenRoot | null) => void | boolean | 'skip'
): void {
  visitMatch(tree, isText, visitor as GenVisitor);
}

// =============================================================================
// Tree Transformation
// =============================================================================

/**
 * Map over all nodes, creating a new tree
 *
 * @param tree - Root node to transform
 * @param mapper - Transform function
 * @returns New tree with transformed nodes
 *
 * @example
 * ```ts
 * const newTree = map(root, (node) => {
 *   if (isElement(node) && node.tagName === 'div') {
 *     return { ...node, tagName: 'section' };
 *   }
 *   return node;
 * });
 * ```
 */
export function map<T extends GenRoot | GenElement>(
  tree: T,
  mapper: (node: GenNode) => GenNode
): T {
  function mapNode(node: GenNode): GenNode {
    const mapped = mapper(node);

    if (isElement(mapped)) {
      const elem = mapped as GenElement;
      return {
        ...elem,
        children: elem.children.map(child => mapNode(child) as GenChild),
      } as GenElement;
    }

    if (isRoot(mapped)) {
      const rootNode = mapped as GenRoot;
      return {
        ...rootNode,
        children: rootNode.children.map(child => mapNode(child) as GenChild),
      } as GenRoot;
    }

    return mapped;
  }

  return mapNode(tree) as T;
}

/**
 * Filter nodes, keeping only those that match the predicate
 *
 * @param tree - Root node to filter
 * @param predicate - Filter function
 * @returns New tree with filtered nodes
 */
export function filter<T extends GenRoot | GenElement>(
  tree: T,
  predicate: GenNodePredicate
): T | null {
  function filterNode(node: GenNode): GenNode | null {
    if (!predicate(node)) {
      return null;
    }

    if (isElement(node)) {
      const elem = node as GenElement;
      const filteredChildren = elem.children
        .map(child => filterNode(child))
        .filter((child): child is GenChild => child !== null);

      return {
        ...elem,
        children: filteredChildren,
      } as GenElement;
    }

    if (isRoot(node)) {
      const rootNode = node as GenRoot;
      const filteredChildren = rootNode.children
        .map(child => filterNode(child))
        .filter((child): child is GenChild => child !== null);

      return {
        ...rootNode,
        children: filteredChildren,
      } as GenRoot;
    }

    return node;
  }

  return filterNode(tree) as T | null;
}

/**
 * Remove nodes that match the predicate
 *
 * @param tree - Root node to process
 * @param predicate - Nodes matching this will be removed
 * @returns New tree without matching nodes
 */
export function remove<T extends GenRoot | GenElement>(
  tree: T,
  predicate: GenNodePredicate
): T {
  return filter(tree, node => !predicate(node)) as T;
}

// =============================================================================
// Tree Querying
// =============================================================================

/**
 * Find the first node matching the predicate
 *
 * @param tree - Root node to search
 * @param predicate - Search predicate
 * @returns First matching node or undefined
 */
export function find(
  tree: GenRoot | GenElement,
  predicate: GenNodePredicate
): GenNode | undefined {
  let found: GenNode | undefined;

  visit(tree, (node) => {
    if (predicate(node)) {
      found = node;
      return false; // Stop traversal
    }
  });

  return found;
}

/**
 * Find all nodes matching the predicate
 *
 * @param tree - Root node to search
 * @param predicate - Search predicate
 * @returns Array of matching nodes
 */
export function findAll(
  tree: GenRoot | GenElement,
  predicate: GenNodePredicate
): GenNode[] {
  const results: GenNode[] = [];

  visit(tree, (node) => {
    if (predicate(node)) {
      results.push(node);
    }
  });

  return results;
}

/**
 * Find element by tag name
 */
export function findByTag(
  tree: GenRoot | GenElement,
  tagName: string
): GenElement | undefined {
  return find(tree, node =>
    isElement(node) && node.tagName === tagName
  ) as GenElement | undefined;
}

/**
 * Find all elements by tag name
 */
export function findAllByTag(
  tree: GenRoot | GenElement,
  tagName: string
): GenElement[] {
  return findAll(tree, node =>
    isElement(node) && node.tagName === tagName
  ) as GenElement[];
}

/**
 * Find element by ID
 */
export function findById(
  tree: GenRoot | GenElement,
  id: string
): GenElement | undefined {
  return find(tree, node =>
    isElement(node) && node.properties.id === id
  ) as GenElement | undefined;
}

/**
 * Find elements by class name
 */
export function findByClass(
  tree: GenRoot | GenElement,
  className: string
): GenElement[] {
  return findAll(tree, node =>
    isElement(node) && (node.properties.className?.includes(className) ?? false)
  ) as GenElement[];
}

/**
 * Find elements with specific annotation
 */
export function findByAnnotation(
  tree: GenRoot | GenElement,
  annotation: keyof GenAnnotations
): GenElement[] {
  return findAll(tree, node => {
    if (!isElement(node)) return false;
    const annotations = getAnnotations(node);
    return annotations?.[annotation] !== undefined;
  }) as GenElement[];
}

// =============================================================================
// Tree Statistics
// =============================================================================

/**
 * Count all nodes in the tree
 */
export function countNodes(tree: GenRoot | GenElement): number {
  let count = 0;
  visit(tree, () => { count++; });
  return count;
}

/**
 * Count elements by type
 */
export function countByType(tree: GenRoot | GenElement): Record<string, number> {
  const counts: Record<string, number> = {};

  visit(tree, (node) => {
    const key = isElement(node) ? node.tagName : node.type;
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}

/**
 * Get tree depth
 */
export function getDepth(tree: GenRoot | GenElement): number {
  let maxDepth = 0;
  let currentDepth = 0;

  visit(tree, {
    enter: () => {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    },
    exit: () => {
      currentDepth--;
    },
  });

  return maxDepth;
}

// =============================================================================
// Variable Collection
// =============================================================================

/**
 * Collect all variables used in the tree
 */
export function collectVariables(tree: GenRoot | GenElement): string[] {
  const variables = new Set<string>();

  visit(tree, (node) => {
    if (!isElement(node)) return;
    
    const annotations = getAnnotations(node);
    if (!annotations) return;

    // From variable annotation
    if (annotations.variable) {
      variables.add(annotations.variable.name);
    }

    // From loop annotation
    if (annotations.loop) {
      variables.add(annotations.loop.collection);
      variables.add(annotations.loop.item);
    }

    // From condition annotation
    if (annotations.condition) {
      // Extract variable names from expression (simple extraction)
      const expr = annotations.condition.expression;
      const matches = expr.match(/[a-zA-Z_][a-zA-Z0-9_.]*/g);
      if (matches) {
        matches.forEach(m => {
          // Get root variable name (before first dot)
          const rootVar = m.split('.')[0];
          if (!['true', 'false', 'null', 'undefined'].includes(rootVar)) {
            variables.add(rootVar);
          }
        });
      }
    }

    // From include props
    if (annotations.include?.props) {
      Object.values(annotations.include.props).forEach(value => {
        if (!value.startsWith('"') && !value.startsWith("'")) {
          const rootVar = value.split('.')[0];
          variables.add(rootVar);
        }
      });
    }
  });

  return Array.from(variables).sort();
}

/**
 * Collect all dependencies (includes) from the tree
 */
export function collectDependencies(tree: GenRoot | GenElement): string[] {
  const deps = new Set<string>();

  visit(tree, (node) => {
    if (!isElement(node)) return;
    
    const annotations = getAnnotations(node);
    if (annotations?.include) {
      deps.add(annotations.include.partial);
    }
  });

  return Array.from(deps).sort();
}

// =============================================================================
// Tree Building Helpers
// =============================================================================

/**
 * Create a text node
 */
export function text(value: string): GenText {
  return { type: 'text', value };
}

/**
 * Create an element node
 */
export function element(
  tagName: string,
  properties: GenElement['properties'] = {},
  children: GenChild[] = []
): GenElement {
  return { type: 'element', tagName, properties, children };
}

/**
 * Create a root node
 */
export function root(children: GenChild[] = [], meta?: GenRoot['meta']): GenRoot {
  return { type: 'root', children, meta };
}

/**
 * Add annotation to an element
 */
export function annotate(
  node: GenElement,
  annotations: Partial<GenAnnotations>
): GenElement {
  return {
    ...node,
    properties: {
      ...node.properties,
      _gen: {
        ...node.properties._gen,
        ...annotations,
      },
    },
  };
}
