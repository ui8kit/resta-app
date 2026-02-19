/**
 * High-level generate() API using the new Orchestrator system.
 * 
 * This provides a simple interface similar to the legacy generator.generate(config)
 * but uses the modern service-based architecture internally.
 */

import { writeFile, mkdir, copyFile, readdir, stat, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

import { Orchestrator } from './core/orchestrator';
import { Logger } from './core/logger';
import type { IServiceContext } from './core/interfaces';
import { 
  LayoutService,
  ViewService,
  CssService,
  HtmlService,
  AssetService,
  HtmlConverterService,
  RenderService,
} from './services';
import {
  LayoutStage,
  ViewStage,
  CssStage,
  HtmlStage,
  AssetStage,
} from './stages';
import { TemplateService } from './services/template';
import { ClassLogService } from './services/class-log';
import { emitVariantsApplyCss } from './scripts/emit-variants-apply.js';
import { emitVariantElements } from './scripts/emit-variant-elements.js';
import type { GeneratorConfig, RouteConfig } from './core/interfaces';

// Re-export types for convenience
export type { GeneratorConfig, RouteConfig };

/**
 * Extended config with all options
 */
export interface GenerateConfig extends GeneratorConfig {
  /** Client script configuration */
  clientScript?: {
    enabled?: boolean;
    outputDir?: string;
    fileName?: string;
    darkModeSelector?: string;
  };
  /** UnCSS configuration */
  uncss?: {
    enabled?: boolean;
    htmlFiles?: string[];
    cssFile?: string;
    outputDir?: string;
    ignore?: string[];
    media?: boolean;
    timeout?: number;
  };
  /** Asset copying configuration */
  assets?: {
    copy?: string[];
  };
  /** Vite bundle configuration - copy Vite build CSS/JS to HTML output */
  viteBundle?: {
    enabled?: boolean;
    /** Vite build output directory (default: './dist/assets') */
    viteBuildDir?: string;
    /** CSS output filename (default: 'styles.css') */
    cssFileName?: string;
    /** JS output filename (default: 'app.js') */
    jsFileName?: string;
    /** Copy JS bundle as well (default: false) */
    copyJs?: boolean;
  };
  /** Variant elements generation */
  elements?: {
    enabled?: boolean;
    variantsDir?: string;
    outputDir?: string;
    componentsImportPath?: string;
  };
  /** Class logging configuration - tracks all used classes */
  classLog?: {
    enabled?: boolean;
    /** Output directory for class log files (default: './dist/maps') */
    outputDir?: string;
    /** Base name for output files (default: 'ui8kit') */
    baseName?: string;
    /** Path to ui8kit.map.json for filtering valid classes */
    uikitMapPath?: string;
    /** Include responsive variants like md:, lg: (default: true) */
    includeResponsive?: boolean;
    /** Include state variants like hover:, focus: (default: true) */
    includeStates?: boolean;
  };
  
  /**
   * Template generation configuration.
   * 
   * Transforms React components to template files (Liquid, Handlebars, Twig, Latte).
   */
  template?: {
    /** Enable template generation */
    enabled?: boolean;
    /** Template engine to use */
    engine?: 'react' | 'liquid' | 'handlebars' | 'twig' | 'latte';
    /** Source directories for components */
    sourceDirs?: string[];
    /** Output directory for templates */
    outputDir?: string;
    /** File patterns to include */
    include?: string[];
    /** File patterns to exclude */
    exclude?: string[];
    /** Verbose logging */
    verbose?: boolean;
  };
}

/**
 * Generate result
 */
export interface GenerateResult {
  success: boolean;
  duration: number;
  errors: Array<{ stage: string; error: Error }>;
  generated: {
    views: number;
    partials: number;
    cssFiles: number;
    htmlPages: number;
    assets: number;
    elements: number;
    templates: number;
  };
}

/**
 * Generate static site from configuration.
 * 
 * This is the main entry point for the generator, providing a simple API
 * that configures and runs the Orchestrator with all required services.
 * 
 * @example
 * ```typescript
 * import { generate } from '@ui8kit/generator';
 * 
 * await generate({
 *   app: { name: 'My App' },
 *   css: { entryPath: './src/main.tsx', routes: ['/'], outputDir: './dist/css' },
 *   html: { viewsDir: './views', routes: { '/': { title: 'Home' } }, outputDir: './dist/html' },
 * });
 * ```
 */
export async function generate(config: GenerateConfig): Promise<GenerateResult> {
  const startTime = performance.now();
  const logger = new Logger({ level: 'info' });
  const errors: Array<{ stage: string; error: Error }> = [];
  const generated = {
    views: 0,
    partials: 0,
    cssFiles: 0,
    htmlPages: 0,
    assets: 0,
    elements: 0,
    templates: 0,
  };
  
  try {
    logger.info(`🚀 Generating static site for ${config.app.name}`);
    
    // 1. Create and configure Orchestrator
    const orchestrator = new Orchestrator({ logger });
    
    // 2. Register services
    orchestrator.registerService(new LayoutService());
    orchestrator.registerService(new RenderService());
    orchestrator.registerService(new HtmlConverterService());
    orchestrator.registerService(new ViewService());
    orchestrator.registerService(new CssService({ htmlConverter: new HtmlConverterService() }));
    orchestrator.registerService(new HtmlService());
    orchestrator.registerService(new AssetService());
    
    // 3. Add pipeline stages
    orchestrator.addStage(new LayoutStage());
    orchestrator.addStage(new ViewStage());
    orchestrator.addStage(new CssStage());
    orchestrator.addStage(new HtmlStage());
    orchestrator.addStage(new AssetStage());
    
    // 4. Initialize layouts (copy templates if missing)
    logger.info('📐 Initializing layouts...');
    await initializeLayouts(config, logger);
    
    // 5. Generate views (Liquid files from React)
    logger.info('📄 Generating Liquid views...');
    const viewResult = await generateViews(config, logger);
    generated.views = viewResult.views;
    generated.partials = viewResult.partials;
    
    // 5.5. Generate class log (before CSS, so we have all views ready)
    if (config.classLog?.enabled) {
      logger.info('📊 Generating class log...');
      await generateClassLog(config, logger);
    }
    
    // 6. Generate CSS
    logger.info('🎨 Generating CSS...');
    const cssResult = await generateCss(config, logger);
    generated.cssFiles = cssResult.files;
    
    // 7. Generate HTML
    logger.info('📝 Generating HTML pages...');
    const htmlResult = await generateHtml(config, logger);
    generated.htmlPages = htmlResult.pages;
    
    // 8. Copy assets (CSS and other files)
    if (config.assets?.copy?.length) {
      logger.info('📦 Copying assets...');
      const assetResult = await copyAssets(config, logger);
      generated.assets = assetResult.copied;
    }
    
    // 8.5. Copy Vite build artifacts (CSS/JS with hashes)
    if (config.viteBundle?.enabled) {
      logger.info('📎 Copying Vite build artifacts...');
      await copyViteBuildArtifacts(config, logger);
    }
    
    // 9. Generate client script
    if (config.clientScript?.enabled) {
      logger.info('📜 Generating client script...');
      await generateClientScript(config, logger);
    }
    
    // 10. Run UnCSS (optional)
    if (config.uncss?.enabled) {
      logger.info('🔧 Running UnCSS optimization...');
      await runUncss(config, logger);
    }
    
    // 11. Generate variant elements (optional)
    if (config.elements?.enabled) {
      logger.info('🧩 Generating variant elements...');
      const elementsResult = await generateVariantElements(config, logger);
      generated.elements = elementsResult.generated;
    }
    
    // 12. Generate templates from React components (optional)
    if (config.template?.enabled) {
      logger.info('🔧 Generating templates from React components...');
      const templateResult = await generateTemplates(config, logger);
      generated.templates = templateResult.generated;
    }
    
    const duration = performance.now() - startTime;
    logger.info(`✅ Static site generation completed in ${Math.round(duration)}ms!`);
    
    return {
      success: errors.length === 0,
      duration,
      errors,
      generated,
    };
    
  } catch (error) {
    const duration = performance.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`❌ Generation failed: ${err.message}`);
    errors.push({ stage: 'generate', error: err });
    
    return {
      success: false,
      duration,
      errors,
      generated,
    };
  }
}

