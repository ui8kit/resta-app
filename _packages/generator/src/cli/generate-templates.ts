#!/usr/bin/env bun
/**
 * CLI command for generating templates from React components
 *
 * Usage:
 *   bun run generate:templates [options]
 *
 * Options:
 *   --engine, -e    Template engine (liquid, handlebars, twig, latte) [default: liquid]
 *   --source, -s    Source directories (comma-separated) [default: ./src/components]
 *   --output, -o    Output directory [default: ./dist/templates]
 *   --include, -i   File patterns to include [default: **\/*.tsx]
 *   --exclude, -x   File patterns to exclude [default: **\/*.test.tsx]
 *   --verbose, -v   Enable verbose logging
 *   --help, -h      Show help
 *
 * Examples:
 *   bun run generate:templates
 *   bun run generate:templates --engine handlebars
 *   bun run generate:templates -s ./src/blocks,./src/layouts -o ./dist/tpl
 */

import { TemplateService, type TemplateServiceInput } from '../services/template';
import { Logger } from '../core/logger';

// =============================================================================
// Parse Arguments
// =============================================================================

interface CliArgs {
  engine: 'react' | 'liquid' | 'handlebars' | 'twig' | 'latte';
  sourceDirs: string[];
  outputDir: string;
  include: string[];
  exclude: string[];
  verbose: boolean;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  
  const result: CliArgs = {
    engine: 'liquid',
    sourceDirs: ['./src/components'],
    outputDir: './dist/templates',
    include: ['**/*.tsx'],
    exclude: ['**/*.test.tsx', '**/*.spec.tsx', '**/node_modules/**'],
    verbose: false,
    help: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--engine':
      case '-e':
        if (nextArg && ['react', 'liquid', 'handlebars', 'twig', 'latte'].includes(nextArg)) {
          result.engine = nextArg as typeof result.engine;
          i++;
        }
        break;
        
      case '--source':
      case '-s':
        if (nextArg) {
          result.sourceDirs = nextArg.split(',').map(s => s.trim());
          i++;
        }
        break;
        
      case '--output':
      case '-o':
        if (nextArg) {
          result.outputDir = nextArg;
          i++;
        }
        break;
        
      case '--include':
      case '-i':
        if (nextArg) {
          result.include = nextArg.split(',').map(s => s.trim());
          i++;
        }
        break;
        
      case '--exclude':
      case '-x':
        if (nextArg) {
          result.exclude = nextArg.split(',').map(s => s.trim());
          i++;
        }
        break;
        
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
        
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }
  
  return result;
}

function showHelp(): void {
  console.log(`
UI8Kit Template Generator

Usage:
  bun run generate:templates [options]

Options:
  --engine, -e    Template engine: liquid, handlebars, twig, latte
                  Default: liquid

  --source, -s    Source directories (comma-separated)
                  Default: ./src/components

  --output, -o    Output directory for generated templates
                  Default: ./dist/templates

  --include, -i   File patterns to include (comma-separated)
                  Default: **/*.tsx

  --exclude, -x   File patterns to exclude (comma-separated)
                  Default: **/*.test.tsx,**/*.spec.tsx,**/node_modules/**

  --verbose, -v   Enable verbose logging

  --help, -h      Show this help message

Examples:
  # Generate Liquid templates from default sources
  bun run generate:templates

  # Generate Handlebars templates
  bun run generate:templates --engine handlebars

  # Custom source and output directories
  bun run generate:templates -s ./src/blocks,./src/layouts -o ./dist/tpl

  # Generate Twig templates with verbose output
  bun run generate:templates -e twig -v
`);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  const logger = new Logger({
    level: args.verbose ? 'debug' : 'info',
  });
  
  logger.info(`🔧 UI8Kit Template Generator`);
  logger.info(`   Engine: ${args.engine}`);
  logger.info(`   Sources: ${args.sourceDirs.join(', ')}`);
  logger.info(`   Output: ${args.outputDir}`);
  logger.info('');
  
  const service = new TemplateService();
  
  // Initialize with minimal context
  await service.initialize({
    config: {},
    logger: logger as any,
    eventBus: {
      emit: () => {},
      on: () => () => {},
      once: () => () => {},
      off: () => {},
      removeAllListeners: () => {},
      listenerCount: () => 0,
    },
    registry: null as any,
  });
  
  const input: TemplateServiceInput = {
    sourceDirs: args.sourceDirs.map(dir => {
      // Resolve relative paths
      if (!dir.startsWith('/') && !/^[a-zA-Z]:/.test(dir)) {
        return `${process.cwd()}/${dir.replace(/^\.\//, '')}`;
      }
      return dir;
    }),
    outputDir: args.outputDir.startsWith('/')
      ? args.outputDir
      : `${process.cwd()}/${args.outputDir.replace(/^\.\//, '')}`,
    engine: args.engine,
    include: args.include,
    exclude: args.exclude,
    verbose: args.verbose,
  };
  
  const result = await service.execute(input);
  
  await service.dispose();
  
  // Print summary
  logger.info('');
  logger.info('━'.repeat(50));
  
  if (result.errors.length > 0) {
    logger.error(`❌ Completed with ${result.errors.length} errors`);
    for (const error of result.errors) {
      logger.error(`   ${error}`);
    }
  } else {
    logger.info(`✅ Successfully generated ${result.files.length} templates`);
  }
  
  if (result.warnings.length > 0 && args.verbose) {
    logger.warn(`   Warnings: ${result.warnings.length}`);
  }
  
  logger.info(`   Duration: ${result.duration}ms`);
  logger.info('━'.repeat(50));
  
  // Print generated files
  if (result.files.length > 0) {
    logger.info('');
    logger.info('Generated files:');
    for (const file of result.files) {
      const vars = file.variables.length > 0 ? ` (vars: ${file.variables.slice(0, 3).join(', ')}${file.variables.length > 3 ? '...' : ''})` : '';
      logger.info(`   → ${file.output}${vars}`);
    }
  }
  
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
