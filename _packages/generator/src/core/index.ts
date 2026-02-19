/**
 * Core module for the generator orchestrator.
 * 
 * Exports all core components:
 * - Interfaces (contracts)
 * - Orchestrator (main coordinator)
 * - EventBus (inter-service communication)
 * - ServiceRegistry (dependency injection)
 * - Pipeline (stage orchestration)
 * - Logger (logging abstraction)
 */

// Interfaces
export * from './interfaces';

// Orchestrator (main entry point)
export { Orchestrator } from './orchestrator';

// EventBus
export { EventBus } from './events';

// ServiceRegistry
export { ServiceRegistry, CircularDependencyError, ServiceNotFoundError } from './registry';

// Pipeline
export { Pipeline, PipelineContext, createPipelineContext } from './pipeline';

// Logger
export { Logger } from './logger';
