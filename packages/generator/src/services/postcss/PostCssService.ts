import type { IService, IServiceContext } from '../../core/interfaces';
import { join, dirname } from 'node:path';
import { createNodeFileSystem } from '../../core/filesystem';

export interface PostCssServiceInput {
  enabled: boolean;
  entryImports?: string[];
  sourceDir?: string;
  cssOutputDir: string;
  htmlDir: string;
  outputDir: string;
  outputFileName?: string;
  uncss?: {
    enabled?: boolean;
    outputFileName?: string;
    timeout?: number;
  };
}

export interface PostCssServiceOutput {
  stylesPath: string | null;
  stylesSize: number;
  uncssPath: string | null;
  uncssSize: number;
}

export interface PostCssFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

export interface PostCssServiceOptions {
  fileSystem?: PostCssFileSystem;
}

export class PostCssService implements IService<PostCssServiceInput, PostCssServiceOutput> {
  readonly name = 'postcss';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = [];

  private context!: IServiceContext;
  private fs: PostCssFileSystem;

  constructor(options: PostCssServiceOptions = {}) {
    this.fs = options.fileSystem ?? createNodeFileSystem();
  }

  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }

  async execute(input: PostCssServiceInput): Promise<PostCssServiceOutput> {
    if (!input.enabled) {
      return { stylesPath: null, stylesSize: 0, uncssPath: null, uncssSize: 0 };
    }

    const {
      entryImports = [],
      sourceDir = '../html',
      cssOutputDir,
      htmlDir,
      outputDir,
      outputFileName = 'styles.css',
    } = input;

    try {
      await this.fs.mkdir(cssOutputDir);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EEXIST') throw error;
    }

    try {
      await this.fs.mkdir(outputDir);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EEXIST') throw error;
    }

    const entryLines = [
      '/* Auto-generated entry for PostCSS. Do not edit. */',
      '@import "tailwindcss";',
      '',
    ];
    for (const imp of entryImports) {
      entryLines.push(`@import "${imp}";`);
    }
    entryLines.push('', `@source "${sourceDir}";`, '');
    const entryContent = entryLines.join('\n');

    const entryPath = join(cssOutputDir, 'entry.css');
    await this.fs.writeFile(entryPath, entryContent);
    this.context.logger.info(`Created entry: ${entryPath}`);

    const stylesPath = join(outputDir, outputFileName);

    const postcss = (await import('postcss')).default;
    const tailwindPostcss = (await import('@tailwindcss/postcss')).default;

    const css = await this.fs.readFile(entryPath);
    const result = await postcss([tailwindPostcss()]).process(css, {
      from: entryPath,
      to: stylesPath,
    });
    await this.fs.mkdir(dirname(stylesPath));
    await this.fs.writeFile(stylesPath, result.css);

    const stylesSize = result.css.length;
    this.context.logger.info(`Generated ${stylesPath} (${(stylesSize / 1024).toFixed(1)} KB)`);

    let uncssPath: string | null = null;
    let uncssSize = 0;

    if (input.uncss?.enabled) {
      try {
        const uncssOutputFileName = input.uncss.outputFileName ?? 'unused.css';
        uncssPath = join(outputDir, uncssOutputFileName);

        const htmlFiles = await this.collectHtmlFiles(htmlDir);
        if (htmlFiles.length > 0) {
          const { createRequire } = await import('node:module');
          const require = createRequire(import.meta.url);
          const uncss = require('uncss');

          const cwd = process.cwd();
          const htmlPaths = htmlFiles.map((f) =>
            f.slice(cwd.length).replace(/\\/g, '/').replace(/^\//, '')
          );

          const normalized = stylesPath.replace(/\\/g, '/');
          const fileUrl = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;

          const optimized = await new Promise<string>((res, rej) => {
            uncss(
              htmlPaths,
              {
                stylesheets: [fileUrl],
                media: true,
                timeout: input.uncss?.timeout ?? 15000,
              },
              (err: Error | null, out: string) => (err ? rej(err) : res(out))
            );
          });

          await this.fs.writeFile(uncssPath, optimized);
          uncssSize = optimized.length;
          this.context.logger.info(`UnCSS -> ${uncssPath} (${(uncssSize / 1024).toFixed(1)} KB)`);
        }
      } catch (err) {
        this.context.logger.warn(`UnCSS failed: ${err instanceof Error ? err.message : err}`);
        uncssPath = null;
      }
    }

    return { stylesPath, stylesSize, uncssPath, uncssSize };
  }

  async dispose(): Promise<void> {}

  private async collectHtmlFiles(dir: string): Promise<string[]> {
    const { readdirSync, existsSync, statSync } = await import('node:fs');
    const files: string[] = [];
    if (!existsSync(dir)) return files;

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.collectHtmlFiles(full)));
      } else if (entry.name.endsWith('.html')) {
        files.push(full);
      }
    }
    return files;
  }
}
