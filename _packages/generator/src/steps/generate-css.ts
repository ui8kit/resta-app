import type { IPipelineContext } from '../core/interfaces';
import { CssService, type CssServiceOutput } from '../services/css';

export async function runGenerateCss(
  context: IPipelineContext,
  service: CssService
): Promise<CssServiceOutput> {
  const cfg = context.config;
  const htmlDir = cfg.html?.outputDir ?? './dist/html';
  const outputDir = cfg.css?.outputDir ?? './dist/css';
  const routes = cfg.html?.routes ?? {};
  const pureCss = cfg.css?.pureCss ?? false;

  context.logger.info('Generating CSS...');

  const result = await service.execute({
    htmlDir,
    outputDir,
    routes,
    pureCss,
    mappings: cfg.mappings,
    outputFiles: cfg.css?.outputFiles,
  });

  context.setData('css:result', result);
  return result;
}
