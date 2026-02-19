/**
 * Zod Schemas for HAST Types
 *
 * Provides runtime validation for GenHAST structures.
 * Used for validating configuration, plugin outputs, and tree integrity.
 */

import { z } from 'zod';

// =============================================================================
// Generator Annotation Schemas
// =============================================================================

/**
 * Loop annotation schema
 */
export const GenLoopSchema = z.object({
  item: z.string().min(1, 'Item variable name is required'),
  collection: z.string().min(1, 'Collection name is required'),
  key: z.string().optional(),
  index: z.string().optional(),
});

/**
 * Condition annotation schema
 */
export const GenConditionSchema = z.object({
  expression: z.string().min(1, 'Condition expression is required'),
  isElse: z.boolean().optional(),
  isElseIf: z.boolean().optional(),
});

/**
 * Variable annotation schema
 */
export const GenVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required'),
  default: z.string().optional(),
  filter: z.string().optional(),
  filterArgs: z.array(z.string()).optional(),
});

/**
 * Slot annotation schema
 */
export const GenSlotSchema = z.object({
  name: z.string().min(1, 'Slot name is required'),
  accepts: z.array(z.string()).optional(),
  multiple: z.boolean().optional(),
  required: z.boolean().optional(),
});

/**
 * Include annotation schema
 */
export const GenIncludeSchema = z.object({
  partial: z.string().min(1, 'Partial path is required'),
  props: z.record(z.string()).optional(),
});

/**
 * Block annotation schema
 */
export const GenBlockSchema = z.object({
  name: z.string().min(1, 'Block name is required'),
  extends: z.string().optional(),
});

/**
 * Source location schema
 */
export const GenSourceLocationSchema = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  column: z.number().int().nonnegative(),
});

/**
 * Complete annotations schema
 */
export const GenAnnotationsSchema = z.object({
  loop: GenLoopSchema.optional(),
  condition: GenConditionSchema.optional(),
  variable: GenVariableSchema.optional(),
  slot: GenSlotSchema.optional(),
  include: GenIncludeSchema.optional(),
  block: GenBlockSchema.optional(),
  unwrap: z.boolean().optional(),
  raw: z.boolean().optional(),
  component: z.string().optional(),
  source: GenSourceLocationSchema.optional(),
});

// =============================================================================
// Node Schemas
// =============================================================================

/**
 * Text node schema
 */
export const GenTextSchema = z.object({
  type: z.literal('text'),
  value: z.string(),
});

/**
 * Comment node schema
 */
export const GenCommentSchema = z.object({
  type: z.literal('comment'),
  value: z.string(),
});

/**
 * Doctype node schema
 */
export const GenDoctypeSchema = z.object({
  type: z.literal('doctype'),
});

/**
 * Element properties schema (partial, allows any HTML attributes)
 */
export const GenPropertiesSchema = z.object({
  className: z.array(z.string()).optional(),
  id: z.string().optional(),
  style: z.union([z.string(), z.record(z.string())]).optional(),
  _gen: GenAnnotationsSchema.optional(),
}).passthrough(); // Allow any additional properties

/**
 * Element node schema (recursive via lazy)
 */
export const GenElementSchema: z.ZodType<{
  type: 'element';
  tagName: string;
  properties: z.infer<typeof GenPropertiesSchema>;
  children: Array<
    | z.infer<typeof GenTextSchema>
    | z.infer<typeof GenCommentSchema>
    | { type: 'element'; tagName: string; properties: unknown; children: unknown[] }
  >;
}> = z.lazy(() =>
  z.object({
    type: z.literal('element'),
    tagName: z.string().min(1, 'Tag name is required'),
    properties: GenPropertiesSchema,
    children: z.array(GenChildSchema),
  })
);

/**
 * Child node schema (union of possible children)
 */
export const GenChildSchema = z.lazy(() =>
  z.union([GenElementSchema, GenTextSchema, GenCommentSchema])
);

/**
 * Prop definition schema
 */
export const GenPropDefinitionSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  description: z.string().optional(),
});

/**
 * Component metadata schema
 */
export const GenComponentMetaSchema = z.object({
  sourceFile: z.string(),
  componentName: z.string(),
  exports: z.array(z.string()),
  dependencies: z.array(z.string()),
  componentType: z.enum(['layout', 'partial', 'page', 'block', 'component']).optional(),
  props: z.array(GenPropDefinitionSchema).optional(),
  preamble: z.array(z.string()).optional(),
  preambleVars: z.array(z.string()).optional(),
});

/**
 * Root node schema
 */
export const GenRootSchema = z.object({
  type: z.literal('root'),
  children: z.array(GenChildSchema),
  meta: GenComponentMetaSchema.optional(),
});

// =============================================================================
// Template Output Schema
// =============================================================================

/**
 * Template output schema
 */
export const TemplateOutputSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  content: z.string(),
  variables: z.array(z.string()),
  dependencies: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
});

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate a GenRoot structure
 */
export function validateRoot(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof GenRootSchema>> {
  return GenRootSchema.safeParse(data);
}

/**
 * Validate a GenElement structure
 */
export function validateElement(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof GenElementSchema>> {
  return GenElementSchema.safeParse(data);
}

/**
 * Validate annotations
 */
export function validateAnnotations(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof GenAnnotationsSchema>> {
  return GenAnnotationsSchema.safeParse(data);
}

/**
 * Validate template output
 */
export function validateTemplateOutput(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof TemplateOutputSchema>> {
  return TemplateOutputSchema.safeParse(data);
}

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type GenLoopInput = z.input<typeof GenLoopSchema>;
export type GenConditionInput = z.input<typeof GenConditionSchema>;
export type GenVariableInput = z.input<typeof GenVariableSchema>;
export type GenSlotInput = z.input<typeof GenSlotSchema>;
export type GenIncludeInput = z.input<typeof GenIncludeSchema>;
export type GenBlockInput = z.input<typeof GenBlockSchema>;
export type GenAnnotationsInput = z.input<typeof GenAnnotationsSchema>;
export type GenRootInput = z.input<typeof GenRootSchema>;
