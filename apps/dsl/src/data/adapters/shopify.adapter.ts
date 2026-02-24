import { loadFixturesContextInput } from './fixtures.adapter';
import type { CanonicalContextInput } from './types';

/**
 * Shopify adapter stub.
 * Returns fixture-backed canonical data until Storefront API integration is implemented.
 */
export function loadShopifyContextInput(): CanonicalContextInput {
  return loadFixturesContextInput();
}
