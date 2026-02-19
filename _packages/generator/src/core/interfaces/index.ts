/**
 * Core interfaces for the generator orchestrator.
 * 
 * These interfaces define the contracts for:
 * - Services: Individual units of functionality
 * - Pipeline: Orchestration of generation stages
 * - EventBus: Inter-service communication
 * - Logger: Logging abstraction
 * - Config: Generator configuration
 * - Plugin: Extension system
 * - Orchestrator: Main coordinator
 */

// Service interfaces
export type {
  IService,
  IServiceContext,
  IServiceRegistry,
  ServiceMetadata,
} from './IService';

export { BaseService } from './IService';

// Pipeline interfaces
export type {
  IPipeline,
  IPipelineStage,
  IPipelineContext,
  PipelineResult,
  StageResult,
  PipelineOptions,
} from './IPipeline';

// EventBus interfaces
export type {
  IEventBus,
  ITypedEventBus,
  EventHandler,
  GeneratorEvents,
} from './IEventBus';

// Logger interfaces
export type {
  ILogger,
  LogLevel,
  LoggerOptions,
} from './ILogger';

// Config interfaces
export type {
  GeneratorConfig,
  RouteConfig,
} from './IConfig';

export { DEFAULT_CONFIG } from './IConfig';

// Plugin interfaces
export type {
  IPlugin,
  IPluginContext,
  PluginMetadata,
} from './IPlugin';

// Orchestrator interfaces
export type {
  IOrchestrator,
  OrchestratorOptions,
  GeneratorResult,
  GeneratedFile,
} from './IOrchestrator';
