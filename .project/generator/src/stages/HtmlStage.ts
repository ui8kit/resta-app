import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { HtmlService, type HtmlServiceOutput } from '../services/html';
import { runGenerateHtml } from '../steps/generate-html';
import { formatSize } from '../core/utils/format';

/**
 * HtmlStage - Pipeline stage for HTML generation
 * 
 * Renders prepared views to final HTML.
 */
export class HtmlStage implements IPipelineStage<unknown, HtmlServiceOutput> {
  readonly name = 'html';
  readonly order = 2;
  readonly enabled = true;
  readonly dependencies: string[] = ['css'];
  readonly description = 'Render pages from prepared views to final HTML';
  
  canExecute(_context: IPipelineContext): boolean {
    return true;
  }
  
  async execute(_input: unknown, context: IPipelineContext): Promise<HtmlServiceOutput> {
    const { config, logger, eventBus } = context;
    const service = context.registry.resolve<HtmlService>('html');
    
    // Initialize service
    await service.initialize({ config, logger, eventBus, registry: context.registry });
    const result = await runGenerateHtml(context, service);
    
    // Store result in context
    const totalSize = result.pages.reduce((sum, p) => sum + p.size, 0);
    logger.info(`Generated ${result.pages.length} HTML page(s) (${formatSize(totalSize)})`);
    
    eventBus.emit('stage:complete', {
      name: this.name,
      result,
    });
    
    return result;
  }
}
