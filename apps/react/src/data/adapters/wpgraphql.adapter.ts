import { loadFixturesContextInput } from './fixtures.adapter';
import type { CanonicalContextInput } from './types';

/**
 * WPGraphQL adapter stub.
 * Returns fixture-backed canonical data until endpoint integration is implemented.
 */
export function loadWpGraphqlContextInput(): CanonicalContextInput {
  return loadFixturesContextInput();
}
