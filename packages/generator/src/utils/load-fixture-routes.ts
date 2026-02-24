import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import type { RouteConfig } from '../core/interfaces';

export interface FixtureCollection {
  name: string;
  routePrefix: string;
  idField?: string;
  slugField?: string;
  titleField?: string;
  /** Key in the JSON root that contains the array of items (defaults to 'items', falls back to 'posts') */
  itemsKey?: string;
}

export interface LoadFixtureRoutesOptions {
  fixturesDir: string;
  collections?: FixtureCollection[];
}

const DEFAULT_COLLECTIONS: FixtureCollection[] = [
  { name: 'menu', routePrefix: '/menu', idField: 'id', slugField: 'slug', titleField: 'title' },
  { name: 'recipes', routePrefix: '/recipes', idField: 'id', slugField: 'slug', titleField: 'title' },
  { name: 'blog', routePrefix: '/blog', itemsKey: 'posts', idField: 'id', slugField: 'slug', titleField: 'title' },
  { name: 'promotions', routePrefix: '/promotions', idField: 'id', slugField: 'slug', titleField: 'title' },
];

/**
 * Load single-item routes from fixture JSON files.
 *
 * Each fixture file is expected to contain an array of items under the
 * configured `itemsKey` (default: "items" or "posts"). Every item that
 * has a slug or id is turned into a route like `/menu/grill-salmon-steak`.
 */
export function loadFixtureRoutes(options: LoadFixtureRoutesOptions): Record<string, RouteConfig> {
  const { fixturesDir, collections = DEFAULT_COLLECTIONS } = options;
  const routes: Record<string, RouteConfig> = {};

  for (const collection of collections) {
    const filePath = join(fixturesDir, `${collection.name}.json`);
    if (!existsSync(filePath)) continue;

    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
      const items: unknown[] =
        raw[collection.itemsKey ?? 'items'] ??
        raw['posts'] ??
        [];

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const record = item as Record<string, unknown>;

        const id =
          (collection.slugField ? (record[collection.slugField] as string) : undefined) ??
          (collection.idField ? (record[collection.idField] as string) : undefined);

        if (!id) continue;

        const title =
          (collection.titleField ? (record[collection.titleField] as string) : undefined) ?? id;

        routes[`${collection.routePrefix}/${id}`] = { title };
      }
    } catch {
      // Skip unparseable fixtures
    }
  }

  return routes;
}
