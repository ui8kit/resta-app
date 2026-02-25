#!/usr/bin/env bun
import { Command } from 'commander';
import { resolve, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import chalk from 'chalk';
import { loadAppConfig } from '@ui8kit/sdk/config';
import type { AppConfig } from '@ui8kit/sdk';
import { generate, type GenerateConfig } from '../generate';
import { buildProject } from '../build-project';
import { loadFixtureRoutes } from '../utils/load-fixture-routes';
import type { RouteConfig } from '../core/interfaces';
import type { GenerateStageName } from '../pipelines/generate-site';
import { scanBlueprint } from '../scripts/scan-blueprint';
import { validateBlueprint } from '../scripts/validate-blueprint';
import { buildDependencyGraph } from '../scripts/build-dependency-graph';
import { scaffoldEntity } from '../scripts/scaffold-entity';

interface DistConfig {
  app: { name: string; lang?: string };
  render?: {
    appEntry?: string;
    skipRoutes?: string[];
  };
  css: {
    routes?: string[];
    outputDir: string;
    pureCss?: boolean;
    outputFiles?: Record<string, string>;
  };
  html: {
    routes: Record<string, { title: string; seo?: Record<string, unknown>; data?: Record<string, unknown> }>;
    outputDir: string;
    mode?: 'tailwind' | 'semantic' | 'inline';
    cssHref?: string;
    stripDataClassInTailwind?: boolean;
  };
  postcss?: {
    enabled?: boolean;
    entryImports?: string[];
    sourceDir?: string;
    outputDir?: string;
    outputFileName?: string;
    uncss?: {
      enabled?: boolean;
      outputFileName?: string;
      timeout?: number;
    };
  };
  mappings?: {
    ui8kitMap?: string;
    shadcnMap?: string;
  };
  fixtures?: {
    dir: string;
    collections?: string[];
  };
  uncss?: Record<string, unknown>;
}

function loadDistConfig(configPath: string): DistConfig {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as DistConfig;
}

function mergeFixtureRoutes(
  config: DistConfig,
  cwd: string
): Record<string, RouteConfig> {
  const routes: Record<string, RouteConfig> = { ...config.html.routes };

  if (config.fixtures?.dir) {
    const fixturesDir = resolve(cwd, config.fixtures.dir);
    const collections = config.fixtures.collections;

    const fixtureRoutes = loadFixtureRoutes({
      fixturesDir,
      collections: collections?.map((name) => ({
        name,
        routePrefix: `/${name}`,
        idField: 'id',
        slugField: 'slug',
        titleField: 'title',
        itemsKey: name === 'blog' ? 'posts' : 'items',
      })),
    });

    Object.assign(routes, fixtureRoutes);
  }

  return routes;
}

function buildGenerateConfig(
  distConfig: DistConfig,
  allRoutes: Record<string, RouteConfig>,
  cwd: string
): GenerateConfig {
  const config: GenerateConfig = {
    app: distConfig.app,
    css: {
      routes: distConfig.css.routes ?? Object.keys(allRoutes),
      outputDir: resolve(cwd, distConfig.css.outputDir),
      pureCss: distConfig.css.pureCss,
      outputFiles: distConfig.css.outputFiles as GenerateConfig['css']['outputFiles'],
    },
    html: {
      routes: allRoutes,
      outputDir: resolve(cwd, distConfig.html.outputDir),
      mode: distConfig.html.mode,
      cssHref: distConfig.html.cssHref,
      stripDataClassInTailwind: distConfig.html.stripDataClassInTailwind,
    },
    render: {
      appEntry: resolve(cwd, distConfig.render?.appEntry ?? 'src/App.tsx'),
      skipRoutes: distConfig.render?.skipRoutes,
    },
  };

  if (distConfig.mappings) {
    config.mappings = {
      ui8kitMap: distConfig.mappings.ui8kitMap
        ? resolve(cwd, distConfig.mappings.ui8kitMap)
        : undefined,
      shadcnMap: distConfig.mappings.shadcnMap
        ? resolve(cwd, distConfig.mappings.shadcnMap)
        : undefined,
    };
  }

  if (distConfig.postcss) {
    config.postcss = {
      ...distConfig.postcss,
      outputDir: distConfig.postcss.outputDir
        ? resolve(cwd, distConfig.postcss.outputDir)
        : undefined,
    };
  }

  if (distConfig.fixtures) {
    config.fixtures = {
      dir: resolve(cwd, distConfig.fixtures.dir),
      collections: distConfig.fixtures.collections,
    };
  }

  return config;
}

function routeToHtmlFileName(routePath: string): string {
  if (routePath === '/') return 'index.html';
  return `${routePath.slice(1)}/index.html`;
}

const program = new Command();

program
  .name('ui8kit-generate')
  .description('Static site generator for UI8Kit')
  .version('0.2.0');

program
  .command('react')
  .description('Build DSL source to React: blocks, layouts, partials, registry')
  .option('--cwd <dir>', 'Working directory', '.')
  .option('--out-dir <dir>', 'Output directory override')
  .action(async (opts) => {
    await runReactBuild(opts);
  });

program
  .command('static', { isDefault: true })
  .description('Full pipeline: Render -> CSS -> HTML -> PostCSS')
  .option('--cwd <dir>', 'Working directory', '.')
  .option('--config <path>', 'Config file path', 'dist.config.json')
  .option('--fixtures <dir>', 'Fixtures directory override')
  .action(async (opts) => {
    await runPipeline(opts, 'static');
  });

program
  .command('html')
  .description('Render + HTML stages')
  .option('--cwd <dir>', 'Working directory', '.')
  .option('--config <path>', 'Config file path', 'dist.config.json')
  .option('--fixtures <dir>', 'Fixtures directory override')
  .action(async (opts) => {
    await runPipeline(opts, 'html');
  });

program
  .command('render')
  .description('Render React routes to raw HTML only')
  .option('--cwd <dir>', 'Working directory', '.')
  .option('--config <path>', 'Config file path', 'dist.config.json')
  .option('--fixtures <dir>', 'Fixtures directory override')
  .action(async (opts) => {
    await runPipeline(opts, 'render');
  });

program
  .command('styles')
  .description('Styles pipeline: CSS extraction + PostCSS')
  .option('--cwd <dir>', 'Working directory', '.')
  .option('--config <path>', 'Config file path', 'dist.config.json')
  .action(async (opts) => {
    await runPipeline(opts, 'styles');
  });

program
  .command('blueprint:scan')
  .description('Scan DSL app and generate blueprint.json')
  .option('--cwd <dir>', 'Working directory', '.')
  .option('--output <path>', 'Blueprint output path (default: blueprint.json)')
  .action(async (opts) => {
    const cwd = resolve(opts.cwd);
    try {
      const result = scanBlueprint({
        cwd,
        outputFile: opts.output,
      });
      console.log(chalk.green(`\n  Blueprint generated: ${result.blueprintPath}\n`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n  Error: ${message}\n`));
      process.exit(1);
    }
  });

program
  .command('blueprint:validate')
  .description('Validate project structure against blueprint.json')
  .option('--cwd <dir>', 'Working directory', '.')
  .option('--blueprint <path>', 'Blueprint file path (default: blueprint.json)')
  .option('--report-dir <path>', 'Report directory (default: .cursor/reports)')
  .action(async (opts) => {
    const cwd = resolve(opts.cwd);
    try {
      const result = validateBlueprint({
        cwd,
        blueprintFile: opts.blueprint,
        reportDir: opts.reportDir,
      });
      if (!result.ok) {
        console.error(chalk.red('\n  Blueprint validation failed.\n'));
        process.exit(1);
      }
      console.log(chalk.green('\n  Blueprint validation passed.\n'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n  Error: ${message}\n`));
      process.exit(1);
    }
  });

program
  .command('blueprint:graph')
  .description('Build dependency graph from blueprint.json')
  .option('--cwd <dir>', 'Working directory', '.')
  .option('--blueprint <path>', 'Blueprint file path (default: blueprint.json)')
  .option('--output <path>', 'Graph output path (default: dependency-graph.json)')
  .action(async (opts) => {
    const cwd = resolve(opts.cwd);
    try {
      const result = buildDependencyGraph({
        cwd,
        blueprintFile: opts.blueprint,
        outputFile: opts.output,
      });
      console.log(chalk.green(`\n  Dependency graph generated: ${result.graphPath}\n`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n  Error: ${message}\n`));
      process.exit(1);
    }
  });

const scaffoldCommand = program
  .command('scaffold')
  .description('Scaffold helpers for DSL applications');

scaffoldCommand
  .command('entity')
  .description('Scaffold a new entity with routes, views, and fixture wiring')
  .requiredOption('--name <name>', 'Entity name (kebab-case), e.g. contacts')
  .requiredOption('--singular <name>', 'Singular entity name, e.g. Contact')
  .requiredOption(
    '--fields <fields>',
    'Comma-separated field definitions, e.g. "name:string,email:string,status:active|archived"'
  )
  .option('--routes <routes>', 'List and detail routes, e.g. "/contacts,/contacts/:slug"')
  .option('--layout <layout>', 'Layout component to use (default: MainLayout)', 'MainLayout')
  .option('--cwd <dir>', 'Working directory', '.')
  .action(async (opts) => {
    const cwd = resolve(opts.cwd);
    try {
      const result = scaffoldEntity({
        cwd,
        name: opts.name,
        singular: opts.singular,
        fields: opts.fields,
        routes: opts.routes,
        layout: opts.layout,
      });
      console.log(chalk.green('\n  Entity scaffold completed.'));
      console.log(`  Created files: ${result.createdFiles.length}`);
      for (const file of result.createdFiles) {
        console.log(`    + ${file}`);
      }
      console.log(`  Updated files: ${result.updatedFiles.length}`);
      for (const file of result.updatedFiles) {
        console.log(`    ~ ${file}`);
      }
      console.log(`  Blueprint refreshed: ${result.blueprintPath}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n  Error: ${message}\n`));
      process.exit(1);
    }
  });

const MODE_STAGES: Record<'static' | 'html' | 'styles' | 'render', readonly GenerateStageName[]> = {
  static: ['render', 'css', 'html', 'postcss'],
  html: ['render', 'html'],
  styles: ['css', 'postcss'],
  render: ['render'],
};

async function runReactBuild(opts: { cwd: string; outDir?: string }): Promise<void> {
  const cwd = resolve(opts.cwd);

  console.log(`\n  ${chalk.bold('UI8Kit Generator')} — react\n`);
  console.log(`  ${chalk.gray('CWD:')} ${cwd}\n`);

  try {
    const baseConfig = await loadAppConfig(cwd);
    const runtimeConfig: AppConfig = {
      ...baseConfig,
      ...(opts.outDir ? { outDir: opts.outDir } : {}),
      target: 'react',
    };

    const result = await buildProject(runtimeConfig, cwd);
    if (!result.ok) {
      console.error(chalk.red('\n  Generation failed:'));
      for (const error of result.errors) {
        console.error(`    - ${error}`);
      }
      process.exit(1);
    }

    console.log(chalk.green(`\n  Generation completed.`));
    console.log(`  Engine: ${result.engine}`);
    console.log(`  Output: ${result.outputDir}`);
    console.log(`  Files: ${result.generated}`);

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n  Warnings:'));
      for (const warning of result.warnings) {
        console.log(`    - ${warning}`);
      }
    }

    console.log();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`\n  Error: ${msg}\n`));
    process.exit(1);
  }
}

async function runPipeline(
  opts: { cwd: string; config: string; fixtures?: string },
  mode: 'static' | 'html' | 'styles' | 'render'
): Promise<void> {
  const cwd = resolve(opts.cwd);
  const configPath = resolve(cwd, opts.config);

  console.log(`\n  ${chalk.bold('UI8Kit Static Generator')} — ${mode}\n`);
  console.log(`  ${chalk.gray('Config:')} ${configPath}`);
  console.log(`  ${chalk.gray('CWD:')} ${cwd}\n`);

  try {
    const distConfig = loadDistConfig(configPath);
    const stages = MODE_STAGES[mode];

    if (opts.fixtures) {
      distConfig.fixtures = { dir: opts.fixtures, collections: distConfig.fixtures?.collections };
    }

    const allRoutes = mergeFixtureRoutes(distConfig, cwd);
    const routeCount = Object.keys(allRoutes).length;
    const baseCount = Object.keys(distConfig.html.routes).length;
    const fixtureCount = routeCount - baseCount;

    console.log(`  Routes: ${routeCount} total${fixtureCount > 0 ? ` (${fixtureCount} from fixtures)` : ''}`);

    const config = buildGenerateConfig(distConfig, allRoutes, cwd);

    if (!stages.includes('render') && (stages.includes('css') || stages.includes('html'))) {
      const htmlInputDir = config.html.outputDir;
      const missingInput = Object.keys(allRoutes).every((routePath) => {
        const htmlPath = join(htmlInputDir, routeToHtmlFileName(routePath));
        return !existsSync(htmlPath);
      });

      if (missingInput) {
        throw new Error(
          `No prepared HTML input found in "${htmlInputDir}". ` +
          'HTML/static commands without render stage do not render React components. ' +
          'Run SPA flow (`bun run generate` + `bun run finalize`) or provide ready HTML fragments first.'
        );
      }
    }

    const result = await generate(config, stages);

    if (!result.success) {
      console.error(chalk.red('\n  Generation failed:'));
      for (const { stage, error } of result.errors) {
        console.error(`    [${stage}] ${error.message}`);
      }
      process.exit(1);
    }

    console.log(chalk.green(`\n  Done in ${Math.round(result.duration)}ms`));
    const g = result.generated;
    if (stages.includes('css') && g.cssFiles > 0) console.log(`  CSS files: ${g.cssFiles}`);
    if (stages.includes('html') && g.htmlPages > 0) console.log(`  HTML pages: ${g.htmlPages}`);
    if (stages.includes('postcss') && g.postcssFiles > 0) console.log(`  PostCSS: styles.css generated`);
    console.log();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`\n  Error: ${msg}\n`));
    process.exit(1);
  }
}

program.parse();
