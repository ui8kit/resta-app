/**
 * Tests for HAST Core Module
 */

import { describe, it, expect } from 'vitest';
import {
  // Types and guards
  isElement,
  isText,
  isComment,
  isRoot,
  hasAnnotations,
  hasAnnotation,
  getAnnotations,
  // Utilities
  visit,
  visitElements,
  visitText,
  map,
  filter,
  remove,
  find,
  findAll,
  findByTag,
  findAllByTag,
  findById,
  findByClass,
  findByAnnotation,
  countNodes,
  countByType,
  getDepth,
  collectVariables,
  collectDependencies,
  // Builders
  text,
  element,
  root,
  annotate,
  // Schemas
  validateRoot,
  validateElement,
  validateAnnotations,
} from './index';

import type { GenRoot, GenElement, GenText } from './types';

// =============================================================================
// Test Fixtures
// =============================================================================

function createSimpleTree(): GenRoot {
  return root([
    element('div', { className: ['container'] }, [
      element('h1', {}, [text('Title')]),
      element('p', { id: 'intro' }, [text('Introduction')]),
    ]),
  ]);
}

function createAnnotatedTree(): GenRoot {
  return root([
    element('div', {
      _gen: { component: 'Layout' },
    }, [
      element('header', {
        _gen: { slot: { name: 'header' } },
      }, [
        element('nav', {
          _gen: { include: { partial: 'partials/nav', props: { brand: 'siteName' } } },
        }, []),
      ]),
      element('main', {}, [
        element('ul', {
          _gen: { loop: { item: 'item', collection: 'items' } },
        }, [
          element('li', {}, [
            element('span', {
              _gen: { variable: { name: 'item.name' } },
            }, [text('Item Name')]),
          ]),
        ]),
        element('div', {
          _gen: { condition: { expression: 'isActive' } },
        }, [text('Active content')]),
      ]),
      element('footer', {
        _gen: { slot: { name: 'footer' } },
      }, []),
    ]),
  ]);
}

// =============================================================================
// Type Guards Tests
// =============================================================================

describe('Type Guards', () => {
  it('isElement returns true for elements', () => {
    const el = element('div', {}, []);
    expect(isElement(el)).toBe(true);
  });

  it('isElement returns false for text', () => {
    const txt = text('Hello');
    expect(isElement(txt)).toBe(false);
  });

  it('isText returns true for text nodes', () => {
    const txt = text('Hello');
    expect(isText(txt)).toBe(true);
  });

  it('isRoot returns true for root nodes', () => {
    const r = root([]);
    expect(isRoot(r)).toBe(true);
  });

  it('hasAnnotations returns true for annotated elements', () => {
    const el = element('div', { _gen: { component: 'Test' } }, []);
    expect(hasAnnotations(el)).toBe(true);
  });

  it('hasAnnotations returns false for unannotated elements', () => {
    const el = element('div', {}, []);
    expect(hasAnnotations(el)).toBe(false);
  });

  it('hasAnnotation checks specific annotation', () => {
    const el = element('div', { _gen: { loop: { item: 'i', collection: 'items' } } }, []);
    expect(hasAnnotation(el, 'loop')).toBe(true);
    expect(hasAnnotation(el, 'condition')).toBe(false);
  });

  it('getAnnotations returns annotations object', () => {
    const el = element('div', { _gen: { component: 'Test' } }, []);
    const annotations = getAnnotations(el);
    expect(annotations?.component).toBe('Test');
  });
});

// =============================================================================
// Tree Traversal Tests
// =============================================================================

describe('Tree Traversal', () => {
  describe('visit', () => {
    it('visits all nodes in order', () => {
      const tree = createSimpleTree();
      const visited: string[] = [];

      visit(tree, (node) => {
        if (isElement(node)) {
          visited.push(node.tagName);
        } else if (isText(node)) {
          visited.push(`text:${node.value}`);
        } else if (isRoot(node)) {
          visited.push('root');
        }
      });

      expect(visited).toEqual([
        'root',
        'div',
        'h1',
        'text:Title',
        'p',
        'text:Introduction',
      ]);
    });

    it('stops traversal when returning false', () => {
      const tree = createSimpleTree();
      const visited: string[] = [];

      visit(tree, (node) => {
        if (isElement(node)) {
          visited.push(node.tagName);
          if (node.tagName === 'h1') return false;
        }
      });

      expect(visited).toEqual(['div', 'h1']);
    });

    it('skips children when returning "skip"', () => {
      const tree = createSimpleTree();
      const visited: string[] = [];

      visit(tree, (node) => {
        if (isElement(node)) {
          visited.push(node.tagName);
          if (node.tagName === 'h1') return 'skip';
        } else if (isText(node)) {
          visited.push(`text:${node.value}`);
        }
      });

      expect(visited).toEqual(['div', 'h1', 'p', 'text:Introduction']);
    });

    it('supports enter/exit visitor object', () => {
      const tree = createSimpleTree();
      const events: string[] = [];

      visit(tree, {
        enter: (node) => {
          if (isElement(node)) {
            events.push(`enter:${node.tagName}`);
          }
        },
        exit: (node) => {
          if (isElement(node)) {
            events.push(`exit:${node.tagName}`);
          }
        },
      });

      expect(events).toContain('enter:div');
      expect(events).toContain('exit:div');
      expect(events.indexOf('enter:h1')).toBeLessThan(events.indexOf('exit:h1'));
    });
  });

  describe('visitElements', () => {
    it('visits only element nodes', () => {
      const tree = createSimpleTree();
      const elements: string[] = [];

      visitElements(tree, (node) => {
        elements.push(node.tagName);
      });

      expect(elements).toEqual(['div', 'h1', 'p']);
    });
  });

  describe('visitText', () => {
    it('visits only text nodes', () => {
      const tree = createSimpleTree();
      const texts: string[] = [];

      visitText(tree, (node) => {
        texts.push(node.value);
      });

      expect(texts).toEqual(['Title', 'Introduction']);
    });
  });
});