// =============================================================================
// Internal generation functions
// =============================================================================

/**
 * Initialize layout templates by copying from generator's templates directory
 */
async function initializeLayouts(
  config: GenerateConfig,
  logger: Logger
): Promise<void> {
  const viewsDir = config.html.viewsDir;
  const layoutsDir = join(viewsDir, 'layouts');
  
  // Create layouts directory
  await mkdir(layoutsDir, { recursive: true });
  
  // Get path to generator's templates directory
  const generatorTemplatesDir = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'templates'
  );
  
  // Template files to copy
  const templateFiles = ['layout.liquid', 'page.liquid'];
  
  for (const templateFile of templateFiles) {
    const destPath = join(layoutsDir, templateFile);
    
    // Check if file already exists
    try {
      await stat(destPath);
      logger.debug(`  Layout exists: ${destPath}`);
      continue;
    } catch {
      // File doesn't exist, copy it
    }
    
    // Try to copy from generator templates
    const srcPath = join(generatorTemplatesDir, templateFile);
    
    try {
      const content = await readFile(srcPath, 'utf-8');
      await writeFile(destPath, content, 'utf-8');
      logger.info(`  → Created layout: ${destPath}`);
    } catch (error) {
      logger.warn(`  ⚠️ Could not copy template ${templateFile}: ${error}`);
    }
  }
}

