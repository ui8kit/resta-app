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
 */

import { existsSync } from 'node:fs';
import { z } from 'zod';

import { Logger } from './core/logger';
import type { GeneratorConfig, RouteConfig } from './core/interfaces';
import { runGenerateSitePipeline } from './pipelines/generate-site';
import { runUncssPostprocess, type UncssStepConfig } from './steps/postprocess-uncss';

// Re-export types for convenience
export type { GeneratorConfig, RouteConfig };

const routeConfigSchema = z.object({
  title: z.string().min(1),
  seo: z
    .object({
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      image: z.string().optional(),
    })
    .optional(),
  data: z.record(z.unknown()).optional(),
});

const generateConfigSchema = z.object({
  app: z.object({
    name: z.string().min(1),
    lang: z.string().optional(),
  }),
  mappings: z
    .object({
      ui8kitMap: z.string().optional(),
      shadcnMap: z.string().optional(),
    })
    .optional(),
  css: z.object({
    routes: z.array(z.string()).default(['/']),
    outputDir: z.string().min(1),
    pureCss: z.boolean().optional(),
    outputFiles: z
      .object({
        applyCss: z.string().optional(),
        pureCss: z.string().optional(),
        variantsCss: z.string().optional(),
        shadcnCss: z.string().optional(),
      })
      .optional(),
  }),
  html: z.object({
    viewsDir: z.string().min(1),
    viewsPagesSubdir: z.string().optional(),
    routes: z.record(routeConfigSchema),
    outputDir: z.string().min(1),
    mode: z.enum(['tailwind', 'semantic', 'inline']).optional(),
    cssHref: z.string().optional(),
    stripDataClassInTailwind: z.boolean().optional(),
  }),
  uncss: z
    .object({
      enabled: z.boolean().optional(),
      htmlFiles: z.array(z.string()).optional(),
      cssFile: z.string().optional(),
      outputDir: z.string().optional(),
      outputFileName: z.string().optional(),
      ignore: z.array(z.string()).optional(),
      media: z.boolean().optional(),
      timeout: z.number().optional(),
    })
    .optional(),
  classLog: z
    .object({
      enabled: z.boolean().optional(),
      outputDir: z.string().optional(),
      baseName: z.string().optional(),
      uikitMapPath: z.string().optional(),
      includeResponsive: z.boolean().optional(),
      includeStates: z.boolean().optional(),
    })
    .optional(),
  mdx: z
    .object({
      enabled: z.boolean(),
      docsDir: z.string(),
      outputDir: z.string(),
      demosDir: z.string().optional(),
      navOutput: z.string().optional(),
      basePath: z.string().optional(),
      components: z.record(z.string()).optional(),
      propsSource: z.string().optional(),
      toc: z
        .object({
          minLevel: z.number().optional(),
          maxLevel: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  plugins: z.record(z.unknown()).optional(),
});

export interface GenerateConfig extends Omit<GeneratorConfig, 'template' | 'assets' | 'clientScript'> {
  uncss?: UncssStepConfig;
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
    templates: 0,
  };

  try {
    const parsedConfig = validateConfig(config);
    logger.info(`🚀 Generating static site for ${parsedConfig.app.name}`);

    const pipelineResult = await runGenerateSitePipeline(parsedConfig, logger);
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

    if (parsedConfig.uncss?.enabled) {
      logger.info('🔧 Running UnCSS optimization...');
      await runUncssPostprocess(parsedConfig.uncss, logger);
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

function validateConfig(config: GenerateConfig): GenerateConfig {
  const parsed = generateConfigSchema.parse(config) as GenerateConfig;

  /*if (!existsSync(parsed.html.viewsDir)) {
    throw new Error(`config.html.viewsDir does not exist: ${parsed.html.viewsDir}`);
  }*/

  if (parsed.html.mode === 'inline' && !parsed.css.outputDir) {
    throw new Error('html.mode=inline requires config.css.outputDir');
  }

  if (parsed.uncss?.enabled && (!parsed.uncss.htmlFiles?.length || !parsed.uncss.cssFile)) {
    throw new Error('uncss.enabled=true requires uncss.htmlFiles and uncss.cssFile');
  }

  return parsed;
}