// =============================================================================
// Tree Transformation Tests
// =============================================================================

describe('Tree Transformation', () => {
  describe('map', () => {
    it('transforms nodes creating new tree', () => {
      const tree = createSimpleTree();

      const mapped = map(tree, (node) => {
        if (isElement(node) && node.tagName === 'div') {
          return { ...node, tagName: 'section' };
        }
        return node;
      });

      expect(mapped.children[0]).toHaveProperty('tagName', 'section');
      // Original unchanged
      expect((tree.children[0] as GenElement).tagName).toBe('div');
    });

    it('preserves children during mapping', () => {
      const tree = createSimpleTree();

      const mapped = map(tree, (node) => node);

      expect(countNodes(mapped)).toBe(countNodes(tree));
    });
  });

  describe('filter', () => {
    it('removes nodes not matching predicate', () => {
      const tree = createSimpleTree();

      const filtered = filter(tree, (node) => {
        if (isText(node)) return true;
        if (isElement(node)) return node.tagName !== 'p';
        return true;
      });

      expect(filtered).not.toBeNull();
      const pElements = findAllByTag(filtered!, 'p');
      expect(pElements).toHaveLength(0);
    });
  });

  describe('remove', () => {
    it('removes matching nodes', () => {
      const tree = createSimpleTree();

      const result = remove(tree, (node) =>
        isElement(node) && node.tagName === 'h1'
      );

      const h1Elements = findAllByTag(result, 'h1');
      expect(h1Elements).toHaveLength(0);
    });
  });
});

// =============================================================================
// Tree Querying Tests
// =============================================================================

