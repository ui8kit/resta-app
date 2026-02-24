import type { IPipelineContext, IPipelineStage } from '../core/interfaces';
import { formatSize } from '../core/utils/format';
import { RenderService, type RenderServiceOutput } from '../services/render';
import { runGenerateRender } from '../steps/generate-render';

export class RenderStage implements IPipelineStage<unknown, RenderServiceOutput> {
  readonly name = 'render';
  readonly order = 0;
  readonly enabled = true;
  readonly dependencies: string[] = [];
  readonly description = 'Render React app routes to raw static HTML files';

  canExecute(_context: IPipelineContext): boolean {
    return true;
  }

  async execute(_input: unknown, context: IPipelineContext): Promise<RenderServiceOutput> {
    const { config, logger, eventBus } = context;
    const service = context.registry.resolve<RenderService>('render');

    await service.initialize({ config, logger, eventBus, registry: context.registry });
    const result = await runGenerateRender(context, service);

    const totalSize = result.pages.reduce((sum, page) => sum + page.size, 0);
    logger.info(`Rendered ${result.pages.length} static page(s) (${formatSize(totalSize)})`);

    eventBus.emit('stage:complete', {
      name: this.name,
      result,
    });

    return result;
  }
}
