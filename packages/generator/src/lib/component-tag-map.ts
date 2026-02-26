/**
 * Component-to-tag validation for UI8Kit components.
 * Used by HtmlConverterService, Maintain checker, and ui8kit-validate.
 *
 * @module @ui8kit/generator/lib
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ComponentTagConfig {
  allowedTags: string[];
  defaultTag: string;
  dataClass: string;
  notes?: Record<string, string>;
  status?: 'planned';
}

export interface ComponentTagMap {
  version: string;
  components: Record<string, ComponentTagConfig>;
  exclusions: {
    layoutForbidden: string[];
    blockForbiddenInLayout: string[];
    textForbiddenInLayout: string[];
  };
}

let cachedMap: ComponentTagMap | null = null;

/**
 * Load component-tag map from JSON (built-in or custom path).
 */
export function loadComponentTagMap(customPath?: string): ComponentTagMap {
  if (cachedMap && !customPath) return cachedMap;

  const paths = customPath
    ? [customPath]
    : [
        join(__dirname, 'component-tag-map.json'),
        join(process.cwd(), 'src', 'lib', 'component-tag-map.json'),
      ];

  for (const mapPath of paths) {
    try {
      const json = readFileSync(mapPath, 'utf-8');
      cachedMap = JSON.parse(json) as ComponentTagMap;
      return cachedMap;
    } catch {
      continue;
    }
  }

  throw new Error(
    `component-tag-map.json not found. Tried: ${paths.join(', ')}`
  );
}

/**
 * Check if tag is allowed for component.
 */
export function isTagAllowedForComponent(
  component: string,
  tag: string,
  map?: ComponentTagMap
): boolean {
  const m = map ?? loadComponentTagMap();
  const config = m.components[component];
  if (!config) return false;

  const normalizedTag = tag.toLowerCase();
  return config.allowedTags.some((t) => t.toLowerCase() === normalizedTag);
}

/**
 * Get component name by data-class attribute.
 */
export function getComponentByDataClass(
  dataClass: string,
  map?: ComponentTagMap
): string | null {
  const m = map ?? loadComponentTagMap();
  for (const [name, config] of Object.entries(m.components)) {
    if (config.dataClass === dataClass) return name;
  }
  return null;
}

/**
 * Get allowed tags for component.
 */
export function getAllowedTags(
  component: string,
  map?: ComponentTagMap
): string[] {
  const m = map ?? loadComponentTagMap();
  const config = m.components[component];
  return config?.allowedTags ?? [];
}

/**
 * Validate component + tag pair. Returns error message or null if valid.
 */
export function validateComponentTag(
  component: string,
  tag: string,
  map?: ComponentTagMap
): string | null {
  const m = map ?? loadComponentTagMap();
  const config = m.components[component];
  if (!config) return `Unknown component: ${component}`;

  const normalizedTag = tag.toLowerCase();
  const allowed = config.allowedTags.map((t) => t.toLowerCase());
  if (allowed.includes(normalizedTag)) return null;

  const note = config.notes?.[normalizedTag];
  if (note) {
    return `${component}: ${tag} — ${note}`;
  }

  return `${component} does not allow tag "${tag}". Allowed: ${allowed.join(', ')}`;
}
