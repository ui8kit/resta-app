import type { IPipelineContext } from '../core/interfaces';
import { HtmlService, type HtmlServiceOutput } from '../services/html';

export async function runGenerateHtml(
  context: IPipelineContext,
  service: HtmlService
): Promise<HtmlServiceOutput> {
  const cfg = context.config;
  const outputDir = cfg.html?.outputDir ?? './dist/html';
  const allRoutes = cfg.html?.routes ?? {};
  const skipRoutes = new Set(cfg.render?.skipRoutes ?? []);
  const routes = Object.fromEntries(
    Object.entries(allRoutes).filter(([path]) => !skipRoutes.has(path))
  );
  const mode = cfg.html?.mode ?? 'tailwind';
  const cssOutputDir = cfg.css?.outputDir ?? './dist/css';

  context.logger.info('Generating HTML pages...');

  const result = await service.execute({
    outputDir,
    routes,
    mode,
    stripDataClassInTailwind: cfg.html?.stripDataClassInTailwind ?? false,
    cssOutputDir,
    cssHref: cfg.html?.cssHref,
    appConfig: cfg.app,
  });

  context.setData('html:result', result);
  return result;
}
