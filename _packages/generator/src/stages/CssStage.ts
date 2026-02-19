import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { CssService, type CssServiceOutput } from '../services/css';

/**
 * CssStage - Pipeline stage for CSS generation
 * 
 * Extracts and generates CSS from Liquid views.
 */
export class CssStage implements IPipelineStage {
  readonly name = 'css';
  readonly order = 2;
  readonly enabled = true;
  readonly dependencies: string[] = ['view'];
  readonly description = 'Extract and generate CSS from Liquid views';
  
  private service: CssService;
  
  constructor() {
    this.service = new CssService();
  }
  
  canExecute(): boolean {
    return true;
  }
  
  async execute(context: IPipelineContext): Promise<void> {
    const { config, logger, eventBus } = context;
    
    // Initialize service
    await this.service.initialize({ config, logger, eventBus, registry: null as any });
    
    const cfg = config as any;
    const viewsDir = cfg.html?.viewsDir ?? './views';
    const outputDir = cfg.css?.outputDir ?? './dist/css';
    const routes = cfg.html?.routes ?? {};
    const pureCss = cfg.css?.pureCss ?? false;
    
    logger.info('Generating CSS...');
    
    const result = await this.service.execute({
      viewsDir,
      outputDir,
      routes,
      pureCss,
      mappings: cfg.mappings,
    });
    
    // Store result in context
    context.setData('css:result', result);
    
    const totalSize = result.files.reduce((sum, f) => sum + f.size, 0);
    logger.info(`Generated ${result.files.length} CSS file(s) (${formatSize(totalSize)})`);
    
    eventBus.emit('stage:complete', {
      name: this.name,
      result,
    });
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
