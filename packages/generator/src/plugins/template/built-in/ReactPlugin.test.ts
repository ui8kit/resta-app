/**
 * Tests for ReactPlugin
 *
 * Validates DSL → React JSX transformation:
 * - Var       → {value}
 * - If        → ternary / IIFE
 * - Loop      → .map() with auto key
 * - Slot      → {children} / {name}
 * - Include   → <Component />
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReactPlugin } from './ReactPlugin';
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
      fileExtension: '.tsx',
      outputDir: './dist/templates',
      prettyPrint: false,
    },
    outputDir: './dist/templates',
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('ReactPlugin', () => {
  let plugin: ReactPlugin;

  beforeEach(async () => {
    plugin = new ReactPlugin();
    await plugin.initialize(createMockContext());
  });

  // ===========================================================================
  // Identity
  // ===========================================================================

  describe('Identity', () => {
    it('has correct name', () => {
      expect(plugin.name).toBe('react');
    });

    it('has correct file extension', () => {
      expect(plugin.fileExtension).toBe('.tsx');
    });

    it('has js runtime', () => {
      expect(plugin.runtime).toBe('js');
    });

    it('supports partials', () => {
      expect(plugin.features.supportsPartials).toBe(true);
    });

    it('does not support filters (uses JS methods)', () => {
      expect(plugin.features.supportsFilters).toBe(false);
    });

    it('does not support inheritance', () => {
      expect(plugin.features.supportsInheritance).toBe(false);
    });
  });

  // ===========================================================================
  // renderVariable
  // ===========================================================================

  describe('renderVariable', () => {
    it('renders simple variable', () => {
      const result = plugin.renderVariable({ name: 'title' });
      expect(result).toBe('{title}');
    });

    it('renders variable with default (nullish coalescing)', () => {
      const result = plugin.renderVariable({
        name: 'title',
        default: 'Untitled',
      });
      expect(result).toBe('{title ?? "Untitled"}');
    });

    it('renders variable with numeric default', () => {
      const result = plugin.renderVariable({
        name: 'count',
        default: '0',
      });
      expect(result).toBe('{count ?? 0}');
    });

    it('renders variable with boolean default', () => {
      const result = plugin.renderVariable({
        name: 'isActive',
        default: 'false',
      });
      expect(result).toBe('{isActive ?? false}');
    });

    it('renders variable with filter as JS method', () => {
      const result = plugin.renderVariable({
        name: 'name',
        filter: 'uppercase',
      });
      expect(result).toBe('{name.toUpperCase()}');
    });

    it('renders variable with lowercase filter', () => {
      const result = plugin.renderVariable({
        name: 'name',
        filter: 'lowercase',
      });
      expect(result).toBe('{name.toLowerCase()}');
    });

    it('renders variable with trim filter', () => {
      const result = plugin.renderVariable({
        name: 'input',
        filter: 'trim',
      });
      expect(result).toBe('{input.trim()}');
    });

    it('renders variable with json filter', () => {
      const result = plugin.renderVariable({
        name: 'data',
        filter: 'json',
      });
      expect(result).toBe('{JSON.stringify(data)}');
    });

    it('renders variable with length filter', () => {
      const result = plugin.renderVariable({
        name: 'items',
        filter: 'length',
      });
      expect(result).toBe('{items.length}');
    });
  });

  // ===========================================================================
  // renderCondition
  // ===========================================================================

  describe('renderCondition', () => {
    it('renders simple if → ternary with null', () => {
      const result = plugin.renderCondition(
        { expression: 'isActive' },
        '<span>Active</span>',
      );

      expect(result).toBe('{isActive ? (<><span>Active</span></>) : null}');
    });

    it('renders if/else → ternary', () => {
      // First, render the else branch (as child of the if content)
      const elseBranch = plugin.renderCondition(
        { expression: '', isElse: true },
        '<span>Inactive</span>',
      );

      // Then render the main if with else branch in content
      const result = plugin.renderCondition(
        { expression: 'isActive' },
        `<span>Active</span>${elseBranch}`,
      );

      expect(result).toContain('isActive ?');
      expect(result).toContain('<span>Active</span>');
      expect(result).toContain('<span>Inactive</span>');
      expect(result).not.toContain('null');
    });

    it('renders if/elseif/else → IIFE', () => {
      // Render elseif branch
      const elseIfBranch = plugin.renderCondition(
        { expression: 'isPending', isElseIf: true },
        '<span>Pending</span>',
      );

      // Render else branch
      const elseBranch = plugin.renderCondition(
        { expression: '', isElse: true },
        '<span>Unknown</span>',
      );

      // Render main if with branches
      const result = plugin.renderCondition(
        { expression: 'isActive' },
        `<span>Active</span>${elseIfBranch}${elseBranch}`,
      );

      expect(result).toContain('{(() => {');
      expect(result).toContain('if (isActive) return');
      expect(result).toContain('if (isPending) return');
      expect(result).toContain('<span>Active</span>');
      expect(result).toContain('<span>Pending</span>');
      expect(result).toContain('<span>Unknown</span>');
      expect(result).toContain('})()}');
    });

    it('renders if/elseif without else → IIFE with null fallback', () => {
      const elseIfBranch = plugin.renderCondition(
        { expression: 'isPending', isElseIf: true },
        '<span>Pending</span>',
      );

      const result = plugin.renderCondition(
        { expression: 'isActive' },
        `<span>Active</span>${elseIfBranch}`,
      );

      expect(result).toContain('{(() => {');
      expect(result).toContain('return null;');
      expect(result).toContain('})()}');
    });

    it('renders multiple elseif branches', () => {
      const elseIf1 = plugin.renderCondition(
        { expression: 'status === "pending"', isElseIf: true },
        '<span>Pending</span>',
      );

      const elseIf2 = plugin.renderCondition(
        { expression: 'status === "error"', isElseIf: true },
        '<span>Error</span>',
      );

      const elseBranch = plugin.renderCondition(
        { expression: '', isElse: true },
        '<span>Unknown</span>',
      );

      const result = plugin.renderCondition(
        { expression: 'status === "active"' },
        `<span>Active</span>${elseIf1}${elseIf2}${elseBranch}`,
      );

      expect(result).toContain('if (status === "active") return');
      expect(result).toContain('if (status === "pending") return');
      expect(result).toContain('if (status === "error") return');
      expect(result).toContain('<span>Unknown</span>');
    });
  });

  // ===========================================================================
  // renderElse (standalone)
  // ===========================================================================

  describe('renderElse', () => {
    it('renders plain else marker', () => {
      const result = plugin.renderElse();
      expect(result).toContain('___REACT_ELSE___');
    });

    it('renders elseif marker with condition', () => {
      const result = plugin.renderElse('isPending');
      expect(result).toContain('___REACT_ELSEIF___');
      expect(result).toContain('isPending');
    });
  });

  // ===========================================================================
  // renderLoop
  // ===========================================================================

  describe('renderLoop', () => {
    it('renders .map() with auto key (id fallback index)', () => {
      const result = plugin.renderLoop(
        { item: 'product', collection: 'products' },
        '<div>{product.name}</div>',
      );

      expect(result).toContain('{products.map((product, index) => (');
      expect(result).toContain('<Fragment key={product.id ?? index}>');
      expect(result).toContain('<div>{product.name}</div>');
      expect(result).toContain('</Fragment>');
      expect(result).toContain('))}');
    });

    it('renders loop with explicit key field', () => {
      const result = plugin.renderLoop(
        { item: 'item', collection: 'items', key: 'slug' },
        '<li>{item.title}</li>',
      );

      expect(result).toContain('key={item.slug}');
    });

    it('renders loop with custom index variable', () => {
      const result = plugin.renderLoop(
        { item: 'item', collection: 'items', index: 'i' },
        '<li>{item.title}</li>',
      );

      expect(result).toContain('(item, i)');
      expect(result).toContain('item.id ?? i');
    });
  });

  // ===========================================================================
  // renderSlot
  // ===========================================================================

  describe('renderSlot', () => {
    it('renders default slot as children', () => {
      const result = plugin.renderSlot({ name: 'default' }, '');
      expect(result).toBe('{children}');
    });

    it('renders children slot', () => {
      const result = plugin.renderSlot({ name: 'children' }, '');
      expect(result).toBe('{children}');
    });

    it('renders default slot with fallback', () => {
      const result = plugin.renderSlot(
        { name: 'default' },
        '<p>No content</p>',
      );
      expect(result).toBe('{children ?? (<><p>No content</p></>)}');
    });

    it('renders named slot as prop', () => {
      const result = plugin.renderSlot({ name: 'sidebar' }, '');
      expect(result).toBe('{sidebar}');
    });

    it('renders named slot with default content', () => {
      const result = plugin.renderSlot(
        { name: 'header' },
        '<header>Default Header</header>',
      );
      expect(result).toBe('{header ?? (<><header>Default Header</header></>)}');
    });
  });

  // ===========================================================================
  // renderInclude
  // ===========================================================================

  describe('renderInclude', () => {
    it('renders simple component import', () => {
      const result = plugin.renderInclude({ partial: 'partials/header' });
      expect(result).toBe('<Header />');
    });

    it('renders component with props', () => {
      const result = plugin.renderInclude({
        partial: 'partials/card',
        props: { title: 'cardTitle', image: 'cardImage' },
      });

      expect(result).toContain('<Card');
      expect(result).toContain('title={cardTitle}');
      expect(result).toContain('image={cardImage}');
      expect(result).toContain('/>');
    });

    it('converts kebab-case path to PascalCase', () => {
      const result = plugin.renderInclude({
        partial: 'components/user-card',
      });
      expect(result).toBe('<UserCard />');
    });

    it('converts snake_case path to PascalCase', () => {
      const result = plugin.renderInclude({
        partial: 'components/nav_menu',
      });
      expect(result).toBe('<NavMenu />');
    });
  });

  // ===========================================================================
  // renderBlock / renderExtends
  // ===========================================================================

  describe('renderBlock', () => {
    it('renders block with comment markers', () => {
      const result = plugin.renderBlock(
        { name: 'content' },
        '<main>Page Content</main>',
      );

      expect(result).toContain('{/* block: content */}');
      expect(result).toContain('<main>Page Content</main>');
      expect(result).toContain('{/* /block: content */}');
    });
  });

  describe('renderExtends', () => {
    it('renders warning comment', () => {
      const result = plugin.renderExtends('layouts/base');
      expect(result).toContain('{/* extends: layouts/base');
      expect(result).toContain('composition');
    });
  });

  // ===========================================================================
  // renderComment
  // ===========================================================================

  describe('renderComment', () => {
    it('renders JSX comment', () => {
      const result = plugin.renderComment('This is a comment');
      expect(result).toBe('{/* This is a comment */}');
    });
  });

  // ===========================================================================
  // JSX Attributes
  // ===========================================================================

  describe('HTML/JSX Rendering', () => {
    it('renders opening tag with className (not class)', () => {
      const result = plugin.renderOpeningTag('div', {
        className: 'container',
        id: 'main',
      });
      expect(result).toBe('<div className="container" id="main">');
    });

    it('renders self-closing tag', () => {
      const result = plugin.renderSelfClosingTag('img', {
        src: 'image.png',
        alt: 'Test',
      });
      expect(result).toBe('<img src="image.png" alt="Test" />');
    });

    it('renders boolean attributes', () => {
      const result = plugin.renderOpeningTag('input', {
        type: 'checkbox',
        checked: true,
        disabled: false,
      });
      expect(result).toContain('checked');
      expect(result).not.toContain('disabled');
    });

    it('renders style as JSX object', () => {
      const result = plugin.renderOpeningTag('div', {
        style: { color: 'red', 'font-size': '16px' },
      });
      expect(result).toContain('style={');
      expect(result).toContain('color: "red"');
      expect(result).toContain('fontSize: "16px"');
    });
  });

  // ===========================================================================
  // transform (full tree)
  // ===========================================================================

  describe('transform', () => {
    it('transforms simple tree', async () => {
      const tree: GenRoot = root(
        [
          element('div', { className: ['container'] }, [
            element('h1', {}, [text('Hello')]),
          ]),
        ],
        {
          sourceFile: 'test.tsx',
          componentName: 'TestComponent',
          exports: ['TestComponent'],
          dependencies: [],
        },
      );

      const output = await plugin.transform(tree);

      expect(output.filename).toBe('TestComponent.tsx');
      expect(output.content).toContain('<div className="container">');
      expect(output.content).toContain('<h1>');
      expect(output.content).toContain('Hello');
    });

    it('transforms tree with loop annotation', async () => {
      const tree: GenRoot = root(
        [
          annotate(
            element('ul', {}, [element('li', {}, [text('Item')])]),
            { loop: { item: 'item', collection: 'items' } },
          ),
        ],
        {
          sourceFile: 'list.tsx',
          componentName: 'List',
          exports: ['List'],
          dependencies: [],
        },
      );

      const output = await plugin.transform(tree);

      expect(output.content).toContain('{items.map(');
      expect(output.content).toContain('Fragment');
      expect(output.variables).toContain('items');
    });

    it('transforms tree with variable annotation', async () => {
      const tree: GenRoot = root(
        [
          annotate(element('span', {}, []), {
            variable: { name: 'userName', default: 'Guest' },
          }),
        ],
        {
          sourceFile: 'user.tsx',
          componentName: 'User',
          exports: ['User'],
          dependencies: [],
        },
      );

      const output = await plugin.transform(tree);

      expect(output.content).toContain('{userName ?? "Guest"}');
      expect(output.variables).toContain('userName');
    });

    it('uses PascalCase filename', async () => {
      const tree: GenRoot = root(
        [element('div', {}, [text('Hello')])],
        {
          sourceFile: 'hero-block.tsx',
          componentName: 'HeroBlock',
          exports: ['HeroBlock'],
          dependencies: [],
        },
      );

      const output = await plugin.transform(tree);

      expect(output.filename).toBe('HeroBlock.tsx');
    });

    it('collects dependencies from includes', async () => {
      const tree: GenRoot = root(
        [
          annotate(element('div', {}, []), {
            include: { partial: 'partials/header' },
          }),
        ],
        {
          sourceFile: 'layout.tsx',
          componentName: 'Layout',
          exports: ['Layout'],
          dependencies: [],
        },
      );

      const output = await plugin.transform(tree);

      expect(output.dependencies).toContain('partials/header');
    });

    it('emits full file with imports and export function when meta.imports is set', async () => {
      const tree: GenRoot = root(
        [element('div', { className: ['container'] }, [element('h1', {}, [text('Hello')])])],
        {
          sourceFile: 'page.tsx',
          componentName: 'HomePage',
          exports: ['HomePage'],
          dependencies: [],
          imports: [
            {
              source: 'react',
              defaultImport: 'React',
              namedImports: [],
              isTypeOnly: false,
            },
            {
              source: '@ui8kit/core',
              defaultImport: undefined,
              namedImports: ['Block', 'Text'],
              isTypeOnly: false,
            },
          ],
        },
      );

      const output = await plugin.transform(tree);

      expect(output.content).toContain("import React from 'react';");
      expect(output.content).toContain("import { Block, Text } from '@ui8kit/core';");
      expect(output.content).toContain('export function HomePage() {');
      expect(output.content).toContain('  return (');
      expect(output.content).toContain('<div className="container">');
      expect(output.content).toContain('<h1>');
      expect(output.content).toContain('Hello');
      expect(output.content).toContain('  );');
      expect(output.content).toContain('}\n');
    });

    it('emits type-only imports for TS compilation (e.g. ReactNode)', async () => {
      const tree: GenRoot = root(
        [element('div', {}, [text('x')])],
        {
          sourceFile: 'comp.tsx',
          componentName: 'Comp',
          exports: ['Comp'],
          dependencies: [],
          imports: [
            {
              source: './types',
              defaultImport: undefined,
              namedImports: ['Props'],
              isTypeOnly: true,
            },
            {
              source: 'react',
              defaultImport: undefined,
              namedImports: ['useState'],
              isTypeOnly: false,
            },
          ],
        },
      );

      const output = await plugin.transform(tree);

      expect(output.content).toContain("import type { Props } from './types'");
      expect(output.content).toContain("import { useState } from 'react';");
      expect(output.content).toContain('export function Comp() {');
    });
  });

  // ===========================================================================
  // validate
  // ===========================================================================

  describe('validate', () => {
    it('validates balanced braces', () => {
      const valid = '{isActive ? (<span>Yes</span>) : null}';
      const result = plugin.validate(valid);
      expect(result.valid).toBe(true);
    });

    it('detects unbalanced opening braces', () => {
      const invalid = '{isActive ? (<span>Yes</span>) : null';
      const result = plugin.validate(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain('unclosed');
    });

    it('detects unbalanced closing braces', () => {
      const invalid = 'isActive ? (<span>Yes</span>) : null}';
      const result = plugin.validate(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain('extra closing');
    });

    it('detects leftover branch markers', () => {
      const invalid = '{isActive ? ___REACT_ELSE___content___REACT_END___ : null}';
      const result = plugin.validate(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain('markers');
    });

    it('validates clean IIFE output', () => {
      const valid = '{(() => { if (a) return (<>A</>); return (<>B</>); })()}';
      const result = plugin.validate(valid);
      expect(result.valid).toBe(true);
    });
  });

  // ===========================================================================
  // JS Filter Application
  // ===========================================================================

  describe('applyFilter', () => {
    it('applies uppercase as toUpperCase()', () => {
      const result = plugin.applyFilter('name', 'uppercase');
      expect(result).toBe('name.toUpperCase()');
    });

    it('applies lowercase as toLowerCase()', () => {
      const result = plugin.applyFilter('name', 'lowercase');
      expect(result).toBe('name.toLowerCase()');
    });

    it('applies join with argument', () => {
      const result = plugin.applyFilter('items', 'join', ['-']);
      expect(result).toContain('join');
      expect(result).toContain('-');
    });

    it('applies first as array access', () => {
      const result = plugin.applyFilter('items', 'first');
      expect(result).toBe('items[0]');
    });

    it('passes unknown filter as method call', () => {
      const result = plugin.applyFilter('value', 'customFilter');
      expect(result).toBe('value.customFilter()');
    });
  });
});
