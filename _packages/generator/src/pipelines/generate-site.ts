import { Orchestrator } from '../core/orchestrator';
import { CssService } from '../services/css';
import { HtmlService } from '../services/html';
import { HtmlConverterService } from '../services/html-converter';
import { CssStage } from '../stages/CssStage';
import { HtmlStage } from '../stages/HtmlStage';
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

  orchestrator.addStage(new CssStage());
  orchestrator.addStage(new HtmlStage());

  return orchestrator.generate(config);
}

