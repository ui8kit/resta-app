import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

export interface BlueprintEntity {
  name: string;
  singular: string;
  fixture: string;
  fixtureType?: string;
  itemsKey: string;
  slugField: string;
  types: string;
  routes: string[];
  views: string[];
  routeFiles: string[];
}

export interface BlueprintLayout {
  name: string;
  file: string;
  view?: string;
}

export interface BlueprintPartial {
  name: string;
  file: string;
}

export interface BlueprintDocument {
  $schema: string;
  version: '1';
  app: {
    name: string;
    domain: string;
    lang: string;
  };
  brand: {
    primary: string;
    accent: string;
    font: string;
  };
  entities: BlueprintEntity[];
  layouts: BlueprintLayout[];
  partials: BlueprintPartial[];
  components: {
    index: string;
    count: number;
  };
  navigation: {
    source: string;
    type: string;
  };
  context: {
    file: string;
    adapter: string;
  };
  domains: string[];
}

export interface BlueprintValidationIssue {
  level: 'error' | 'warn';
  code: string;
  message: string;
  file?: string;
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

export function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function relPath(fromDir: string, absPath: string): string {
  return toPosixPath(relative(fromDir, absPath));
}

export function getUi8kitConfigPath(cwd: string): string {
  return resolve(cwd, 'ui8kit.config.json');
}

export interface Ui8kitConfigLike {
  brand?: string;
  app?: { name?: string; lang?: string; domain?: string };
  fixtures?: string;
  componentsDir?: string;
  blocksDir?: string;
  layoutsDir?: string;
  partialsDir?: string;
}

export function loadUi8kitConfig(cwd: string): Ui8kitConfigLike {
  const configPath = getUi8kitConfigPath(cwd);
  if (!existsSync(configPath)) {
    throw new Error(`ui8kit.config.json not found at ${configPath}`);
  }
  return readJson<Ui8kitConfigLike>(configPath);
}

export function listFilesRecursive(dir: string, filterExt?: string[]): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (!filterExt || filterExt.includes(extname(entry.name))) {
        out.push(fullPath);
      }
    }
  }
  return out;
}

export function pascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join('');
}
