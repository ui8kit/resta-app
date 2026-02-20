/**
 * Build project — template generation from app config.
 * Lives in generator: app build/generation is the generator's responsibility.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Logger } from './core';
import { TemplateService } from './services/template';
import {
  generateRegistry,
  type RegistryConfig,
  type RegistrySourceDir,
} from './scripts';
import { getCoreComponentNames, getFallbackCoreComponents } from './core/scanner/core-component-scanner';
import type { AppConfig, BuildResult } from '@ui8kit/sdk';
import type { PlatformMap } from './plugins/template';

type PlatformAppConfig = AppConfig & {
  platform?: string;
  platformMapPath?: string;
  platformDomain?: string;
};

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

export async function buildProject(rawConfig: AppConfig, cwd = process.cwd()): Promise<BuildResult> {
  const config = rawConfig as PlatformAppConfig;
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

  let platformMap: PlatformMap | undefined;
  if (config.platformMapPath) {
    const platformMapRaw = await readFile(resolve(cwd, config.platformMapPath), 'utf-8');
    platformMap = JSON.parse(platformMapRaw) as PlatformMap;
  }

  // Get @ui8kit/core component names to preserve as JSX elements (not converted to includes).
  // Prefer dynamic import; fall back to static list when core exports no functions at build time.
  const dynamicComponents = await getCoreComponentNames();
  const passthroughComponents = dynamicComponents.length > 0 ? dynamicComponents : getFallbackCoreComponents();

  const result = await service.execute({
    registryPath,
    outputDir: outDir,
    engine: config.target,
    verbose: true,
    pluginConfig: {
      platformMap,
      platformDomain: config.platformDomain ?? 'catalog',
      platform: config.platform,
    },
    passthroughComponents,
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
