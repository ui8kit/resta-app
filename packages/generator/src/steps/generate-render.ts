import { resolve } from 'node:path';
import type { IPipelineContext } from '../core/interfaces';
import { RenderService, type RenderServiceOutput } from '../services/render';

export async function runGenerateRender(
  context: IPipelineContext,
  service: RenderService
): Promise<RenderServiceOutput> {
  const cfg = context.config;
  const appEntry = resolve(process.cwd(), cfg.render?.appEntry ?? 'src/App.tsx');
  const outputDir = cfg.html?.outputDir ?? './dist/html';
  const routes = cfg.html?.routes ?? {};
  const skipRoutes = cfg.render?.skipRoutes ?? [];

  context.logger.info('Rendering React routes to static HTML...');

  const result = await service.execute({
    appEntry,
    outputDir,
    routes,
    skipRoutes,
  });

  context.setData('render:result', result);
  return result;
}
