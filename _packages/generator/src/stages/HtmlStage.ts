import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { HtmlService, type HtmlServiceOutput } from '../services/html';
import { runGenerateHtml } from '../steps/generate-html';

/**
 * HtmlStage - Pipeline stage for HTML generation
 * 
 * Renders Liquid views through layout to final HTML.
 */
export class HtmlStage implements IPipelineStage<unknown, HtmlServiceOutput> {
  readonly name = 'html';
  readonly order = 2;
  readonly enabled = true;
  readonly dependencies: string[] = ['css'];
  readonly description = 'Render pages from prepared views to final HTML';
  
  private service: HtmlService;
  
  constructor() {
    this.service = new HtmlService();
  }
  
  canExecute(_context: IPipelineContext): boolean {
    return true;
  }
  
  async execute(_input: unknown, context: IPipelineContext): Promise<HtmlServiceOutput> {
    const { config, logger, eventBus } = context;
    
    // Initialize service
    await this.service.initialize({ config, logger, eventBus, registry: context.registry });
    const result = await runGenerateHtml(context, this.service);
    
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
