/**
 * Tests for LiquidPlugin
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LiquidPlugin } from './LiquidPlugin';
import {
  root,
  element,
  text,
  annotate,
  type GenRoot,
} from '../../../hast';
import type { TemplatePluginContext } from '../ITemplatePlugin';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockContext(): TemplatePluginContext {
  return {
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as any,
    config: {
      fileExtension: '.liquid',
      outputDir: './dist/templates',
      prettyPrint: false,
    },
    outputDir: './dist/templates',
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('LiquidPlugin', () => {
  let plugin: LiquidPlugin;

  beforeEach(async () => {
    plugin = new LiquidPlugin();
    await plugin.initialize(createMockContext());
  });

  describe('Identity', () => {
    it('has correct name', () => {
      expect(plugin.name).toBe('liquid');
    });

    it('has correct file extension', () => {
      expect(plugin.fileExtension).toBe('.liquid');
    });

    it('has js runtime', () => {
      expect(plugin.runtime).toBe('js');
    });

    it('supports partials', () => {
      expect(plugin.features.supportsPartials).toBe(true);
    });

    it('supports filters', () => {
      expect(plugin.features.supportsFilters).toBe(true);
    });

    it('does not support inheritance', () => {
      expect(plugin.features.supportsInheritance).toBe(false);
    });
  });

  describe('renderLoop', () => {
    it('renders simple for loop', () => {
      const result = plugin.renderLoop(
        { item: 'product', collection: 'products' },
        '<div>{{ product.name }}</div>'
      );

      expect(result).toContain('{% for product in products %}');
      expect(result).toContain('{% endfor %}');
      expect(result).toContain('<div>{{ product.name }}</div>');
    });

    it('renders loop with nested content', () => {
      const result = plugin.renderLoop(
        { item: 'item', collection: 'items' },
        '  <li>{{ item.title }}</li>'
      );

      expect(result).toBe(
        '{% for item in items %}\n  <li>{{ item.title }}</li>\n{% endfor %}'
      );
    });
  });

  describe('renderCondition', () => {
    it('renders simple if condition', () => {
      const result = plugin.renderCondition(
        { expression: 'isActive' },
        '<span>Active</span>'
      );

      expect(result).toContain('{% if isActive %}');
      expect(result).toContain('{% endif %}');
    });

    it('converts && to and', () => {
      const result = plugin.renderCondition(
        { expression: 'isAdmin && isLoggedIn' },
        'Content'
      );

      expect(result).toContain('{% if isAdmin and isLoggedIn %}');
    });

    it('converts || to or', () => {
      const result = plugin.renderCondition(
        { expression: 'isError || isEmpty' },
        'Content'
      );

      expect(result).toContain('{% if isError or isEmpty %}');
    });

    it('converts ! to not', () => {
      const result = plugin.renderCondition(
        { expression: '!isHidden' },
        'Content'
      );

      expect(result).toContain('{% if not isHidden %}');
    });

    it('renders else branch', () => {
      const result = plugin.renderCondition(
        { expression: '', isElse: true },
        '<span>Fallback</span>'
      );

      expect(result).toContain('{% else %}');
      expect(result).toContain('<span>Fallback</span>');
    });

    it('renders elsif branch', () => {
      const result = plugin.renderCondition(
        { expression: 'isPending', isElseIf: true },
        '<span>Pending</span>'
      );

      expect(result).toContain('{% elsif isPending %}');
    });
  });

  describe('renderVariable', () => {
    it('renders simple variable', () => {
      const result = plugin.renderVariable({ name: 'title' });

      expect(result).toBe('{{ title }}');
    });

    it('renders variable with default', () => {
      const result = plugin.renderVariable({
        name: 'title',
        default: 'Untitled',
      });

      expect(result).toBe('{{ title | default: "Untitled" }}');
    });

    it('renders variable with filter', () => {
      const result = plugin.renderVariable({
        name: 'name',
        filter: 'uppercase',
      });

      expect(result).toBe('{{ name | upcase }}');
    });

    it('renders variable with default and filter', () => {
      const result = plugin.renderVariable({
        name: 'title',
        default: 'Untitled',
        filter: 'uppercase',
      });

      expect(result).toContain('default:');
      expect(result).toContain('upcase');
    });
  });

  describe('renderSlot', () => {
    it('renders slot with default content', () => {
      const result = plugin.renderSlot(
        { name: 'header' },
        '<header>Default Header</header>'
      );

      expect(result).toContain('header_content');
      expect(result).toContain('{% if');
      expect(result).toContain('{% else %}');
      expect(result).toContain('<header>Default Header</header>');
    });

    it('renders empty slot', () => {
      const result = plugin.renderSlot({ name: 'sidebar' }, '');

      expect(result).toBe('{{ sidebar_content }}');
    });
  });

  describe('renderInclude', () => {
    it('renders simple include', () => {
      const result = plugin.renderInclude({ partial: 'partials/header' });

      expect(result).toBe("{% include 'partials/header.liquid' %}");
    });

    it('renders include with props', () => {
      const result = plugin.renderInclude({
        partial: 'partials/card',
        props: { title: 'cardTitle', image: 'cardImage' },
      });

      expect(result).toContain("{% include 'partials/card.liquid'");
      expect(result).toContain('title: cardTitle');
      expect(result).toContain('image: cardImage');
    });

    it('preserves .liquid extension if present', () => {
      const result = plugin.renderInclude({ partial: 'header.liquid' });

      expect(result).toBe("{% include 'header.liquid' %}");
    });
  });

  describe('renderComment', () => {
    it('renders comment', () => {
      const result = plugin.renderComment('This is a comment');

      expect(result).toBe('{% comment %}This is a comment{% endcomment %}');
    });
  });

  describe('renderElse', () => {
    it('renders plain else', () => {
      const result = plugin.renderElse();

      expect(result).toBe('{% else %}');
    });

    it('renders elsif with condition', () => {
      const result = plugin.renderElse('isPending');

      expect(result).toBe('{% elsif isPending %}');
    });
  });

  describe('Filter Mappings', () => {
    it('maps uppercase to upcase', () => {
      const filter = plugin.getFilter('uppercase');
      expect(filter?.name).toBe('upcase');
    });

    it('maps lowercase to downcase', () => {
      const filter = plugin.getFilter('lowercase');
      expect(filter?.name).toBe('downcase');
    });

    it('maps length to size', () => {
      const filter = plugin.getFilter('length');
      expect(filter?.name).toBe('size');
    });

    it('applies filter with arguments', () => {
      const result = plugin.applyFilter('items', 'join', ['-']);
      expect(result).toContain('join');
      expect(result).toContain('-');
    });
  });

  describe('transform', () => {
    it('transforms simple tree', async () => {
      const tree: GenRoot = root([
        element('div', { className: ['container'] }, [
          element('h1', {}, [text('Hello')]),
        ]),
      ], {
        sourceFile: 'test.tsx',
        componentName: 'TestComponent',
        exports: ['TestComponent'],
        dependencies: [],
      });

      const output = await plugin.transform(tree);

      expect(output.filename).toBe('test-component.liquid');
      expect(output.content).toContain('<div class="container">');
      expect(output.content).toContain('<h1>Hello</h1>');
    });

    it('transforms tree with loop annotation', async () => {
      const tree: GenRoot = root([
        annotate(
          element('ul', {}, [
            element('li', {}, [text('Item')]),
          ]),
          { loop: { item: 'item', collection: 'items' } }
        ),
      ], {
        sourceFile: 'list.tsx',
        componentName: 'List',
        exports: ['List'],
        dependencies: [],
      });

      const output = await plugin.transform(tree);

      expect(output.content).toContain('{% for item in items %}');
      expect(output.content).toContain('{% endfor %}');
      expect(output.variables).toContain('items');
    });

    it('transforms tree with variable annotation', async () => {
      const tree: GenRoot = root([
        annotate(
          element('span', {}, []),
          { variable: { name: 'userName', default: 'Guest' } }
        ),
      ], {
        sourceFile: 'user.tsx',
        componentName: 'User',
        exports: ['User'],
        dependencies: [],
      });

      const output = await plugin.transform(tree);

      expect(output.content).toContain('{{ userName | default: "Guest" }}');
      expect(output.variables).toContain('userName');
    });

    it('collects dependencies from includes', async () => {
      const tree: GenRoot = root([
        annotate(
          element('div', {}, []),
          { include: { partial: 'partials/header' } }
        ),
      ], {
        sourceFile: 'layout.tsx',
        componentName: 'Layout',
        exports: ['Layout'],
        dependencies: [],
      });

      const output = await plugin.transform(tree);

      expect(output.dependencies).toContain('partials/header');
    });
  });

  describe('validate', () => {
    it('validates balanced if tags', () => {
      const valid = '{% if x %}<div></div>{% endif %}';
      const result = plugin.validate(valid);
      expect(result.valid).toBe(true);
    });

    it('detects unbalanced if tags', () => {
      const invalid = '{% if x %}<div></div>';
      const result = plugin.validate(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('validates balanced output tags', () => {
      const valid = '{{ title }}{{ description }}';
      const result = plugin.validate(valid);
      expect(result.valid).toBe(true);
    });

    it('detects unbalanced output tags', () => {
      const invalid = '{{ title }';
      const result = plugin.validate(invalid);
      expect(result.valid).toBe(false);
    });
  });

  describe('HTML Rendering', () => {
    it('renders opening tag', () => {
      const result = plugin.renderOpeningTag('div', { class: 'container', id: 'main' });
      expect(result).toBe('<div class="container" id="main">');
    });

    it('renders closing tag', () => {
      const result = plugin.renderClosingTag('div');
      expect(result).toBe('</div>');
    });

    it('renders self-closing tag', () => {
      const result = plugin.renderSelfClosingTag('img', { src: 'image.png', alt: 'Test' });
      expect(result).toBe('<img src="image.png" alt="Test" />');
    });

    it('renders boolean attributes', () => {
      const result = plugin.renderOpeningTag('input', { type: 'checkbox', checked: true, disabled: false });
      expect(result).toContain('checked');
      expect(result).not.toContain('disabled');
    });
  });
});
