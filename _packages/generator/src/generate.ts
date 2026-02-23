/**
 * High-level generate() API.
 *
 * Orchestrator-only path:
 * - CSS stage
 * - HTML stage
 *
 * Optional postprocess:
 * - class log
 * - uncss
 * - variant elements
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Logger } from './core/logger';
import type { GeneratorConfig, RouteConfig } from './core/interfaces';
import { ClassLogService } from './services/class-log';
import { emitVariantElements } from './scripts/emit-variant-elements.js';
import { runGenerateSitePipeline } from './pipelines/generate-site';
import { runUncssPostprocess, type UncssStepConfig } from './steps/postprocess-uncss';

// Re-export types for convenience
export type { GeneratorConfig, RouteConfig };

export interface GenerateConfig extends Omit<GeneratorConfig, 'template' | 'assets' | 'clientScript'> {
  uncss?: UncssStepConfig;
  classLog?: {
    enabled?: boolean;
    outputDir?: string;
    baseName?: string;
    uikitMapPath?: string;
    includeResponsive?: boolean;
    includeStates?: boolean;
  };
  elements?: {
    enabled?: boolean;
    variantsDir?: string;
    outputDir?: string;
    componentsImportPath?: string;
  };
}

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

export async function generate(config: GenerateConfig): Promise<GenerateResult> {
  const startTime = performance.now();
  const logger = new Logger({ level: 'info' });
  const errors: Array<{ stage: string; error: Error }> = [];
  const generated: GenerateResult['generated'] = {
    views: 0,
    partials: 0,
    cssFiles: 0,
    htmlPages: 0,
    assets: 0,
    elements: 0,
    templates: 0,
  };

  try {
    validateConfig(config);
    logger.info(`🚀 Generating static site for ${config.app.name}`);

    const pipelineResult = await runGenerateSitePipeline(config, logger);
    errors.push(...pipelineResult.errors);

    // Extract generated counts from stage outputs
    for (const stage of pipelineResult.stages) {
      if (!stage.success || !stage.output) continue;
      if (stage.stage === 'css') {
        const out = stage.output as { files?: Array<unknown> };
        generated.cssFiles = out.files?.length ?? 0;
      }
      if (stage.stage === 'html') {
        const out = stage.output as { pages?: Array<unknown> };
        generated.htmlPages = out.pages?.length ?? 0;
      }
    }

    if (config.classLog?.enabled) {
      logger.info('📊 Generating class log...');
      await generateClassLog(config, logger);
    }

    if (config.uncss?.enabled) {
      logger.info('🔧 Running UnCSS optimization...');
      await runUncssPostprocess(config.uncss, logger);
    }

    if (config.elements?.enabled) {
      logger.info('🧩 Generating variant elements...');
      const elementsResult = await generateVariantElements(config, logger);
      generated.elements = elementsResult.generated;
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

async function generateClassLog(config: GenerateConfig, logger: Logger): Promise<void> {
  const classLogService = new ClassLogService();
  await classLogService.initialize({
    config: config as any,
    logger,
    eventBus: {
      emit: () => {},
      on: () => () => {},
      once: () => () => {},
      off: () => {},
      removeAllListeners: () => {},
      listenerCount: () => 0,
    } as any,
    registry: {
      has: () => false,
      resolve: () => {
        throw new Error('Not implemented');
      },
      register: () => {},
      getServiceNames: () => [],
      getInitializationOrder: () => [],
      initializeAll: async () => {},
      disposeAll: async () => {},
    } as any,
  });

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

  await mkdir(outputDir, { recursive: true });
  for (const [fileName, content] of result.files.entries()) {
    const filePath = join(outputDir, fileName);
    await writeFile(filePath, content, 'utf-8');
    logger.info(`  → ${filePath}`);
  }

  logger.info(`✅ Generated ${result.files.size} element files`);
  return { generated: result.files.size };
}

function validateConfig(config: GenerateConfig): void {
  if (!config.app?.name) {
    throw new Error('config.app.name is required');
  }
  if (!config.css?.outputDir || !config.html?.outputDir || !config.html?.viewsDir) {
    throw new Error('config.css.outputDir, config.html.outputDir and config.html.viewsDir are required');
  }
  if (config.uncss?.enabled) {
    if (!config.uncss.htmlFiles?.length || !config.uncss.cssFile) {
      throw new Error('uncss.enabled=true requires uncss.htmlFiles and uncss.cssFile');
    }
  }
}

