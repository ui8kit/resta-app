/**
 * Built-in DSL Component Handlers
 *
 * Default handlers for Loop, If, Var, Slot, Include, etc.
 */

import type { JSXElement } from '@babel/types';
import { element, annotate, type GenElement, type GenChild } from '../hast';
import type { IDslComponentHandler, DslHandlerContext } from './dsl-handler';
import { getNodeSource } from './jsx-parser';

// =============================================================================
// Utility: Get simple string attribute
// =============================================================================

function getStringAttr(
  attrs: Record<string, string | boolean>,
  key: string
): string | undefined {
  const value = attrs[key];
  return typeof value === 'string' ? value : undefined;
}

function getJsxAttributeMap(attributes: any[], source: string): Record<string, string | boolean> {
  const map: Record<string, string | boolean> = {};
  
  for (const attr of attributes) {
    if (attr.type !== 'JSXAttribute') continue;
    if (attr.name.type !== 'JSXIdentifier') continue;
    
    const name = attr.name.name;
    const value = attr.value;
    
    if (!value) {
      map[name] = true;
      continue;
    }
    
    if (value.type === 'StringLiteral') {
      map[name] = value.value;
    } else if (value.type === 'JSXExpressionContainer') {
      const expr = value.expression;
      if (expr.type === 'StringLiteral') {
        map[name] = expr.value;
      } else if (expr.type === 'BooleanLiteral') {
        map[name] = expr.value;
      } else {
        map[name] = getNodeSource(source, expr);
      }
    }
  }
  
  return map;
}

// =============================================================================
// Loop Handler
// =============================================================================

class LoopHandler implements IDslComponentHandler {
  tagName = 'Loop';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    const attrs = getJsxAttributeMap(node.openingElement.attributes, ctx.source);
    
    const each = getStringAttr(attrs, 'each');
    const as = getStringAttr(attrs, 'as');
    const keyExpr = getStringAttr(attrs, 'keyExpr');
    const index = getStringAttr(attrs, 'index');
    
    if (!each || !as) {
      ctx.warnings.push(`Loop requires 'each' and 'as' props`);
      return element('div', {}, children);
    }
    
    return annotate(
      element('div', {}, children),
      {
        loop: {
          item: as,
          collection: each,
          key: keyExpr,
          index: index,
        },
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// If Handler
// =============================================================================

class IfHandler implements IDslComponentHandler {
  tagName = 'If';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    const attrs = getJsxAttributeMap(node.openingElement.attributes, ctx.source);
    const test = getStringAttr(attrs, 'test');
    
    if (!test) {
      ctx.warnings.push(`If requires 'test' prop`);
      return element('div', {}, children);
    }
    
    ctx.variables.add(test.split(/[.\s]/)[0]);
    
    return annotate(
      element('div', {}, children),
      {
        condition: { expression: test },
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// Else Handler
// =============================================================================

class ElseHandler implements IDslComponentHandler {
  tagName = 'Else';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    return annotate(
      element('div', {}, children),
      {
        condition: { expression: '', isElse: true },
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// ElseIf Handler
// =============================================================================

class ElseIfHandler implements IDslComponentHandler {
  tagName = 'ElseIf';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    const attrs = getJsxAttributeMap(node.openingElement.attributes, ctx.source);
    const test = getStringAttr(attrs, 'test');
    
    if (!test) {
      ctx.warnings.push(`ElseIf requires 'test' prop`);
      return element('div', {}, children);
    }
    
    return annotate(
      element('div', {}, children),
      {
        condition: { expression: test, isElseIf: true },
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// Var Handler
// =============================================================================

class VarHandler implements IDslComponentHandler {
  tagName = 'Var';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    const attrs = getJsxAttributeMap(node.openingElement.attributes, ctx.source);
    
    const name = getStringAttr(attrs, 'name');
    const defaultVal = getStringAttr(attrs, 'default');
    const filter = getStringAttr(attrs, 'filter');
    const raw = attrs.raw === 'true' || attrs.raw === true;
    
    let varName = name;
    if (!varName && children.length === 1) {
      const child = children[0];
      if (child.type === 'text') {
        varName = child.value.trim();
      }
    }
    
    if (!varName) {
      ctx.warnings.push(`Var requires 'name' prop or text children`);
      return element('span', {}, []);
    }
    
    ctx.variables.add(varName.split('.')[0]);
    
    return annotate(
      element('span', {}, []),
      {
        variable: {
          name: varName,
          default: defaultVal,
          filter: filter,
        },
        raw: raw,
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// Slot Handler
// =============================================================================

class SlotHandler implements IDslComponentHandler {
  tagName = 'Slot';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    const attrs = getJsxAttributeMap(node.openingElement.attributes, ctx.source);
    const name = getStringAttr(attrs, 'name') || 'content';
    
    return annotate(
      element('div', {}, children),
      {
        slot: { name },
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// Include Handler
// =============================================================================

class IncludeHandler implements IDslComponentHandler {
  tagName = 'Include';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    const attrs = getJsxAttributeMap(node.openingElement.attributes, ctx.source);
    const partial = getStringAttr(attrs, 'partial');
    const propsStr = getStringAttr(attrs, 'props');
    
    if (!partial) {
      ctx.warnings.push(`Include requires 'partial' prop`);
      return element('div', {}, []);
    }
    
    let props: Record<string, string> = {};
    if (propsStr) {
      try {
        props = JSON.parse(propsStr);
      } catch {
        // Try to parse as object expression
      }
    }
    
    ctx.dependencies.add(partial);
    
    return annotate(
      element('div', {}, []),
      {
        include: {
          partial,
          props,
        },
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// DefineBlock Handler
// =============================================================================

class DefineBlockHandler implements IDslComponentHandler {
  tagName = 'DefineBlock';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    const attrs = getJsxAttributeMap(node.openingElement.attributes, ctx.source);
    const name = getStringAttr(attrs, 'name');
    
    if (!name) {
      ctx.warnings.push(`DefineBlock requires 'name' prop`);
      return element('div', {}, children);
    }
    
    return annotate(
      element('div', {}, children),
      {
        block: { name },
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// Extends Handler
// =============================================================================

class ExtendsHandler implements IDslComponentHandler {
  tagName = 'Extends';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    const attrs = getJsxAttributeMap(node.openingElement.attributes, ctx.source);
    const layout = getStringAttr(attrs, 'layout');
    
    if (!layout) {
      ctx.warnings.push(`Extends requires 'layout' prop`);
      return element('div', {}, []);
    }
    
    return annotate(
      element('div', {}, []),
      {
        block: { name: '__extends__', extends: layout },
      }
    );
  }
}

// =============================================================================
// Raw Handler
// =============================================================================

class RawHandler implements IDslComponentHandler {
  tagName = 'Raw';

  handle(node: JSXElement, children: GenChild[], ctx: DslHandlerContext): GenElement | null {
    let varName = '';
    if (children.length === 1) {
      const child = children[0];
      if (child.type === 'text') {
        varName = child.value.trim();
      }
    }
    
    return annotate(
      element('span', {}, []),
      {
        variable: { name: varName },
        raw: true,
        unwrap: true,
      }
    );
  }
}

// =============================================================================
// Export Built-in Handlers
// =============================================================================

export const BUILT_IN_DSL_HANDLERS: IDslComponentHandler[] = [
  new LoopHandler(),
  new IfHandler(),
  new ElseHandler(),
  new ElseIfHandler(),
  new VarHandler(),
  new SlotHandler(),
  new IncludeHandler(),
  new DefineBlockHandler(),
  new ExtendsHandler(),
  new RawHandler(),
];
