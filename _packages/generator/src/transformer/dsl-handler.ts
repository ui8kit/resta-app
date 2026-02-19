/**
 * DSL Component Handler System
 *
 * Allows extensible DSL component handling via pluggable handlers.
 * Replaces hardcoded switch statement in HAST builder.
 */

import type { JSXElement } from '@babel/types';
import type { GenElement, GenChild } from '../hast';
import type { TransformOptions } from './types';

// =============================================================================
// Handler Interface
// =============================================================================

/**
 * Context passed to DSL handlers for transformation.
 */
export interface DslHandlerContext {
  /** Source code being transformed */
  readonly source: string;
  
  /** Accumulate warnings during transformation */
  warnings: string[];
  
  /** Track variables found in this handler */
  variables: Set<string>;
  
  /** Track dependencies found in this handler */
  dependencies: Set<string>;
  
  /** Transform options from user */
  readonly options: TransformOptions;
}

/**
 * Handles transformation of a single DSL component type.
 * 
 * Example: LoopHandler handles <Loop each="items" as="item">
 */
export interface IDslComponentHandler {
  /** Name of the DSL component tag (e.g., "Loop", "If", "Var") */
  readonly tagName: string;

  /**
   * Transform a DSL component element to HAST.
   * 
   * @param node The JSX element being transformed
   * @param children Pre-transformed child elements
   * @param context Handler context with source, warnings, variables, etc.
   * @returns GenElement or null if handler can't process this node
   */
  handle(
    node: JSXElement,
    children: GenChild[],
    context: DslHandlerContext
  ): GenElement | null;
}

// =============================================================================
// Registry
// =============================================================================

/**
 * Registry for DSL component handlers.
 * Allows registration of built-in and custom handlers.
 */
export class DslRegistry {
  private handlers = new Map<string, IDslComponentHandler>();

  /**
   * Register a new handler.
   */
  register(handler: IDslComponentHandler): void {
    if (this.handlers.has(handler.tagName)) {
      console.warn(`DSL handler for '${handler.tagName}' already registered, overwriting`);
    }
    this.handlers.set(handler.tagName, handler);
  }

  /**
   * Get a handler by tag name.
   */
  get(tagName: string): IDslComponentHandler | undefined {
    return this.handlers.get(tagName);
  }

  /**
   * Check if a handler exists.
   */
  has(tagName: string): boolean {
    return this.handlers.has(tagName);
  }

  /**
   * Get all registered tag names.
   */
  get tags(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers.
   */
  clear(): void {
    this.handlers.clear();
  }
}
