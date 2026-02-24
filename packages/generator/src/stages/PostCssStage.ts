import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { PostCssService, type PostCssServiceOutput } from '../services/postcss';

export class PostCssStage implements IPipelineStage<unknown, PostCssServiceOutput> {
  readonly name = 'postcss';
  readonly order = 3;
  readonly enabled = true;
  readonly dependencies: string[] = ['html'];
  readonly description = 'Run PostCSS with Tailwind and optional UnCSS';

  canExecute(context: IPipelineContext): boolean {
    return !!context.config.postcss?.enabled;
  }

  async execute(_input: unknown, context: IPipelineContext): Promise<PostCssServiceOutput> {
    const { config, logger, eventBus } = context;
    const service = context.registry.resolve<PostCssService>('postcss');

    await service.initialize({ config, logger, eventBus, registry: context.registry });

    const postcssConfig = config.postcss!;
    const result = await service.execute({
      enabled: true,
      entryImports: postcssConfig.entryImports,
      sourceDir: postcssConfig.sourceDir,
      cssOutputDir: config.css.outputDir,
      htmlDir: config.html.outputDir,
      outputDir: postcssConfig.outputDir ?? config.html.outputDir,
      outputFileName: postcssConfig.outputFileName,
      uncss: postcssConfig.uncss,
    });

    if (result.stylesPath) {
      logger.info(`PostCSS: ${result.stylesPath} (${(result.stylesSize / 1024).toFixed(1)} KB)`);
    }

    eventBus.emit('stage:complete', {
      name: this.name,
      result,
    });

    return result;
  }
}
