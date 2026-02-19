import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { HtmlService, type HtmlServiceOutput } from '../services/html';

/**
 * HtmlStage - Pipeline stage for HTML generation
 * 
 * Renders Liquid views through layout to final HTML.
 */
export class HtmlStage implements IPipelineStage {
  readonly name = 'html';
  readonly order = 3;
  readonly enabled = true;
  readonly dependencies: string[] = ['css'];
  readonly description = 'Render Liquid views through layout to final HTML';
  
  private service: HtmlService;
  
  constructor() {
    this.service = new HtmlService();
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
    const outputDir = cfg.html?.outputDir ?? './dist/html';
    const routes = cfg.html?.routes ?? {};
    const mode = cfg.html?.mode ?? 'tailwind';
    const cssOutputDir = cfg.css?.outputDir ?? './dist/css';
    
    logger.info('Generating HTML pages...');
    
    const result = await this.service.execute({
      viewsDir,
      outputDir,
      routes,
      mode,
      stripDataClassInTailwind: cfg.html?.stripDataClass,
      cssOutputDir,
      appConfig: cfg.app,
    });
    
    // Store result in context
    context.setData('html:result', result);
    
    const totalSize = result.pages.reduce((sum, p) => sum + p.size, 0);
    logger.info(`Generated ${result.pages.length} HTML page(s) (${formatSize(totalSize)})`);
    
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
