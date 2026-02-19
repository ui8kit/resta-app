import type { IService, IServiceContext, GeneratorConfig } from '../../core/interfaces';
import { join } from 'node:path';

/**
 * Input for LayoutService.execute()
 */
export interface LayoutServiceInput {
  viewsDir: string;
}

/**
 * Output from LayoutService.execute()
 */
export interface LayoutServiceOutput {
  created: string[];
  skipped: string[];
}

/**
 * File system interface for LayoutService
 */
export interface LayoutFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
}

/**
 * LayoutService options
 */
export interface LayoutServiceOptions {
  /**
   * Directory containing template files
   */
  templatesDir?: string;
  
  /**
   * File system implementation (for testing)
   */
  fileSystem?: LayoutFileSystem;
  
  /**
   * Layout template configuration
   */
  templateConfig?: LayoutTemplateConfig;
}

/**
 * Configuration for default layout templates
 */
export interface LayoutTemplateConfig {
  /** Path to CSS stylesheet (default: '/assets/css/styles.css') */
  cssPath?: string;
  /** Path to JS file (default: '/assets/js/main.js') */
  jsPath?: string;
  /** Body CSS classes (default: none) */
  bodyClass?: string;
  /** Main content wrapper classes (default: none) */
  mainClass?: string;
  /** Header partial path (default: 'partials/header.liquid') */
  headerPartial?: string;
  /** Footer partial path (default: 'partials/footer.liquid') */
  footerPartial?: string;
  /** Include header partial (default: true) */
  includeHeader?: boolean;
  /** Include footer partial (default: true) */
  includeFooter?: boolean;
}

/**
 * Build default layout template from configuration
 */
function buildDefaultLayout(config: LayoutTemplateConfig = {}): string {
  const {
    cssPath = '/assets/css/styles.css',
    jsPath = '/assets/js/main.js',
    bodyClass = '',
    mainClass = '',
    headerPartial = 'partials/header.liquid',
    footerPartial = 'partials/footer.liquid',
    includeHeader = true,
    includeFooter = true,
  } = config;
  
  const bodyClassAttr = bodyClass ? ` class="${bodyClass}"` : '';
  const mainClassAttr = mainClass ? ` class="${mainClass}"` : '';
  const headerInclude = includeHeader ? `  {% include '${headerPartial}' %}\n  \n` : '';
  const footerInclude = includeFooter ? `  \n  {% include '${footerPartial}' %}` : '';
  
  return `<!DOCTYPE html>
<html lang="{{ lang | default: 'en' }}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  
  {% if meta.description %}
  <meta name="description" content="{{ meta.description }}">
  {% endif %}
  
  {% if meta.keywords %}
  <meta name="keywords" content="{{ meta.keywords | join: ', ' }}">
  {% endif %}
  
  <link rel="stylesheet" href="${cssPath}">
</head>
<body${bodyClassAttr}>
${headerInclude}  <main${mainClassAttr}>
    {{ content | raw }}
  </main>
${footerInclude}
  
  <script src="${jsPath}"></script>
</body>
</html>`;
}

/**
 * Build default page template
 */
function buildDefaultPage(): string {
  return `---
layout: layout
---

<article class="page">
  <div class="page-content">
    {{ content | raw }}
  </div>
</article>`;
}

/**
 * LayoutService - Ensures layout templates exist.
 * 
 * Responsibilities:
 * - Create layouts directory if missing
 * - Copy default templates if not present
 * - Never overwrite existing templates
 */
export class LayoutService implements IService<LayoutServiceInput, LayoutServiceOutput> {
  readonly name = 'layout';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = [];
  
  private context!: IServiceContext;
  private options: {
    templatesDir: string;
    fileSystem: LayoutFileSystem;
    templateConfig: LayoutTemplateConfig;
  };
  private fs: LayoutFileSystem;
  
  constructor(options: LayoutServiceOptions = {}) {
    this.options = {
      templatesDir: options.templatesDir ?? '',
      fileSystem: options.fileSystem ?? this.createDefaultFileSystem(),
      templateConfig: options.templateConfig ?? {},
    };
    this.fs = this.options.fileSystem;
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }
  
  async execute(input: LayoutServiceInput): Promise<LayoutServiceOutput> {
    const { viewsDir } = input;
    const layoutsDir = join(viewsDir, 'layouts');
    
    const created: string[] = [];
    const skipped: string[] = [];
    
    // Ensure layouts directory exists
    await this.fs.mkdir(layoutsDir);
    
    // Define templates to check/create
    const templates: Array<{ name: string; content: string }> = [
      { name: 'layout.liquid', content: buildDefaultLayout(this.options.templateConfig) },
      { name: 'page.liquid', content: buildDefaultPage() },
    ];
    
    // Try to load custom templates from templatesDir
    if (this.options.templatesDir) {
      for (const template of templates) {
        try {
          const customContent = await this.fs.readFile(
            join(this.options.templatesDir, template.name)
          );
          template.content = customContent;
        } catch {
          // Use default if custom not found
        }
      }
    }
    
    // Create templates if they don't exist
    for (const template of templates) {
      const destPath = join(layoutsDir, template.name);
      
      try {
        const exists = await this.fs.exists(destPath);
        if (exists) {
          skipped.push(destPath);
          continue;
        }
      } catch {
        // File doesn't exist, continue to create it
      }
      
      await this.fs.writeFile(destPath, template.content);
      created.push(destPath);
      
      this.context.logger.info(`Created layout: ${destPath}`);
    }
    
    return { created, skipped };
  }
  
  async dispose(): Promise<void> {
    // No cleanup needed
  }
  
  /**
   * Create default file system using Node.js fs
   */
  private createDefaultFileSystem(): LayoutFileSystem {
    return {
      readFile: async (path: string) => {
        const { readFile } = await import('node:fs/promises');
        return readFile(path, 'utf-8');
      },
      writeFile: async (path: string, content: string) => {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(path, content, 'utf-8');
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
      mkdir: async (path: string) => {
        const { mkdir } = await import('node:fs/promises');
        await mkdir(path, { recursive: true });
      },
    };
  }
}
