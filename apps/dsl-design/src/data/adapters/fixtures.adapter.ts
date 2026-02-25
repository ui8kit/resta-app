import type { CanonicalContextInput, PageFixture, SiteInfo } from './types';
import siteData from '../../../fixtures/shared/site.json';
import navigationData from '../../../fixtures/shared/navigation.json';
import pageData from '../../../fixtures/shared/page.json';
import tokensData from '../../../fixtures/tokens.json';
import primitivesData from '../../../fixtures/primitives.json';
import widgetsData from '../../../fixtures/widgets.json';
import typographyData from '../../../fixtures/typography.json';
import pagesData from '../../../fixtures/pages.json';

export function loadFixturesContextInput(): CanonicalContextInput {
  return {
    site: siteData as SiteInfo,
    page: (pageData as PageFixture).page,
    navigation: navigationData as CanonicalContextInput['navigation'],
    fixtures: {
      tokens: tokensData as CanonicalContextInput['fixtures']['tokens'],
      primitives: primitivesData as CanonicalContextInput['fixtures']['primitives'],
      widgets: widgetsData as CanonicalContextInput['fixtures']['widgets'],
      typography: typographyData as CanonicalContextInput['fixtures']['typography'],
      pages: pagesData as CanonicalContextInput['fixtures']['pages'],
    },
  };
}
