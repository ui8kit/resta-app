/**
 * Registry Generator Script
 *
 * Scans source directories and generates a BuildY/shadcn-compatible
 * registry.json with metadata for all blocks, layouts, partials, routes.
 *
 * Usage:
 *   import { generateRegistry } from './generate-registry';
 *   await generateRegistry(config);
 *
 * JSDoc annotations (optional):
 *   @ui8kit block|layout|partial|route   — explicit type override
 *   @category marketing                   — category tag
 *   @tags hero, landing, cta              — comma-separated tags
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, extname, basename, dirname, resolve } from 'node:path';
import { parse } from '@babel/parser';
import type { File } from '@babel/types';

// =============================================================================
// Types
// =============================================================================

/** Registry item type (BuildY/shadcn compatible) */
export type RegistryItemType =
  | 'registry:lib'
  | 'registry:block'
  | 'registry:component'
  | 'registry:ui'
  | 'registry:composite'
  | 'registry:layout'
  | 'registry:partial'
  | 'registry:route'
  | 'registry:variants';

/** Single registry item */
export interface RegistryItem {
  name: string;
  type: RegistryItemType;
  description: string;
  category?: string;
  tags?: string[];
  /** Domain folder when file is under blocks/{domain}/ (e.g. "examples", "website") */
  domain?: string;
  dependencies: string[];
  devDependencies: string[];
  files: Array<{
    /** Path relative to dist (e.g. "blocks/DashSidebar.tsx") — where to unpack the generated file */
    path: string;
    target: string;
  }>;
  props?: string[];
  /** Absolute path to source .tsx file; used by template generator in registry→dist pipeline */
  sourcePath?: string;
}

/** Full registry output */
export interface Registry {
  $schema: string;
  items: RegistryItem[];
  version: string;
  lastUpdated: string;
  registry: string;
}

/** Source directory configuration */
export interface RegistrySourceDir {
  /** Path to source directory */
  path: string;
  /** Default registry type for files in this directory */
  type: RegistryItemType;
  /** Target directory name for the "target" field */
  target: string;
  /** Override include patterns for this dir (default: config.include) */
  include?: string[];
  /** Override exclude patterns for this dir (default: config.exclude) */
  exclude?: string[];
  /** Path template for output; {{name}} = component name. When set, overrides relPath. */
  pathTemplate?: string;
}

/** Registry generation configuration */
export interface RegistryConfig {
  /** Source directories to scan */
  sourceDirs: RegistrySourceDir[];
  /** Output path for registry.json */
  outputPath: string;
  /** Schema URL */
  schema?: string;
  /** Registry name */
  registryName?: string;
  /** Version string */
  version?: string;
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /**
   * Package names to exclude from each item's dependencies.
   * Used for DSL/build-only deps (e.g. @ui8kit/dsl) that are not needed
   * in consuming apps. If absent or empty, dependencies are left as-is.
   */
  excludeDependencies?: string[];

  /** When false, do not write registry.json (return in-memory only). Default: true */
  write?: boolean;
}

// =============================================================================
// JSDoc Parser
// =============================================================================

interface JsDocMeta {
  description: string;
  type?: string;
  category?: string;
  tags?: string[];
}

/**
 * Extract JSDoc metadata from source code.
 * Looks for @ui8kit, @category, @tags annotations.
 */
function parseJsDoc(source: string): JsDocMeta {
  const result: JsDocMeta = { description: '' };

  // Find the first JSDoc comment before an export
  const jsDocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:export)/;
  const match = source.match(jsDocRegex);

  if (!match) return result;

  const comment = match[1];
  const lines = comment
    .split('\n')
    .map(l => l.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean);

  const descLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('@ui8kit')) {
      result.type = line.replace('@ui8kit', '').trim();
    } else if (line.startsWith('@category')) {
      result.category = line.replace('@category', '').trim();
    } else if (line.startsWith('@tags')) {
      result.tags = line
        .replace('@tags', '')
        .trim()
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    } else if (!line.startsWith('@')) {
      descLines.push(line);
    }
  }

  result.description = descLines.join(' ').trim();

  return result;
}

