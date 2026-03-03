import { loadFixturesContextInput } from './fixtures.adapter';
import { requestGraphql } from '../graphql/client';
import menuQuery from '../graphql/menu.graphql?raw';
import promotionsQuery from '../graphql/promotions.graphql?raw';
import siteQuery from '../graphql/site.graphql?raw';
import {
  mapWpGraphqlToCanonicalContextInput,
  type WpGraphqlMenuQueryData,
  type WpGraphqlPromotionsQueryData,
  type WpGraphqlSiteQueryData,
} from '../graphql/mappers';
import type { CanonicalContextInput } from './types';

/**
 * WPGraphQL adapter.
 * Uses GraphQL endpoint when configured; otherwise falls back to fixtures.
 */
export async function loadWpGraphqlContextInput(): Promise<CanonicalContextInput> {
  const fallback = loadFixturesContextInput();
  const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;

  if (!endpoint) {
    return fallback;
  }

  try {
    const [menuData, promotionsData, siteData] = await Promise.all([
      requestGraphql<WpGraphqlMenuQueryData>({
        endpoint,
        query: menuQuery,
        operationName: 'GetMenuItems',
        variables: { first: 100 },
      }),
      requestGraphql<WpGraphqlPromotionsQueryData>({
        endpoint,
        query: promotionsQuery,
        operationName: 'GetPromotions',
        variables: { first: 100 },
      }),
      requestGraphql<WpGraphqlSiteQueryData>({
        endpoint,
        query: siteQuery,
        operationName: 'GetSiteMetadata',
      }),
    ]);

    return mapWpGraphqlToCanonicalContextInput({
      fallback,
      menuData,
      promotionsData,
      siteData,
    });
  } catch {
    return fallback;
  }
}