async function generateViews(
  config: GenerateConfig, 
  logger: Logger
): Promise<{ views: number; partials: number }> {
  const renderService = new RenderService();
  const minimalContext = createMinimalContext(config, logger);
  await renderService.initialize(minimalContext);
  
  const viewsDir = config.html.viewsDir;
  const pagesDir = join(viewsDir, 'pages');
  await mkdir(pagesDir, { recursive: true });
  
  let viewCount = 0;
  let partialCount = 0;
  
  // Generate partials first
  if (config.html.partials) {
    const { sourceDir, outputDir = 'partials', props = {} } = config.html.partials;
    const partialsOutputDir = join(viewsDir, outputDir);
    await mkdir(partialsOutputDir, { recursive: true });
    
    try {
      const entries = await readdir(sourceDir);
      
      for (const entry of entries) {
        if (!entry.match(/\.(tsx?|jsx?)$/i)) continue;
        
        const componentName = entry.replace(/\.(tsx?|jsx?)$/i, '');
        const modulePath = join(sourceDir, entry);
        const componentProps = props[componentName] ?? {};
        
        try {
          const result = await renderService.execute({
            type: 'component',
            modulePath,
            exportName: componentName,
            props: componentProps,
          });
          
          // Fix Liquid escaping
          let html = unescapeLiquidTags(result.html);
          
          const outputFileName = `${componentName.toLowerCase()}.liquid`;
          const outputPath = join(partialsOutputDir, outputFileName);
          
          const header = `{% comment %} Auto-generated partial. Do not edit manually. {% endcomment %}\n`;
          await writeFile(outputPath, header + html + '\n', 'utf-8');
          
          logger.info(`  → ${outputPath}`);
          partialCount++;
        } catch (error) {
          logger.warn(`  ⚠️ Failed to generate partial ${componentName}: ${error}`);
        }
      }
    } catch (error) {
      logger.warn(`  ⚠️ Failed to read partials directory: ${error}`);
    }
  }
  
  // Generate page views from routes
  for (const [routePath] of Object.entries(config.html.routes)) {
    try {
      const result = await renderService.execute({
        type: 'route',
        entryPath: config.css.entryPath,
        routePath,
      });
      
      const viewFileName = routePath === '/' ? 'index.liquid' : `${routePath.slice(1)}.liquid`;
      const viewPath = join(pagesDir, viewFileName);
      
      await mkdir(dirname(viewPath), { recursive: true });
      await writeFile(viewPath, result.html, 'utf-8');
      
      logger.info(`  → ${viewPath}`);
      viewCount++;
    } catch (error) {
      logger.warn(`  ⚠️ Failed to generate view for ${routePath}: ${error}`);
    }
  }
  
  return { views: viewCount, partials: partialCount };
}

/**
 * Generate class log JSON file with all used Tailwind classes.
 * 
 * This scans all Liquid views and extracts class names,
 * outputting them to a JSON file that can be used:
 * - As a Tailwind safelist
 * - For validation against whitelist
 * - To see actual class usage statistics
 */
