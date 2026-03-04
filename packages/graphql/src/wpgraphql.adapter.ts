import { requestGraphql } from './client';
import { menuQuery, promotionsQuery, siteQuery } from './queries';
import {
  mapWpGraphqlToCanonicalContextInput,
  type WpGraphqlMenuQueryData,
  type WpGraphqlPromotionsQueryData,
  type WpGraphqlSiteQueryData,
} from './mappers';
import type { CanonicalContextInput } from './types';

export type LoadWpGraphqlContextInputOptions = {
  endpoint?: string;
  getFallback: () => CanonicalContextInput;
};

/**
 * WPGraphQL adapter.
 * Uses GraphQL endpoint when configured; otherwise returns fallback.
 */
export async function loadWpGraphqlContextInput(
  options: LoadWpGraphqlContextInputOptions,
): Promise<CanonicalContextInput> {
  const { endpoint, getFallback } = options;
  const fallback = getFallback();

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
