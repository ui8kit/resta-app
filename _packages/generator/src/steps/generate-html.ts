import type { IPipelineContext } from '../core/interfaces';
import { HtmlService, type HtmlServiceOutput } from '../services/html';

export async function runGenerateHtml(
  context: IPipelineContext,
  service: HtmlService
): Promise<HtmlServiceOutput> {
  const cfg = context.config as any;
  const viewsDir = cfg.html?.viewsDir ?? './views';
  const outputDir = cfg.html?.outputDir ?? './dist/html';
  const routes = cfg.html?.routes ?? {};
  const mode = cfg.html?.mode ?? 'tailwind';
  const cssOutputDir = cfg.css?.outputDir ?? './dist/css';

  context.logger.info('Generating HTML pages...');

  const result = await service.execute({
    viewsDir,
    outputDir,
    routes,
    mode,
    stripDataClassInTailwind: cfg.html?.stripDataClassInTailwind ?? false,
    cssOutputDir,
    appConfig: cfg.app,
  });

  context.setData('html:result', result);
  return result;
}

