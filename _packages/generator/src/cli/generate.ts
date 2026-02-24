#!/usr/bin/env bun

/**
 * ui8kit-generate — Generate target templates from app config.
 * Lives in generator: app build/generation is the generator's responsibility.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadAppConfig } from '@ui8kit/sdk/config';
import { buildProject } from '../build-project';
import type { BuildTarget } from '@ui8kit/sdk';

const program = new Command();

async function debugLog(runId: string, hypothesisId: string, location: string, message: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch('http://127.0.0.1:7618/ingest/1a743e9b-8a63-4e35-95d4-015cb5a878d0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '4cbe3d',
      },
      body: JSON.stringify({
        sessionId: '4cbe3d',
        runId,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    });
  } catch {
    // ignore logging transport failures
  }
}

program
  .name('ui8kit-generate')
  .description('Generate target templates from ui8kit.config')
  .option('--cwd <dir>', 'Working directory', process.cwd())
  .option('--out-dir <dir>', 'Output directory override')
  .option(
    '--target <engine>',
    'Target engine: react|liquid|handlebars|twig|latte'
  )
  .addHelpText(
    'after',
    `
Examples:
  bunx ui8kit-generate
  bunx ui8kit-generate --cwd ./apps/engine --target react
  bunx ui8kit-generate --cwd ./apps/engine --target liquid --out-dir ./dist/liquid
`
  )
  .action(async (options: { cwd?: string; outDir?: string; target?: BuildTarget }) => {
    const cwd = options.cwd ?? process.cwd();
    // #region agent log
    await debugLog('pre-fix', 'H2', 'src/cli/generate.ts:60', 'CLI action entered', { cwd, options });
    // #endregion

    try {
      const config = await loadAppConfig(cwd);
      // #region agent log
      await debugLog('pre-fix', 'H2', 'src/cli/generate.ts:66', 'Config loaded from sdk', {
        target: config.target,
        outDir: config.outDir,
      });
      // #endregion
      const runtimeConfig = {
        ...config,
        ...(options.outDir ? { outDir: options.outDir } : {}),
        ...(options.target ? { target: options.target } : {}),
      };
      // #region agent log
      await debugLog('pre-fix', 'H4', 'src/cli/generate.ts:77', 'Runtime config prepared for buildProject', {
        target: runtimeConfig.target,
        outDir: runtimeConfig.outDir,
      });
      // #endregion

      const result = await buildProject(runtimeConfig, cwd);
      // #region agent log
      await debugLog('pre-fix', 'H1', 'src/cli/generate.ts:85', 'buildProject returned', {
        ok: result.ok,
        engine: result.engine,
        outputDir: result.outputDir,
        errorsCount: result.errors.length,
        firstError: result.errors[0],
      });
      // #endregion
      if (!result.ok) {
        console.log(chalk.red('Generation failed.'));
        for (const error of result.errors) {
          console.log(` - ${error}`);
        }
        process.exit(1);
      }

      console.log(chalk.green('Generation completed.'));
      console.log(`Engine: ${result.engine}`);
      console.log(`Output: ${result.outputDir}`);
      console.log(`Files: ${result.generated}`);
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        for (const warning of result.warnings) {
          console.log(` - ${warning}`);
        }
      }
    } catch (error) {
      // #region agent log
      await debugLog('pre-fix', 'H2', 'src/cli/generate.ts:113', 'CLI caught exception', {
        message: (error as Error).message,
      });
      // #endregion
      console.error(
        chalk.red('Generation failed:'),
        (error as Error).message
      );
      process.exit(1);
    }
  });

program.parse();
