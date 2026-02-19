import type { IService, IServiceContext } from '../../core/interfaces';

/**
 * Input for ViteBundleService.execute()
 */
export interface ViteBundleInput {
  /**
   * Vite build output directory (e.g., './dist/assets')
   */
  viteBuildDir: string;
  
  /**
   * HTML output directory (e.g., './dist/html')
   */
  htmlOutputDir: string;
  
  /**
   * CSS output subdirectory (default: 'css')
   */
  cssSubdir?: string;
  
  /**
   * JS output subdirectory (default: 'js')
   */
  jsSubdir?: string;
  
  /**
   * Output CSS filename (default: 'styles.css')
   */
  cssFileName?: string;
  
  /**
   * Output JS filename (default: 'app.js')
   */
  jsFileName?: string;
  
  /**
   * Copy JS bundle as well (default: false)
   */
  copyJs?: boolean;
}

/**
 * Output from ViteBundleService.execute()
 */
export interface ViteBundleOutput {
  /** Path to copied CSS file */
  cssPath?: string;
  /** Path to copied JS file */
  jsPath?: string;
  /** Original CSS filename with hash */
  originalCssName?: string;
  /** Original JS filename with hash */
  originalJsName?: string;
  /** CSS file size in bytes */
  cssSize?: number;
  /** JS file size in bytes */
  jsSize?: number;
}

/**
 * File system interface for ViteBundleService
 */
export interface ViteBundleFileSystem {
  readdir(path: string): Promise<string[]>;
  copyFile(src: string, dest: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  stat(path: string): Promise<{ size: number }>;
  exists(path: string): Promise<boolean>;
}

/**
 * ViteBundleService options
 */
export interface ViteBundleServiceOptions {
  fileSystem?: ViteBundleFileSystem;
}

/**
 * ViteBundleService - Copies Vite build artifacts to HTML output directory.
 * 
 * Vite generates files with content hashes (e.g., index-D-pnRIbb.css).
 * This service finds those files and copies them with clean names
 * (e.g., styles.css) to the HTML output directory.
 * 
 * @example
 * ```typescript
 * const service = new ViteBundleService();
 * await service.initialize(context);
 * 
 * const result = await service.execute({
 *   viteBuildDir: './dist/assets',
 *   htmlOutputDir: './dist/html',
 *   cssFileName: 'styles.css',
 * });
 * 
 * console.log(`Copied ${result.originalCssName} → ${result.cssPath}`);
 * ```
 */
export class ViteBundleService implements IService<ViteBundleInput, ViteBundleOutput> {
  readonly name = 'vite-bundle';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = ['html'];
  
  private context!: IServiceContext;
  private fs: ViteBundleFileSystem;
  
  constructor(options: ViteBundleServiceOptions = {}) {
    this.fs = options.fileSystem ?? this.createDefaultFileSystem();
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }
  
  async execute(input: ViteBundleInput): Promise<ViteBundleOutput> {
    const {
      viteBuildDir,
      htmlOutputDir,
      cssSubdir = 'css',
      jsSubdir = 'js',
      cssFileName = 'styles.css',
      jsFileName = 'app.js',
      copyJs = false,
    } = input;
    
    const result: ViteBundleOutput = {};
    
    // Check if Vite build directory exists
    const buildDirExists = await this.fs.exists(viteBuildDir);
    if (!buildDirExists) {
      this.context.logger.warn(`Vite build directory not found: ${viteBuildDir}`);
      return result;
    }
    
    // List files in Vite build directory
    const files = await this.fs.readdir(viteBuildDir);
    
    // Find CSS file (pattern: index-*.css or *.css with hash)
    const cssFile = files.find(f => f.endsWith('.css'));
    
    if (cssFile) {
      const cssOutputDir = this.joinPath(htmlOutputDir, cssSubdir);
      await this.fs.mkdir(cssOutputDir);
      
      const srcPath = this.joinPath(viteBuildDir, cssFile);
      const destPath = this.joinPath(cssOutputDir, cssFileName);
      
      await this.fs.copyFile(srcPath, destPath);
      
      const stats = await this.fs.stat(srcPath);
      
      result.cssPath = destPath;
      result.originalCssName = cssFile;
      result.cssSize = stats.size;
      
      this.context.logger.info(`📎 Copied Vite CSS: ${cssFile} → ${destPath} (${this.formatSize(stats.size)})`);
      
      this.context.eventBus.emit('vite-bundle:css-copied', {
        source: srcPath,
        dest: destPath,
        originalName: cssFile,
        size: stats.size,
      });
    } else {
      this.context.logger.debug('No CSS file found in Vite build directory');
    }
    
    // Find and copy JS file if requested
    if (copyJs) {
      const jsFile = files.find(f => f.endsWith('.js') && !f.includes('chunk'));
      
      if (jsFile) {
        const jsOutputDir = this.joinPath(htmlOutputDir, jsSubdir);
        await this.fs.mkdir(jsOutputDir);
        
        const srcPath = this.joinPath(viteBuildDir, jsFile);
        const destPath = this.joinPath(jsOutputDir, jsFileName);
        
        await this.fs.copyFile(srcPath, destPath);
        
        const stats = await this.fs.stat(srcPath);
        
        result.jsPath = destPath;
        result.originalJsName = jsFile;
        result.jsSize = stats.size;
        
        this.context.logger.info(`📎 Copied Vite JS: ${jsFile} → ${destPath} (${this.formatSize(stats.size)})`);
        
        this.context.eventBus.emit('vite-bundle:js-copied', {
          source: srcPath,
          dest: destPath,
          originalName: jsFile,
          size: stats.size,
        });
      }
    }
    
    return result;
  }
  
  async dispose(): Promise<void> {
    // No cleanup needed
  }
  
  /**
   * Join path segments
   */
  private joinPath(...segments: string[]): string {
    return segments
      .map((s, i) => i === 0 ? s : s.replace(/^[/\\]+/, ''))
      .join('/')
      .replace(/\\/g, '/');
  }
  
  /**
   * Format file size for logging
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  
  /**
   * Create default file system
   */
  private createDefaultFileSystem(): ViteBundleFileSystem {
    return {
      readdir: async (path: string) => {
        const { readdir } = await import('node:fs/promises');
        return readdir(path);
      },
      copyFile: async (src: string, dest: string) => {
        const { copyFile } = await import('node:fs/promises');
        await copyFile(src, dest);
      },
      mkdir: async (path: string) => {
        const { mkdir } = await import('node:fs/promises');
        await mkdir(path, { recursive: true });
      },
      stat: async (path: string) => {
        const { stat } = await import('node:fs/promises');
        return stat(path);
      },
      exists: async (path: string) => {
        const { access } = await import('node:fs/promises');
        try {
          await access(path);
          return true;
        } catch {
          return false;
        }
      },
    };
  }
}