// =============================================================================
// Component Analyzer
// =============================================================================

interface ComponentInfo {
  name: string;
  props: string[];
  dependencies: string[];
  description: string;
  category?: string;
  tags?: string[];
  typeOverride?: string;
}

/**
 * Analyze a single .tsx file and extract component metadata.
 */
function analyzeComponent(source: string, filePath: string): ComponentInfo | null {
  const fileName = basename(filePath, extname(filePath));

  // Parse JSDoc
  const jsdoc = parseJsDoc(source);

  // Find component name from export
  const exportMatch = source.match(
    /export\s+(?:default\s+)?function\s+(\w+)/
  );
  const name = exportMatch?.[1] || fileName;

  // Extract Props interface fields
  const props = extractProps(source, name);

  // Extract import dependencies (package-level only)
  const dependencies = extractDependencies(source);

  return {
    name,
    props,
    dependencies,
    description: jsdoc.description,
    category: jsdoc.category,
    tags: jsdoc.tags,
    typeOverride: jsdoc.type,
  };
}

/**
 * Extract prop names from a Props interface/type.
 * Looks for: export interface FooProps { ... }
 *        or: export type FooProps = { ... }
 */
function extractProps(source: string, componentName: string): string[] {
  const propsName = `${componentName}Props`;
  const regex = new RegExp(
    `(?:interface|type)\\s+${propsName}[^{]*\\{([^}]*)\\}`,
    's'
  );
  const match = source.match(regex);
  if (!match) return [];

  const body = match[1];
  const props: string[] = [];

  // Match prop names: "  title?: string;" or "  children: ReactNode;"
  const propRegex = /['"]?(\w+)['"]?\s*[?:]?\s*:/g;
  let propMatch: RegExpExecArray | null;

  while ((propMatch = propRegex.exec(body)) !== null) {
    const propName = propMatch[1];
    // Skip common React internals
    if (propName !== 'children' && propName !== 'className' && propName !== 'style') {
      props.push(propName);
    }
  }

  return props;
}

/**
 * Extract package dependencies from import statements.
 * Only includes external packages (not relative imports).
 */
function extractDependencies(source: string): string[] {
  const deps = new Set<string>();

  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(source)) !== null) {
    const specifier = match[1];
    // Skip relative imports
    if (specifier.startsWith('.') || specifier.startsWith('/')) continue;

    // Get package name (handle scoped packages)
    if (specifier.startsWith('@')) {
      const parts = specifier.split('/');
      deps.add(`${parts[0]}/${parts[1]}`);
    } else {
      deps.add(specifier.split('/')[0]);
    }
  }

  return Array.from(deps).sort();
}

// =============================================================================
// File Scanner
// =============================================================================

/**
 * Recursively find .tsx files in a directory.
 */
async function findFiles(
  dir: string,
  include: string[],
  exclude: string[]
): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return; // Directory doesn't exist, skip
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const rel = relative(dir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!matchesAny(rel, exclude)) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (matchesAny(rel, include) && !matchesAny(rel, exclude)) {
          results.push(fullPath);
        }
      }
    }
  }

  await walk(dir);
  return results;
}

function matchesAny(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    const regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*\//g, '(?:.*/)?')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    if (new RegExp(`^${regexStr}$`).test(path)) return true;
  }
  return false;
}

// =============================================================================
// Domain extraction
// =============================================================================

/**
 * Extract domain from file path when under blocks/{domain}/.
 * Returns undefined for files in blocks/ root or outside engine domain structure.
 * Uses lastIndexOf to handle apps/engine/src/blocks/website/ (domain=website) vs apps/engine/src/blocks/ (no domain).
 */
