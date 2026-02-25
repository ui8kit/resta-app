/**
 * @ui8kit/generator - Static Site Generator
 *
 * Modern architecture with Orchestrator, Services, and Pipeline.
 */

// =============================================================================
// Main API
// =============================================================================

export { generate } from './generate';
export type { GenerateConfig, GenerateResult } from './generate';
export { buildProject } from './build-project';

export type { GeneratorConfig, RouteConfig } from './core/interfaces';

// =============================================================================
// Utilities
// =============================================================================

export {
  loadFixtureRoutes,
  type LoadFixtureRoutesOptions,
  type FixtureCollection,
} from './utils';

export {
  emitVariantsApplyCss,
  emitVariantsArtifacts,
  type EmitVariantsApplyCssOptions,
  type VariantsArtifacts,
} from './scripts/emit-variants-apply.js';

// =============================================================================
// Orchestrator System
// =============================================================================

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

export { getCoreComponentNames, getFallbackCoreComponents, isKnownCoreComponent, findUnknownComponents } from './core/scanner/core-component-scanner';

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
  RenderService,
  CssService,
  HtmlService,
  HtmlConverterService,
  PostCssService,
} from './services';

export type {
  RenderServiceInput,
  RenderServiceOutput,
  CssServiceInput,
  CssServiceOutput,
  CssOutputFileNames,
  HtmlServiceInput,
  HtmlServiceOutput,
  HtmlConverterInput,
  HtmlConverterOutput,
  PostCssServiceInput,
  PostCssServiceOutput,
} from './services';

// =============================================================================
// Stages
// =============================================================================

export {
  RenderStage,
  CssStage,
  HtmlStage,
  PostCssStage,
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
  BasePlugin,
  PluginRegistry,
  defaultRegistry,
  registerTemplatePlugin,
  getTemplatePlugin,
  ReactPlugin,
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
  isElement,
  isText,
  isComment,
  isRoot,
  hasAnnotations,
  hasAnnotation,
  getAnnotations,
  visit,
  visitMatch,
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
  text,
  element,
  root,
  annotate,
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
  GenNodeType,
  GenNode,
  GenElement,
  GenText,
  GenComment,
  GenDoctype,
  GenChild,
  GenRoot,
  GenAnnotations,
  GenLoop,
  GenCondition,
  GenVariable,
  GenSlot,
  GenInclude,
  GenBlock,
  GenProperties,
  GenElementProperties,
  GenComponentMeta,
  GenPropDefinition,
  GenVisitor,
  GenVisitorObject,
  GenNodePredicate,
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
// Registry Generator
// =============================================================================

export {
  generateRegistry,
  resolveDomainItems,
  scanBlueprint,
  validateBlueprint,
  buildDependencyGraph,
  scaffoldEntity,
  type Registry,
  type RegistryItem,
  type RegistryItemType,
  type RegistryConfig,
  type RegistrySourceDir,
  type ResolveDomainOptions,
  type ScanBlueprintOptions,
  type ScanBlueprintResult,
  type ValidateBlueprintOptions,
  type ValidateBlueprintResult,
  type BuildDependencyGraphOptions,
  type BuildDependencyGraphResult,
  type ScaffoldEntityOptions,
  type ScaffoldEntityResult,
} from './scripts';
