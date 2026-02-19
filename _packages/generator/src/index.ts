/**
 * @ui8kit/generator - Static Site Generator
 * 
 * Modern architecture with Orchestrator, Services, and Pipeline.
 */

// =============================================================================
// Main API - Simple usage
// =============================================================================

export { generate, createGenerator } from './generate';
export type { GenerateConfig, GenerateResult } from './generate';

export { buildProject } from './build-project';

// Re-export config types for convenience
export type { GeneratorConfig, RouteConfig } from './core/interfaces';

// =============================================================================
// Orchestrator System - Advanced usage
// =============================================================================

// Core exports
export {
  Orchestrator,
  Pipeline,
  createPipelineContext,
  EventBus,
  ServiceRegistry,
  CircularDependencyError,
  ServiceNotFoundError,
  Logger,
} from './core';

// Scanner utilities
export {
  getCoreComponentNames,
  getFallbackCoreComponents,
  isKnownCoreComponent,
  findUnknownComponents,
} from './core/scanner/core-component-scanner';

// Types and interfaces
export type {
  IOrchestrator,
  GeneratorResult,
  IService,
  IServiceContext,
  IServiceRegistry,
  BaseService,
  IPipeline,
  IPipelineStage,
  IPipelineContext,
  IPlugin,
  IPluginContext,
  ILogger,
  LogLevel,
  IEventBus,
  ITypedEventBus,
  GeneratorEvents,
} from './core';

export { DEFAULT_CONFIG } from './core';

// =============================================================================
// Services
// =============================================================================

export {
  LayoutService,
  RenderService,
  ViewService,
  CssService,
  HtmlService,
  AssetService,
  HtmlConverterService,
  ClassLogService,
  TemplateService,
} from './services';

export type {
  LayoutServiceInput,
  LayoutServiceOutput,
  LayoutTemplateConfig,
  RenderServiceInput,
  RenderRouteInput,
  RenderComponentInput,
  RenderServiceOutput,
  RouterParser,
  ViewServiceInput,
  ViewServiceOutput,
  CssServiceInput,
  CssServiceOutput,
  CssOutputFileNames,
  HtmlServiceInput,
  HtmlServiceOutput,
  AssetServiceInput,
  AssetServiceOutput,
  CssFileNames,
  HtmlConverterInput,
  HtmlConverterOutput,
  ClassLogServiceInput,
  ClassLogServiceOutput,
  ClassLogFile,
  TemplateServiceInput,
  TemplateServiceOutput,
  GeneratedFile,
} from './services';

// =============================================================================
// Stages
// =============================================================================

export {
  LayoutStage,
  ViewStage,
  CssStage,
  HtmlStage,
  AssetStage,
  DEFAULT_STAGES,
} from './stages';

// =============================================================================
// Plugins
// =============================================================================

export {
  PluginManager,
  createPlugin,
} from './plugins';

export type {
  PluginDefinition,
  PluginHooks,
} from './plugins';

// =============================================================================
// Template Plugins
// =============================================================================

export {
  // Base
  BasePlugin,
  // Registry
  PluginRegistry,
  defaultRegistry,
  registerTemplatePlugin,
  getTemplatePlugin,
  // Built-in Plugins
  LiquidPlugin,
  HandlebarsPlugin,
  TwigPlugin,
  LattePlugin,
  ReactPlugin,
  builtInPlugins,
  registerBuiltInPlugins,
} from './plugins';

export type {
  ITemplatePlugin,
  TemplatePluginFeatures,
  TemplatePluginContext,
  TemplatePluginConfig,
  TransformResult as TemplateTransformResult,
  FilterDefinition,
  StandardFilter,
  TemplatePluginFactory,
  TemplatePluginMetadata,
} from './plugins';

// =============================================================================
// HAST (Hypertext Abstract Syntax Tree)
// =============================================================================

export {
  // Type guards
  isElement,
  isText,
  isComment,
  isRoot,
  hasAnnotations,
  hasAnnotation,
  getAnnotations,
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
  // Schemas
  GenLoopSchema,
  GenConditionSchema,
  GenVariableSchema,
  GenSlotSchema,
  GenIncludeSchema,
  GenBlockSchema,
  GenAnnotationsSchema,
  GenRootSchema,
  GenElementSchema,
  TemplateOutputSchema,
  validateRoot,
  validateElement,
  validateAnnotations,
  validateTemplateOutput,
} from './hast';

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
  GenComponentMeta,
  GenPropDefinition,
  // Traversal types
  GenVisitor,
  GenVisitorObject,
  GenNodePredicate,
  // Output types
  TemplateOutput,
} from './hast';

// =============================================================================
// JSX Transformer
// =============================================================================

export {
  transformJsx,
  transformJsxFile,
  transformJsxFiles,
  parseJsx,
  buildHast,
  analyzeExpression,
  extractVariables,
  DEFAULT_PARSER_OPTIONS,
  DEFAULT_COMPONENT_PATTERNS,
} from './transformer';

export type {
  TransformOptions,
  TransformResult,
  ComponentPatterns,
  ExpressionType,
  AnalyzedExpression,
  AnalyzedComponent,
  AnalyzedProp,
  AnalyzedImport,
} from './transformer';

// =============================================================================
// Utilities
// =============================================================================

export {
  emitVariantsApplyCss,
  emitVariantsArtifacts,
  type EmitVariantsApplyCssOptions,
  type VariantsArtifacts,
} from './scripts/emit-variants-apply.js';

export {
  emitVariantElements,
  type EmitVariantElementsOptions,
  type EmitVariantElementsResult,
} from './scripts/emit-variant-elements.js';

// =============================================================================
// Registry Generator
// =============================================================================

export {
  generateRegistry,
  resolveDomainItems,
  type Registry,
  type RegistryItem,
  type RegistryItemType,
  type RegistryConfig,
  type RegistrySourceDir,
  type ResolveDomainOptions,
} from './scripts';
