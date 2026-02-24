import { Orchestrator } from '../core/orchestrator';
import { CssService } from '../services/css';
import { HtmlService } from '../services/html';
import { HtmlConverterService } from '../services/html-converter';
import { ReactSsrService } from '../services/react-ssr';
import { PostCssService } from '../services/postcss';
import { ReactSsrStage } from '../stages/ReactSsrStage';
import { CssStage } from '../stages/CssStage';
import { HtmlStage } from '../stages/HtmlStage';
import { PostCssStage } from '../stages/PostCssStage';
import type { GeneratorConfig, GeneratorResult, ILogger } from '../core/interfaces';

export async function runGenerateSitePipeline(
  config: GeneratorConfig,
  logger: ILogger
): Promise<GeneratorResult> {
  const orchestrator = new Orchestrator({ logger });

  orchestrator.registerService(new HtmlConverterService());
  orchestrator.registerService(new CssService());
  orchestrator.registerService(new HtmlService());

  if (config.ssr?.registryPath) {
    orchestrator.registerService(new ReactSsrService());
    orchestrator.addStage(new ReactSsrStage());
  }

  orchestrator.addStage(new CssStage());
  orchestrator.addStage(new HtmlStage());

  if (config.postcss?.enabled) {
    orchestrator.registerService(new PostCssService());
    orchestrator.addStage(new PostCssStage());
  }

  return orchestrator.generate(config);
}
