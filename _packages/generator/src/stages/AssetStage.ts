import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { AssetService, type AssetServiceOutput } from '../services/asset';

/**
 * AssetStage - Pipeline stage for asset copying
 * 
 * Copies CSS, JS, and public assets to output directory.
 */
export class AssetStage implements IPipelineStage {
  readonly name = 'asset';
  readonly order = 4;
  readonly enabled = true;
  readonly dependencies: string[] = ['html'];
  readonly description = 'Copy assets to output directory';
  
  private service: AssetService;
  
  constructor() {
    this.service = new AssetService();
  }
  
  canExecute(): boolean {
    return true;
  }
  
  async execute(context: IPipelineContext): Promise<void> {
    const { config, logger, eventBus } = context;
    
    // Initialize service
    await this.service.initialize({ config, logger, eventBus, registry: null as any });
    
    const cfg = config as any;
    const cssSourceDir = cfg.css?.outputDir ?? './dist/css';
    const outputDir = cfg.html?.outputDir ?? './dist/html';
    const mode = cfg.html?.mode ?? 'tailwind';
    
    logger.info('Copying assets...');
    
    const result = await this.service.execute({
      cssSourceDir,
      jsSourceDir: cfg.assets?.jsDir,
      publicDir: cfg.assets?.publicDir,
      outputDir: `${outputDir}/assets`,
      cssMode: mode === 'semantic' || mode === 'inline' ? 'semantic' : 'tailwind',
    });
    
    // Store result in context
    context.setData('asset:result', result);
    
    logger.info(`Copied ${result.copiedFiles.length} asset(s) (${formatSize(result.totalSize)})`);
    
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
