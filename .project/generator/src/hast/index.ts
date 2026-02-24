/**
 * HAST Module - Hypertext Abstract Syntax Tree for Generator
 *
 * This module provides extended HAST types and utilities for template generation.
 * Based on the unified ecosystem standard with generator-specific annotations.
 *
 * @example
 * ```ts
 * import { GenRoot, GenElement, visit, element, text } from '@ui8kit/generator/hast';
 *
 * // Create a tree
 * const tree: GenRoot = root([
 *   element('div', { className: ['container'] }, [
 *     text('Hello, World!')
 *   ])
 * ]);
 *
 * // Traverse
 * visit(tree, (node) => {
 *   if (isElement(node)) {
 *     console.log(node.tagName);
 *   }
 * });
 * ```
 */

// Types
export type {
  // Node types
  GenNodeType,
  GenNode,
  GenElement,
  GenText,
  GenComment,
  GenDoctype,
  GenChild,
  GenRoot,
  // Annotation types
  GenAnnotations,
  GenLoop,
  GenCondition,
  GenVariable,
  GenSlot,
  GenInclude,
  GenBlock,
  // Property types
  GenProperties,
  GenElementProperties,
  // Metadata types
  GenSourceImport,
  GenComponentMeta,
  GenPropDefinition,
  // Traversal types
  GenVisitor,
  GenVisitorObject,
  GenNodePredicate,
  // Output types
  TemplateOutput,
} from './types';

// Type guards
export {
  isElement,
  isText,
  isComment,
  isRoot,
  hasAnnotations,
  hasAnnotation,
  getAnnotations,
} from './types';

// Schemas
export {
  // Individual schemas
  GenLoopSchema,
  GenConditionSchema,
  GenVariableSchema,
  GenSlotSchema,
  GenIncludeSchema,
  GenBlockSchema,
  GenAnnotationsSchema,
  GenTextSchema,
  GenCommentSchema,
  GenDoctypeSchema,
  GenPropertiesSchema,
  GenElementSchema,
  GenChildSchema,
  GenRootSchema,
  GenComponentMetaSchema,
  GenPropDefinitionSchema,
  TemplateOutputSchema,
  // Validation helpers
  validateRoot,
  validateElement,
  validateAnnotations,
  validateTemplateOutput,
} from './schema';

// Schema input types
export type {
  GenLoopInput,
  GenConditionInput,
  GenVariableInput,
  GenSlotInput,
  GenIncludeInput,
  GenBlockInput,
  GenAnnotationsInput,
  GenRootInput,
} from './schema';

// Utilities
export {
  // Traversal
  visit,
  visitMatch,
  visitElements,
  visitText,
  // Transformation
  map,
  filter,
  remove,
  // Querying
  find,
  findAll,
  findByTag,
  findAllByTag,
  findById,
  findByClass,
  findByAnnotation,
  // Statistics
  countNodes,
  countByType,
  getDepth,
  // Variable collection
  collectVariables,
  collectDependencies,
  // Building
  text,
  element,
  root,
  annotate,
} from './utils';
