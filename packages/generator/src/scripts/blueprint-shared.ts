import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

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

export interface BlueprintValidationReport {
  generatedAt: string;
  blueprintPath: string;
  errors: BlueprintValidationIssue[];
  warnings: BlueprintValidationIssue[];
}

export interface DependencyGraphNode {
  id: string;
  type: 'fixture' | 'adapter' | 'context' | 'route' | 'view' | 'component' | 'type' | 'navigation' | 'partial';
  label: string;
  file?: string;
  entity?: string;
}

export interface DependencyGraphEdge {
  from: string;
  to: string;
  relation:
    | 'uses-adapter'
    | 'loads-context'
    | 'registers-route'
    | 'renders-view'
    | 'imports-component'
    | 'uses-type'
    | 'drives-partial';
  entity?: string;
}

export interface DependencyGraphDocument {
  generatedAt: string;
  blueprintPath: string;
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
  mermaid: string;
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

export function readJsonIfExists<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  return readJson<T>(path);
}

export function readText(path: string): string {
  return readFileSync(path, 'utf-8');
}

export function readTextIfExists(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  return readText(path);
}

export function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function relPath(fromDir: string, absPath: string): string {
  return toPosixPath(relative(fromDir, absPath));
}

export function ensureDirectoryForFile(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

export function writeJsonFile(path: string, data: unknown): void {
  ensureDirectoryForFile(path);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function writeTextFile(path: string, content: string): void {
  ensureDirectoryForFile(path);
  writeFileSync(path, content, 'utf-8');
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

export function kebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function singularize(value: string): string {
  if (value.endsWith('ies') && value.length > 3) return `${value.slice(0, -3)}y`;
  if (value.endsWith('ses') && value.length > 3) return value.slice(0, -2);
  if (value.endsWith('s') && value.length > 1) return value.slice(0, -1);
  return value;
}

export function extractQuotedStrings(raw: string): string[] {
  const out: string[] = [];
  const regex = /['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    out.push(match[1]!);
  }
  return out;
}

export function parseNamedImports(source: string): Map<string, string> {
  const named = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  const defaultImport = /import\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g;
  const map = new Map<string, string>();

  let match: RegExpExecArray | null;
  while ((match = named.exec(source)) !== null) {
    const bindings = match[1]!;
    const specifier = match[2]!;
    for (const rawPart of bindings.split(',')) {
      const part = rawPart.trim();
      if (!part || part.startsWith('type ')) continue;
      const [left, right] = part.split(/\s+as\s+/);
      const local = (right ?? left).replace(/^type\s+/, '').trim();
      if (local) map.set(local, specifier);
    }
  }

  while ((match = defaultImport.exec(source)) !== null) {
    const local = match[1]!;
    const specifier = match[2]!;
    if (local) map.set(local, specifier);
  }

  return map;
}

export function parseExportedTypeNames(source: string): string[] {
  const names = new Set<string>();
  const typeExport = /export\s+type\s+([A-Za-z0-9_]+)/g;
  const interfaceExport = /export\s+interface\s+([A-Za-z0-9_]+)/g;
  let match: RegExpExecArray | null;

  while ((match = typeExport.exec(source)) !== null) {
    names.add(match[1]!);
  }
  while ((match = interfaceExport.exec(source)) !== null) {
    names.add(match[1]!);
  }
  return Array.from(names);
}

export interface AppRouteRecord {
  path: string;
  component: string;
}

export function parseAppRoutes(source: string): AppRouteRecord[] {
  const records: AppRouteRecord[] = [];
  const regex = /<Route\s+path="([^"]+)"\s+element=\{<([A-Za-z0-9_]+)\s*\/>\}\s*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    records.push({
      path: match[1]!,
      component: match[2]!,
    });
  }
  return records;
}

export function getBlueprintPath(cwd: string, override?: string): string {
  return resolve(cwd, override ?? 'blueprint.json');
}

export function loadBlueprint(cwd: string, override?: string): { path: string; blueprint: BlueprintDocument } {
  const path = getBlueprintPath(cwd, override);
  if (!existsSync(path)) {
    throw new Error(`Blueprint file not found: ${path}`);
  }
  return {
    path,
    blueprint: readJson<BlueprintDocument>(path),
  };
}
