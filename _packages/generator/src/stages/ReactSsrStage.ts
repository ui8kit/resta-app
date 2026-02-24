import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { ReactSsrService, type ReactSsrServiceOutput } from '../services/react-ssr';

export class ReactSsrStage implements IPipelineStage<unknown, ReactSsrServiceOutput> {
  readonly name = 'react-ssr';
  readonly order = 0;
  readonly enabled = true;
  readonly dependencies: string[] = [];
  readonly description = 'Render React components to static HTML via registry.json';

  canExecute(context: IPipelineContext): boolean {
    return !!context.config.ssr?.registryPath;
  }

  async execute(_input: unknown, context: IPipelineContext): Promise<ReactSsrServiceOutput> {
    const { config, logger, eventBus } = context;
    const service = context.registry.resolve<ReactSsrService>('react-ssr');

    await service.initialize({ config, logger, eventBus, registry: context.registry });

    const ssrConfig = config.ssr!;
    const result = await service.execute({
      registryPath: ssrConfig.registryPath,
      reactDistDir: ssrConfig.reactDistDir,
      outputDir: ssrConfig.outputDir ?? config.html.outputDir,
      fixturesDir: config.fixtures?.dir ?? '',
      routes: config.html.routes,
      routeComponentMap: ssrConfig.routeComponentMap,
    });

    logger.info(`SSR: rendered ${result.pages.length} page(s)`);

    eventBus.emit('stage:complete', {
      name: this.name,
      result,
    });

    return result;
  }
}
