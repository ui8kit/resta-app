import { Orchestrator } from '../core/orchestrator';
import { CssService } from '../services/css';
import { HtmlService } from '../services/html';
import { HtmlConverterService } from '../services/html-converter';
import { ClassLogService } from '../services/class-log';
import { CssStage } from '../stages/CssStage';
import { HtmlStage } from '../stages/HtmlStage';
import { ClassLogStage } from '../stages/ClassLogStage';
import type { GeneratorConfig, GeneratorResult, ILogger } from '../core/interfaces';

export async function runGenerateSitePipeline(
  config: GeneratorConfig,
  logger: ILogger
): Promise<GeneratorResult> {
  const orchestrator = new Orchestrator({ logger });

  // Orchestrator-only runtime path: CSS/HTML generation.
  orchestrator.registerService(new HtmlConverterService());
  orchestrator.registerService(new CssService());
  orchestrator.registerService(new HtmlService());
  if (config.classLog?.enabled) {
    orchestrator.registerService(new ClassLogService());
  }

  orchestrator.addStage(new CssStage());
  orchestrator.addStage(new HtmlStage());
  if (config.classLog?.enabled) {
    orchestrator.addStage(new ClassLogStage());
  }

  return orchestrator.generate(config);
}

