/**
 * Build project — template generation from app config.
 * Lives in generator: app build/generation is the generator's responsibility.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Logger } from './core';
import { TemplateService } from './services/template';
import {
  generateRegistry,
  type RegistryConfig,
  type RegistrySourceDir,
} from './scripts';
import type { AppConfig, BuildResult } from '@ui8kit/sdk';

function getRegistrySources(config: AppConfig, cwd: string): RegistrySourceDir[] {
  const entries: RegistrySourceDir[] = [];

  if (config.blocksDir) {
    entries.push({
      path: resolve(cwd, config.blocksDir),
      type: 'registry:block',
      target: 'blocks',
    });
  }
  if (config.layoutsDir) {
    entries.push({
      path: resolve(cwd, config.layoutsDir),
      type: 'registry:layout',
      target: 'layouts',
    });
  }
  if (config.partialsDir) {
    entries.push({
      path: resolve(cwd, config.partialsDir),
      type: 'registry:partial',
      target: 'partials',
    });
  }

  return entries;
}

export async function buildProject(config: AppConfig, cwd = process.cwd()): Promise<BuildResult> {
  const outDir = resolve(cwd, config.outDir ?? `dist/${config.target}`);
  const registryPath = resolve(outDir, '_temp', 'registry.json');
  const sources = getRegistrySources(config, cwd);

  if (sources.length === 0) {
    return {
      ok: false,
      generated: 0,
      outputDir: outDir,
      engine: config.target,
      errors: ['No source directories configured for template generation'],
      warnings: [],
    };
  }

  const logger = new Logger({ level: 'info' });
  const service = new TemplateService();

  await service.initialize({
    config: {},
    logger: logger as never,
    eventBus: {
      emit: () => {},
      on: () => () => {},
      once: () => () => {},
      off: () => {},
      removeAllListeners: () => {},
      listenerCount: () => 0,
    },
    registry: null as never,
  });

  const registryConfig: RegistryConfig = {
    sourceDirs: sources,
    outputPath: registryPath,
    registryName: config.brand,
    version: '0.1.0',
    excludeDependencies: ['@ui8kit/dsl'],
    write: false,
  };

  const registry = await generateRegistry(registryConfig);
  await mkdir(resolve(outDir, '_temp'), { recursive: true });
  await writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');

  const result = await service.execute({
    registryPath,
    outputDir: outDir,
    engine: config.target,
    verbose: false,
    passthroughComponents: [],
    excludeDependencies: ['@ui8kit/dsl'],
  });

  await service.dispose();

  return {
    ok: result.errors.length === 0,
    generated: result.files.length,
    outputDir: outDir,
    engine: config.target,
    errors: result.errors,
    warnings: result.warnings,
  };
}
