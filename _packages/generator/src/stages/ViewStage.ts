import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { ViewService, type ViewServiceOutput } from '../services/view';

/**
 * ViewStage - Pipeline stage for view generation
 * 
 * Renders React components to Liquid view files.
 */
export class ViewStage implements IPipelineStage {
  readonly name = 'view';
  readonly order = 1;
  readonly enabled = true;
  readonly dependencies: string[] = ['layout'];
  readonly description = 'Generate Liquid views from React components';
  
  private service: ViewService;
  
  constructor() {
    this.service = new ViewService();
  }
  
  canExecute(): boolean {
    return true;
  }
  
  async execute(context: IPipelineContext): Promise<void> {
    const { config, logger, eventBus } = context;
    
    // Initialize service
    await this.service.initialize({ config, logger, eventBus, registry: null as any });
    
    const cfg = config as any;
    const entryPath = cfg.css?.entryPath ?? './src/main.tsx';
    const viewsDir = cfg.html?.viewsDir ?? './views';
    const routes = cfg.html?.routes ?? {};
    
    logger.info('Generating views...');
    
    const result = await this.service.execute({
      entryPath,
      viewsDir,
      routes,
      partials: cfg.html?.partials,
    });
    
    // Store result in context
    context.setData('view:result', result);
    
    logger.info(`Generated ${result.views.length} view(s)`);
    
    if (result.partials && result.partials.length > 0) {
      logger.info(`Generated ${result.partials.length} partial(s)`);
    }
    
    eventBus.emit('stage:complete', {
      name: this.name,
      result,
    });
  }
}