function extractDomainFromPath(filePath: string): string | undefined {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const blocksIdx = parts.lastIndexOf('blocks');
  if (blocksIdx === -1 || blocksIdx + 1 >= parts.length) return undefined;

  const next = parts[blocksIdx + 1];
  // Next segment is a folder (domain) if it does not look like a file
  if (next.endsWith('.tsx') || next.endsWith('.ts')) return undefined;
  // "src" as next segment after blocks is a path segment, not a domain
  if (next === 'src') return undefined;
  return next;
}

// =============================================================================
// Registry type resolver
// =============================================================================

/**
 * Resolve the registry type for a component.
 * Priority: JSDoc @ui8kit override → directory-based default.
 */
function resolveType(
  typeOverride: string | undefined,
  defaultType: RegistryItemType
): RegistryItemType {
  if (!typeOverride) return defaultType;

  const typeMap: Record<string, RegistryItemType> = {
    block: 'registry:block',
    layout: 'registry:layout',
    partial: 'registry:partial',
    route: 'registry:route',
    component: 'registry:component',
    ui: 'registry:ui',
    composite: 'registry:composite',
    lib: 'registry:lib',
    variants: 'registry:variants',
  };

  return typeMap[typeOverride.toLowerCase()] || defaultType;
}

// =============================================================================
// Main Generator
// =============================================================================

/**
 * Generate a BuildY/shadcn-compatible registry.json from source directories.
 */
export async function generateRegistry(config: RegistryConfig): Promise<Registry> {
  const include = config.include || ['**/*.tsx'];
  const exclude = config.exclude || [
    '**/*.test.tsx',
    '**/*.test.ts',
    '**/*.meta.ts',
    '**/index.ts',
  ];

  const items: RegistryItem[] = [];

  for (const sourceDir of config.sourceDirs) {
    const resolvedDir = resolve(sourceDir.path);
    const dirInclude = sourceDir.include ?? include;
    const dirExclude = sourceDir.exclude ?? exclude;
    const files = await findFiles(resolvedDir, dirInclude, dirExclude);

    for (const filePath of files) {
      const source = await readFile(filePath, 'utf-8');
      const info = analyzeComponent(source, filePath);

      if (!info) continue;

      const relPath = sourceDir.pathTemplate
        ? sourceDir.pathTemplate.replace(/\{\{name\}\}/g, info.name)
        : relative(resolve(sourceDir.path, '..'), filePath).replace(/\\/g, '/');

      const deps =
        config.excludeDependencies && config.excludeDependencies.length > 0
          ? info.dependencies.filter(
              (dep) => !config.excludeDependencies!.includes(dep)
            )
          : info.dependencies;

      const filePathResolved = resolve(filePath);
      const domain = extractDomainFromPath(filePathResolved);

      const item: RegistryItem = {
        name: info.name,
        type: resolveType(info.typeOverride, sourceDir.type),
        description: info.description,
        dependencies: deps,
        devDependencies: [],
        files: [
          {
            path: relPath,
            target: sourceDir.target,
          },
        ],
        sourcePath: filePathResolved,
      };

      // Only add optional fields if present
      if (info.category) item.category = info.category;
      if (info.tags && info.tags.length > 0) item.tags = info.tags;
      if (info.props.length > 0) item.props = info.props;
      if (domain) item.domain = domain;

      items.push(item);
    }
  }

  // Sort items by type then name
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
  });

  const registry: Registry = {
    $schema: config.schema || 'https://buildy.tw/schema/registry.json',
    items,
    version: config.version || '1.0.0',
    lastUpdated: new Date().toISOString(),
    registry: config.registryName || 'ui8kit',
  };

  // Write output (unless write: false)
  if (config.write !== false) {
    const outDir = dirname(config.outputPath);
    await mkdir(outDir, { recursive: true });
    await writeFile(config.outputPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
  }

  return registry;
}