async function generateClassLog(
  config: GenerateConfig,
  logger: Logger
): Promise<void> {
  const classLogService = new ClassLogService();
  const minimalContext = createMinimalContext(config, logger);
  await classLogService.initialize(minimalContext);
  
  const {
    outputDir = './dist/maps',
    baseName = 'ui8kit',
    uikitMapPath,
    includeResponsive = true,
    includeStates = true,
  } = config.classLog ?? {};
  
  const result = await classLogService.execute({
    viewsDir: config.html.viewsDir,
    outputDir,
    baseName,
    uikitMapPath,
    includeResponsive,
    includeStates,
  });
  
  logger.info(`  📊 Found ${result.totalClasses} unique classes (${result.validClasses} valid)`);
  
  await classLogService.dispose();
}

async function generateCss(
  config: GenerateConfig,
  logger: Logger
): Promise<{ files: number }> {
  const converterService = new HtmlConverterService();
  const minimalContext = createMinimalContext(config, logger);
  await converterService.initialize(minimalContext);
  
  const { viewsDir } = config.html;
  const { outputDir, pureCss = false } = config.css;
  
  await mkdir(outputDir, { recursive: true });
  
  // Emit variants.apply.css first
  const variantsCss = await emitVariantsApplyCss({
    variantsDir: config.elements?.variantsDir ?? './src/variants',
  });
  const variantsOutputPath = join(outputDir, 'variants.apply.css');
  await writeFile(variantsOutputPath, variantsCss, 'utf-8');
  logger.info(`✅ Generated ${variantsOutputPath} (${variantsCss.length} bytes)`);
  
  let fileCount = 1; // variants.apply.css
  
  const allApplyCss: string[] = [];
  const allPureCss: string[] = [];
  
  // Process page views
  for (const routePath of Object.keys(config.html.routes)) {
    const viewFileName = routePath === '/' ? 'index.liquid' : `${routePath.slice(1)}.liquid`;
    const viewPath = join(viewsDir, 'pages', viewFileName);
    
    try {
      const result = await converterService.execute({ htmlPath: viewPath, verbose: true });
      allApplyCss.push(result.applyCss);
      if (pureCss) {
        allPureCss.push(result.pureCss);
      }
    } catch (error) {
      logger.warn(`  ⚠️ Failed to process CSS for ${routePath}: ${error}`);
    }
  }
  
  // Process partials and layouts
  const templateDirs = [
    join(viewsDir, 'partials'),
    join(viewsDir, 'layouts'),
  ];
  
  for (const dirPath of templateDirs) {
    try {
      const entries = await readdir(dirPath);
      for (const entry of entries) {
        if (!entry.endsWith('.liquid')) continue;
        const filePath = join(dirPath, entry);
        
        logger.info(`📄 Processing template: ${filePath}`);
        
        try {
          const result = await converterService.execute({ htmlPath: filePath, verbose: true });
          allApplyCss.push(result.applyCss);
          if (pureCss) {
            allPureCss.push(result.pureCss);
          }
        } catch (error) {
          logger.warn(`  ⚠️ Failed to process CSS for ${filePath}: ${error}`);
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }
  
  // Merge and write CSS files
  const mergedApplyCss = mergeCssFiles(allApplyCss.filter(Boolean));
  const applyCssPath = join(outputDir, 'tailwind.apply.css');
  await writeFile(applyCssPath, mergedApplyCss, 'utf-8');
  logger.info(`✅ Generated ${applyCssPath} (${mergedApplyCss.length} bytes)`);
  fileCount++;
  
  if (pureCss) {
    const mergedPureCss = mergeCssFiles(allPureCss.filter(Boolean));
    const pureCssPath = join(outputDir, 'ui8kit.local.css');
    await writeFile(pureCssPath, mergedPureCss, 'utf-8');
    logger.info(`✅ Generated ${pureCssPath} (${mergedPureCss.length} bytes)`);
    fileCount++;
  }
  
  return { files: fileCount };
}

async function generateHtml(
  config: GenerateConfig,
  logger: Logger
): Promise<{ pages: number }> {
  const { Liquid } = await import('liquidjs');
  const engine = new Liquid({ 
    root: [config.html.viewsDir],
    extname: '.liquid',
  });
  
  const { outputDir, mode = 'tailwind', stripDataClassInTailwind = false } = config.html;
  await mkdir(outputDir, { recursive: true });
  
  let pageCount = 0;
  
  // Load CSS for inline mode
  let cssContent: string | undefined;
  if (mode === 'inline') {
    try {
      const cssPath = join(config.css.outputDir, 'ui8kit.local.css');
      cssContent = await readFile(cssPath, 'utf-8');
    } catch {
      logger.warn('  ⚠️ Could not load CSS for inline mode');
    }
  }
  
  for (const [routePath, routeConfig] of Object.entries(config.html.routes)) {
    try {
      const viewFileName = routePath === '/' ? 'index.liquid' : `${routePath.slice(1)}.liquid`;
      const viewPath = join(config.html.viewsDir, 'pages', viewFileName);
      const viewContent = await readFile(viewPath, 'utf-8');
      
      const templateData = {
        content: viewContent,
        title: routeConfig.title,
        meta: buildMetaTags(routeConfig, config.app),
        lang: config.app.lang ?? 'en',
        name: config.app.name,
        ...routeConfig.data,
      };
      
      let html = await engine.renderFile('layouts/layout.liquid', templateData);
      
      // Process based on mode
      html = processHtmlContent(html, mode, cssContent, stripDataClassInTailwind);
      
      const htmlFileName = routePath === '/' ? 'index.html' : `${routePath.slice(1)}/index.html`;
      const htmlPath = join(outputDir, htmlFileName);
      
      await mkdir(dirname(htmlPath), { recursive: true });
      await writeFile(htmlPath, html, 'utf-8');
      
      logger.info(`  → ${htmlPath}`);
      pageCount++;
    } catch (error) {
      logger.error(`  ❌ Failed to generate HTML for ${routePath}: ${error}`);
    }
  }
  
  return { pages: pageCount };
}

async function copyAssets(
  config: GenerateConfig,
  logger: Logger
): Promise<{ copied: number }> {
  const patterns = config.assets?.copy ?? [];
  let copied = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern, { nodir: true });
    
    for (const file of files) {
      // Normalize path separators
      const normalizedFile = file.replace(/\\/g, '/');
      
      // Get just the filename
      const fileName = normalizedFile.split('/').pop() ?? normalizedFile;
      
      // Determine output path based on file type
      let outputPath: string;
      
      if (normalizedFile.includes('/css/') || fileName.endsWith('.css')) {
        // CSS files go to css output directory
        outputPath = join(config.css.outputDir, fileName);
      } else if (normalizedFile.includes('/js/') || fileName.endsWith('.js')) {
        // JS files go to html assets/js
        outputPath = join(config.html.outputDir, 'assets', 'js', fileName);
      } else {
        // Other files go to html assets with just the filename
        outputPath = join(config.html.outputDir, 'assets', fileName);
      }
      
      await mkdir(dirname(outputPath), { recursive: true });
      await copyFile(file, outputPath);
      
      logger.info(`  → ${outputPath}`);
      copied++;
    }
  }
  
  logger.info(`  ✅ Copied ${copied} asset files`);
  return { copied };
}

/**
 * Copy Vite build artifacts (CSS/JS with content hashes) to HTML output directory.
 * 
 * Vite generates files like `index-D-pnRIbb.css` with content hashes.
 * This function finds those files and copies them with clean names
 * (e.g., `styles.css`) to the HTML output directory.
 */
async function copyViteBuildArtifacts(
  config: GenerateConfig,
  logger: Logger
): Promise<{ css?: string; js?: string }> {
  const {
    viteBuildDir = './dist/assets',
    cssFileName = 'styles.css',
    jsFileName = 'app.js',
    copyJs = false,
  } = config.viteBundle ?? {};
  
  const htmlOutputDir = config.html.outputDir;
  const result: { css?: string; js?: string } = {};
  
  // Check if Vite build directory exists
  try {
    await stat(viteBuildDir);
  } catch {
    logger.warn(`  ⚠ Vite build directory not found: ${viteBuildDir}`);
    logger.info('  💡 Run "bun run build" first to create Vite build artifacts');
    return result;
  }
  
  // List files in Vite build directory
  const files = await readdir(viteBuildDir);
  
  // Find and copy CSS file (pattern: *.css with hash)
  const cssFile = files.find(f => f.endsWith('.css'));
  
  if (cssFile) {
    const cssOutputDir = join(htmlOutputDir, 'css');
    await mkdir(cssOutputDir, { recursive: true });
    
    const srcPath = join(viteBuildDir, cssFile);
    const destPath = join(cssOutputDir, cssFileName);
    
    await copyFile(srcPath, destPath);
    
    const stats = await stat(srcPath);
    const size = formatBytes(stats.size);
    
    result.css = destPath;
    logger.info(`  ✅ ${cssFile} → ${destPath} (${size})`);
  } else {
    logger.debug('  No CSS file found in Vite build directory');
  }
  
  // Find and copy JS file if requested
  if (copyJs) {
    // Find main JS file (exclude chunks)
    const jsFile = files.find(f => f.endsWith('.js') && f.startsWith('index-'));
    
    if (jsFile) {
      const jsOutputDir = join(htmlOutputDir, 'js');
      await mkdir(jsOutputDir, { recursive: true });
      
      const srcPath = join(viteBuildDir, jsFile);
      const destPath = join(jsOutputDir, jsFileName);
      
      await copyFile(srcPath, destPath);
      
      const stats = await stat(srcPath);
      const size = formatBytes(stats.size);
      
      result.js = destPath;
      logger.info(`  ✅ ${jsFile} → ${destPath} (${size})`);
    }
  }
  
  return result;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function generateClientScript(
  config: GenerateConfig,
  logger: Logger
): Promise<void> {
  const { outputDir = './dist/assets/js', fileName = 'main.js', darkModeSelector = '[data-toggle-dark]' } = config.clientScript ?? {};
  
  await mkdir(outputDir, { recursive: true });
  
  const script = `// Auto-generated client script
(function() {
  'use strict';
  
  // Dark mode toggle
  const toggles = document.querySelectorAll('${darkModeSelector}');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
  });
  
  // Apply saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
})();
`;
  
  const outputPath = join(outputDir, fileName);
  await writeFile(outputPath, script, 'utf-8');
  logger.info(`  → ${outputPath}`);
}

async function runUncss(
  config: GenerateConfig,
  logger: Logger
): Promise<void> {
  const uncssConfig = config.uncss;
  if (!uncssConfig) return;
  
  try {
    // @ts-ignore - uncss is CommonJS
    const uncss = (await import('uncss')).default;
    
    const result = await new Promise<string>((resolve, reject) => {
      uncss(uncssConfig.htmlFiles, {
        stylesheets: [uncssConfig.cssFile],
        ignore: uncssConfig.ignore,
        media: uncssConfig.media ?? true,
        timeout: uncssConfig.timeout ?? 10000,
      }, (error: Error | null, output: string) => {
        if (error) reject(error);
        else resolve(output);
      });
    });
    
    const outputPath = join(uncssConfig.outputDir ?? '.', 'optimized.css');
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, result, 'utf-8');
    
    logger.info(`  → ${outputPath}`);
  } catch (error) {
    logger.warn(`  ⚠️ UnCSS failed: ${error}`);
  }
}

async function generateVariantElements(
  config: GenerateConfig,
  logger: Logger
): Promise<{ generated: number }> {
  const elementsConfig = config.elements;
  if (!elementsConfig) return { generated: 0 };
  
  const outputDir = elementsConfig.outputDir ?? './src/elements';
  
  const result = await emitVariantElements({
    variantsDir: elementsConfig.variantsDir ?? './src/variants',
    outputDir,
    componentsImportPath: elementsConfig.componentsImportPath ?? '../components',
  });
  
  // Write files to disk
  await mkdir(outputDir, { recursive: true });
  
  for (const [fileName, content] of result.files.entries()) {
    const filePath = join(outputDir, fileName);
    await writeFile(filePath, content, 'utf-8');
    logger.info(`  → ${filePath}`);
  }
  
  logger.info(`✅ Generated ${result.files.size} element files`);
  
  return { generated: result.files.size };
}

/**
 * Generate template files from React components.
 * 
 * Uses the TemplateService to transform React components into template files
 * for various template engines (Liquid, Handlebars, Twig, Latte).
 */
async function generateTemplates(
  config: GenerateConfig,
  logger: Logger
): Promise<{ generated: number }> {
  const templateConfig = config.template;
  if (!templateConfig) return { generated: 0 };
  
  const templateService = new TemplateService();
  const minimalContext = createMinimalContext(config, logger);
  await templateService.initialize(minimalContext);
  
  const {
    engine = 'liquid',
    sourceDirs = ['./src/components', './src/blocks', './src/layouts', './src/partials'],
    outputDir = './dist/templates',
    include = ['**/*.tsx'],
    exclude = ['**/*.test.tsx', '**/*.spec.tsx', '**/node_modules/**'],
    verbose = false,
  } = templateConfig;
  
  // Resolve relative paths to absolute
  const cwd = process.cwd();
  const resolvedSourceDirs = sourceDirs.map(dir => 
    dir.startsWith('/') || /^[a-zA-Z]:/.test(dir) 
      ? dir 
      : join(cwd, dir.replace(/^\.\//, ''))
  );
  const resolvedOutputDir = outputDir.startsWith('/') || /^[a-zA-Z]:/.test(outputDir)
    ? outputDir
    : join(cwd, outputDir.replace(/^\.\//, ''));
  
  if (verbose) {
    logger.debug(`Template source dirs: ${resolvedSourceDirs.join(', ')}`);
    logger.debug(`Template output dir: ${resolvedOutputDir}`);
  }
  
  try {
    const result = await templateService.execute({
      sourceDirs: resolvedSourceDirs,
      outputDir: resolvedOutputDir,
      engine,
      include,
      exclude,
      verbose,
    });
    
    // Log errors
    if (result.errors.length > 0) {
      for (const error of result.errors) {
        logger.error(`  ❌ ${error}`);
      }
    }
    
    // Log warnings if verbose
    if (verbose && result.warnings.length > 0) {
      for (const warning of result.warnings) {
        logger.warn(`  ⚠️ ${warning}`);
      }
    }
    
    logger.info(`  ✅ Generated ${result.files.length} ${engine} templates in ${result.duration}ms`);
    
    // Log individual files if verbose
    if (verbose) {
      for (const file of result.files) {
        logger.info(`    → ${file.output} (${file.componentName})`);
      }
    }
    
    await templateService.dispose();
    
    return { generated: result.files.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`  ❌ Template generation failed: ${message}`);
    return { generated: 0 };
  }
}

// =============================================================================
// Helper functions
// =============================================================================

function createMinimalContext(config: GenerateConfig, logger: Logger): IServiceContext {
  return {
    config: config as any,
    logger: logger as any,
    eventBus: {
      emit: () => {},
      on: () => () => {},
      once: () => () => {},
      off: () => {},
      removeAllListeners: () => {},
      listenerCount: () => 0,
    },
    registry: {
      has: () => false,
      resolve: () => { throw new Error('Not implemented'); },
      register: () => {},
      getServiceNames: () => [],
      getInitializationOrder: () => [],
      initializeAll: async () => {},
      disposeAll: async () => {},
    },
  } as any;
}

function unescapeLiquidTags(html: string): string {
  const decode = (s: string) =>
    s.replace(/&#x27;|&apos;/g, "'").replace(/&quot;|&#34;/g, '"');
  
  html = html.replace(/\{\{[\s\S]*?\}\}/g, (m) => decode(m));
  html = html.replace(/\{%\s*[\s\S]*?\s*%\}/g, (m) => decode(m));
  
  return html;
}

function mergeCssFiles(cssFiles: string[]): string {
  if (cssFiles.length === 0) return '';
  if (cssFiles.length === 1) return cssFiles[0];
  
  return cssFiles.join('\n\n/* === Next Source === */\n\n')
    .replace(/Generated on: .*/, `Generated on: ${new Date().toISOString()}`);
}

function buildMetaTags(route: RouteConfig, app: { name: string }): Record<string, string> {
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

function processHtmlContent(
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

/**
 * Create a generator instance (for backward compatibility)
 */
export function createGenerator() {
  return { generate };
}

// Default export for simple usage
export default { generate };
