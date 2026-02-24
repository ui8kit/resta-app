import { Orchestrator } from '../core/orchestrator';
import { CssService } from '../services/css';
import { HtmlService } from '../services/html';
import { HtmlConverterService } from '../services/html-converter';
import { PostCssService } from '../services/postcss';
import { CssStage } from '../stages/CssStage';
import { HtmlStage } from '../stages/HtmlStage';
import { PostCssStage } from '../stages/PostCssStage';
import type { GeneratorConfig, GeneratorResult, ILogger } from '../core/interfaces';

export type GenerateStageName = 'css' | 'html' | 'postcss';

export async function runGenerateSitePipeline(
  config: GeneratorConfig,
  logger: ILogger,
  stages?: readonly GenerateStageName[]
): Promise<GeneratorResult> {
  const requestedStages = new Set<GenerateStageName>(stages ?? ['css', 'html', 'postcss']);
  const orchestrator = new Orchestrator({ logger });

  if (requestedStages.has('css')) {
    orchestrator.registerService(new HtmlConverterService());
    orchestrator.registerService(new CssService());
  }

  if (requestedStages.has('html')) {
    orchestrator.registerService(new HtmlService());
  }

  if (requestedStages.has('css')) {
    orchestrator.addStage(new CssStage());
  }

  if (requestedStages.has('html')) {
    orchestrator.addStage(new HtmlStage());
  }

  if (requestedStages.has('postcss') && config.postcss?.enabled) {
    orchestrator.registerService(new PostCssService());
    orchestrator.addStage(new PostCssStage());
  }

  return orchestrator.generate(config);
}
