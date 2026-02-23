import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { CssService, type CssServiceOutput } from '../services/css';
import { runGenerateCss } from '../steps/generate-css';
import { formatSize } from '../core/utils/format';

/**
 * CssStage - Pipeline stage for CSS generation
 * 
 * Extracts and generates CSS from prepared views.
 */
export class CssStage implements IPipelineStage<unknown, CssServiceOutput> {
  readonly name = 'css';
  readonly order = 1;
  readonly enabled = true;
  readonly dependencies: string[] = [];
  readonly description = 'Generate CSS from prepared HTML views';
  
  private service: CssService;
  
  constructor() {
    this.service = new CssService();
  }
  
  canExecute(_context: IPipelineContext): boolean {
    return true;
  }
  
  async execute(_input: unknown, context: IPipelineContext): Promise<CssServiceOutput> {
    const { config, logger, eventBus } = context;
    
    // Initialize service
    await this.service.initialize({ config, logger, eventBus, registry: context.registry });
    const result = await runGenerateCss(context, this.service);
    
    // Store result in context
    const totalSize = result.files.reduce((sum, f) => sum + f.size, 0);
    logger.info(`Generated ${result.files.length} CSS file(s) (${formatSize(totalSize)})`);
    
    eventBus.emit('stage:complete', {
      name: this.name,
      result,
    });
    
    return result;
  }
}