describe('Tree Querying', () => {
  describe('find', () => {
    it('finds first matching node', () => {
      const tree = createSimpleTree();

      const found = find(tree, (node) =>
        isElement(node) && node.tagName === 'p'
      );

      expect(found).toBeDefined();
      expect((found as GenElement).tagName).toBe('p');
    });

    it('returns undefined when not found', () => {
      const tree = createSimpleTree();

      const found = find(tree, (node) =>
        isElement(node) && node.tagName === 'article'
      );

      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('finds all matching nodes', () => {
      const tree = createAnnotatedTree();

      const elements = findAll(tree, (node) =>
        isElement(node) && node.tagName === 'div'
      );

      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('findByTag', () => {
    it('finds element by tag name', () => {
      const tree = createSimpleTree();

      const h1 = findByTag(tree, 'h1');

      expect(h1).toBeDefined();
      expect(h1?.tagName).toBe('h1');
    });
  });

  describe('findAllByTag', () => {
    it('finds all elements by tag name', () => {
      const tree = createAnnotatedTree();

      const divs = findAllByTag(tree, 'div');

      expect(divs.length).toBeGreaterThan(1);
    });
  });

  describe('findById', () => {
    it('finds element by id', () => {
      const tree = createSimpleTree();

      const intro = findById(tree, 'intro');

      expect(intro).toBeDefined();
      expect(intro?.tagName).toBe('p');
    });
  });

  describe('findByClass', () => {
    it('finds elements by class name', () => {
      const tree = createSimpleTree();

      const containers = findByClass(tree, 'container');

      expect(containers).toHaveLength(1);
      expect(containers[0].tagName).toBe('div');
    });
  });

  describe('findByAnnotation', () => {
    it('finds elements with specific annotation', () => {
      const tree = createAnnotatedTree();

      const loops = findByAnnotation(tree, 'loop');

      expect(loops).toHaveLength(1);
      expect(loops[0].tagName).toBe('ul');
    });

    it('finds multiple elements with slots', () => {
      const tree = createAnnotatedTree();

      const slots = findByAnnotation(tree, 'slot');

      expect(slots).toHaveLength(2); // header and footer
    });
  });
});

// =============================================================================
// Tree Statistics Tests
// =============================================================================

describe('Tree Statistics', () => {
  describe('countNodes', () => {
    it('counts all nodes', () => {
      const tree = createSimpleTree();

      const count = countNodes(tree);

      // root + div + h1 + text + p + text = 6
      expect(count).toBe(6);
    });
  });

  describe('countByType', () => {
    it('counts nodes by type', () => {
      const tree = createSimpleTree();

      const counts = countByType(tree);

      expect(counts['div']).toBe(1);
      expect(counts['h1']).toBe(1);
      expect(counts['p']).toBe(1);
      expect(counts['text']).toBe(2);
      expect(counts['root']).toBe(1);
    });
  });

  describe('getDepth', () => {
    it('calculates tree depth', () => {
      const tree = createSimpleTree();

      const depth = getDepth(tree);

      // root -> div -> h1 -> text = 4
      expect(depth).toBe(4);
    });

    it('returns 1 for empty root', () => {
      const tree = root([]);

      const depth = getDepth(tree);

      expect(depth).toBe(1);
    });
  });
});

// =============================================================================
// Variable Collection Tests
// =============================================================================

describe('Variable Collection', () => {
  describe('collectVariables', () => {
    it('collects variables from annotations', () => {
      const tree = createAnnotatedTree();

      const variables = collectVariables(tree);

      expect(variables).toContain('items');
      expect(variables).toContain('item');
      expect(variables).toContain('isActive');
      expect(variables).toContain('siteName');
    });

    it('returns empty array for unannotated tree', () => {
      const tree = createSimpleTree();

      const variables = collectVariables(tree);

      expect(variables).toEqual([]);
    });
  });

  describe('collectDependencies', () => {
    it('collects include dependencies', () => {
      const tree = createAnnotatedTree();

      const deps = collectDependencies(tree);

      expect(deps).toContain('partials/nav');
    });

    it('returns empty array when no includes', () => {
      const tree = createSimpleTree();

      const deps = collectDependencies(tree);

      expect(deps).toEqual([]);
    });
  });
});

// =============================================================================
// Builder Helpers Tests
// =============================================================================

describe('Builder Helpers', () => {
  describe('text', () => {
    it('creates text node', () => {
      const node = text('Hello');

      expect(node.type).toBe('text');
      expect(node.value).toBe('Hello');
    });
  });

  describe('element', () => {
    it('creates element node', () => {
      const node = element('div', { className: ['test'] }, []);

      expect(node.type).toBe('element');
      expect(node.tagName).toBe('div');
      expect(node.properties.className).toEqual(['test']);
      expect(node.children).toEqual([]);
    });

    it('creates element with default properties', () => {
      const node = element('span');

      expect(node.properties).toEqual({});
      expect(node.children).toEqual([]);
    });
  });

  describe('root', () => {
    it('creates root node', () => {
      const node = root([element('div', {}, [])]);

      expect(node.type).toBe('root');
      expect(node.children).toHaveLength(1);
    });

    it('creates root with metadata', () => {
      const node = root([], {
        sourceFile: 'test.tsx',
        componentName: 'Test',
        exports: ['Test'],
        dependencies: [],
      });

      expect(node.meta?.componentName).toBe('Test');
    });
  });

  describe('annotate', () => {
    it('adds annotations to element', () => {
      const el = element('div', {}, []);

      const annotated = annotate(el, {
        component: 'Container',
        loop: { item: 'i', collection: 'items' },
      });

      expect(annotated.properties._gen?.component).toBe('Container');
      expect(annotated.properties._gen?.loop?.collection).toBe('items');
    });

    it('merges with existing annotations', () => {
      const el = element('div', { _gen: { component: 'Test' } }, []);

      const annotated = annotate(el, { unwrap: true });

      expect(annotated.properties._gen?.component).toBe('Test');
      expect(annotated.properties._gen?.unwrap).toBe(true);
    });
  });
});

// =============================================================================
// Schema Validation Tests
// =============================================================================

describe('Schema Validation', () => {
  describe('validateRoot', () => {
    it('validates correct root structure', () => {
      const tree = createSimpleTree();

      const result = validateRoot(tree);

      expect(result.success).toBe(true);
    });

    it('fails for invalid structure', () => {
      const invalid = { type: 'root' }; // missing children

      const result = validateRoot(invalid);

      expect(result.success).toBe(false);
    });
  });

  describe('validateElement', () => {
    it('validates correct element', () => {
      const el = element('div', { className: ['test'] }, [text('hello')]);

      const result = validateElement(el);

      expect(result.success).toBe(true);
    });

    it('fails for missing tagName', () => {
      const invalid = { type: 'element', properties: {}, children: [] };

      const result = validateElement(invalid);

      expect(result.success).toBe(false);
    });
  });

  describe('validateAnnotations', () => {
    it('validates loop annotation', () => {
      const annotation = {
        loop: { item: 'product', collection: 'products' },
      };

      const result = validateAnnotations(annotation);

      expect(result.success).toBe(true);
    });

    it('fails for invalid loop (missing item)', () => {
      const annotation = {
        loop: { collection: 'products' },
      };

      const result = validateAnnotations(annotation);

      expect(result.success).toBe(false);
    });

    it('validates variable annotation', () => {
      const annotation = {
        variable: { name: 'title', default: 'Untitled', filter: 'uppercase' },
      };

      const result = validateAnnotations(annotation);

      expect(result.success).toBe(true);
    });
  });
});
