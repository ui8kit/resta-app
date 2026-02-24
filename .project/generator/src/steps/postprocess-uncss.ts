import { dirname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { ILogger } from '../core/interfaces';

export interface UncssStepConfig {
  enabled?: boolean;
  htmlFiles?: string[];
  cssFile?: string;
  outputDir?: string;
  outputFileName?: string;
  ignore?: string[];
  media?: boolean;
  timeout?: number;
}

export async function runUncssPostprocess(
  config: UncssStepConfig | undefined,
  logger: ILogger
): Promise<string | null> {
  if (!config?.enabled) return null;
  if (!config.htmlFiles?.length || !config.cssFile) {
    throw new Error('uncss.enabled requires both htmlFiles and cssFile');
  }

  // Keep this optional/legacy: failures should not break generation.
  try {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const uncss = require('uncss');

    const output = await new Promise<string>((resolve, reject) => {
      uncss(
        config.htmlFiles,
        {
          stylesheets: [config.cssFile],
          ignore: config.ignore,
          media: config.media ?? true,
          timeout: config.timeout ?? 10000,
        },
        (error: Error | null, css: string) => {
          if (error) reject(error);
          else resolve(css);
        }
      );
    });

    const outputFileName = config.outputFileName ?? 'optimized.css';
    const outputPath = join(config.outputDir ?? '.', outputFileName);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, output, 'utf-8');
    logger.info(`  → ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.warn(`  ⚠️ UnCSS failed (skipped): ${error}`);
    return null;
  }
}

