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

    try {
      const config = await loadAppConfig(cwd);
      const runtimeConfig = {
        ...config,
        ...(options.outDir ? { outDir: options.outDir } : {}),
        ...(options.target ? { target: options.target } : {}),
      };

      const result = await buildProject(runtimeConfig, cwd);
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
      console.error(
        chalk.red('Generation failed:'),
        (error as Error).message
      );
      process.exit(1);
    }
  });

program.parse();
