import type { IService, IServiceContext, RouteConfig } from '../../core/interfaces';
import { join, dirname } from 'node:path';
import { createNodeFileSystem } from '../../core/filesystem';

export interface HtmlServiceInput {
  outputDir: string;
  routes: Record<string, RouteConfig>;
  mode?: 'tailwind' | 'semantic' | 'inline';
  stripDataClassInTailwind?: boolean;
  cssOutputDir?: string;
  cssHref?: string;
  appConfig: {
    name: string;
    lang?: string;
  };
}

export interface HtmlServiceOutput {
  pages: Array<{
    route: string;
    path: string;
    size: number;
  }>;
}

export interface HtmlFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

export interface HtmlServiceOptions {
  fileSystem?: HtmlFileSystem;
}

/**
 * HtmlService - Generates final HTML pages from prepared HTML input.
 *
 * Reads raw HTML fragments from outputDir,
 * wraps them in a full HTML document with head/meta tags,
 * and processes the output mode (tailwind/semantic/inline).
 */
export class HtmlService implements IService<HtmlServiceInput, HtmlServiceOutput> {
  readonly name = 'html';
  readonly version = '3.0.0';
  readonly dependencies: readonly string[] = [];

  private context!: IServiceContext;
  private fs: HtmlFileSystem;

  constructor(options: HtmlServiceOptions = {}) {
    this.fs = options.fileSystem ?? createNodeFileSystem();
  }

  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }

  async execute(input: HtmlServiceInput): Promise<HtmlServiceOutput> {
    const {
      outputDir,
      routes,
      mode = 'tailwind',
      stripDataClassInTailwind = false,
      cssOutputDir,
      cssHref,
      appConfig,
    } = input;

    let cssContent: string | undefined;
    if (mode === 'inline' && cssOutputDir) {
      try {
        const pureCssFileName = this.context.config.css.outputFiles?.pureCss ?? 'ui8kit.local.css';
        cssContent = await this.fs.readFile(join(cssOutputDir, pureCssFileName));
      } catch {
        this.context.logger.warn('Could not load CSS for inline mode');
      }
    }

    const generatedPages: HtmlServiceOutput['pages'] = [];

    for (const [routePath, routeConfig] of Object.entries(routes)) {
      const htmlFileName = this.routeToHtmlFileName(routePath);
      const htmlPath = join(outputDir, htmlFileName);

      try {
        const rawContent = await this.fs.readFile(htmlPath);
        let html = this.buildSimpleHtmlDocument(routeConfig, appConfig, rawContent, cssHref);
        html = this.processHtmlContent(html, mode, cssContent, stripDataClassInTailwind);

        await this.fs.mkdir(dirname(htmlPath));
        await this.fs.writeFile(htmlPath, html);

        generatedPages.push({
          route: routePath,
          path: htmlPath,
          size: html.length,
        });

        this.context.eventBus.emit('html:generated', {
          route: routePath,
          path: htmlPath,
          size: html.length,
        });

        this.context.logger.info(`Generated HTML: ${htmlPath} (${html.length} bytes)`);
      } catch (error) {
        this.context.logger.error(`Failed to generate HTML for ${routePath}:`, error);
        throw error;
      }
    }

    return { pages: generatedPages };
  }

  async dispose(): Promise<void> {}

  private routeToHtmlFileName(routePath: string): string {
    if (routePath === '/') return 'index.html';
    return `${routePath.slice(1)}/index.html`;
  }

  private buildSimpleHtmlDocument(
    route: RouteConfig,
    appConfig: { name: string; lang?: string },
    content: string,
    cssHref?: string
  ): string {
    const meta = this.buildMetaTags(route, appConfig);
    const lang = appConfig.lang ?? 'en';
    const title = route.title;

    const metaTags = [
      `<meta charset="UTF-8">`,
      `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
      `<title>${this.escapeHtml(title)}</title>`,
      meta.description ? `<meta name="description" content="${this.escapeHtml(meta.description)}">` : '',
      meta.keywords ? `<meta name="keywords" content="${this.escapeHtml(meta.keywords)}">` : '',
      `<meta property="og:title" content="${this.escapeHtml(title)}">`,
      meta['og:description'] ? `<meta property="og:description" content="${this.escapeHtml(meta['og:description'])}">` : '',
      meta['og:image'] ? `<meta property="og:image" content="${this.escapeHtml(meta['og:image'])}">` : '',
      `<link rel="stylesheet" href="${this.escapeHtml(cssHref ?? '/css/styles.css')}">`,
    ]
      .filter(Boolean)
      .join('\n    ');

    return `<!DOCTYPE html>
<html lang="${this.escapeHtml(lang)}">
  <head>
    ${metaTags}
  </head>
  <body>
    ${content}
  </body>
</html>
`;
  }

  private buildMetaTags(route: RouteConfig, _appConfig: { name: string }): Record<string, string> {
    const meta: Record<string, string> = {};

    if (route.seo?.description) {
      meta.description = route.seo.description;
      meta['og:description'] = route.seo.description;
    }

    if (route.seo?.keywords) {
      meta.keywords = route.seo.keywords.join(', ');
    }

    meta['og:title'] = route.title;

    if (route.seo?.image) {
      meta['og:image'] = route.seo.image;
    }

    return meta;
  }

  private processHtmlContent(
    html: string,
    mode: 'tailwind' | 'semantic' | 'inline',
    cssContent?: string,
    stripDataClass?: boolean
  ): string {
    if (mode === 'tailwind') {
      if (stripDataClass) {
        return html.replace(/\s+data-class\s*=\s*["'][^"']*["']/g, '');
      }
      return html;
    }

    if (mode === 'semantic' || mode === 'inline') {
      html = html.replace(/\s+class\s*=\s*["'][^"']*["']/g, '');
      html = html.replace(/data-class\s*=\s*["']([^"']*)["']/g, 'class="$1"');
    }

    if (mode === 'inline' && cssContent) {
      const minified = cssContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';')
        .replace(/;\s*}/g, '}')
        .trim();
      html = html.replace('</head>', `  <style>${minified}</style>\n  </head>`);
    }

    return html;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
