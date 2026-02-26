import type { CanonicalContextInput, PageFixture, SiteInfo } from './types';
import siteData from '../../../fixtures/shared/site.json';
import navigationData from '../../../fixtures/shared/navigation.json';
import pageData from '../../../fixtures/shared/page.json';
import overviewData from '../../../fixtures/overview.json';
import colorsData from '../../../fixtures/colors.json';
import tokensData from '../../../fixtures/tokens.json';
import componentsData from '../../../fixtures/components.json';
import primitivesData from '../../../fixtures/primitives.json';
import widgetsData from '../../../fixtures/widgets.json';
import typographyData from '../../../fixtures/typography.json';
import typographyScaleData from '../../../fixtures/typography-scale.json';
import pagesData from '../../../fixtures/pages.json';
import widgetsDemoData from '../../../fixtures/widgets-demo.json';
import pagesPreviewData from '../../../fixtures/pages-preview.json';

export function loadFixturesContextInput(): CanonicalContextInput {
  return {
    site: siteData as SiteInfo,
    page: (pageData as PageFixture).page,
    navigation: navigationData as CanonicalContextInput['navigation'],
    fixtures: {
      overview: overviewData as CanonicalContextInput['fixtures']['overview'],
      colors: colorsData as CanonicalContextInput['fixtures']['colors'],
      tokens: tokensData as CanonicalContextInput['fixtures']['tokens'],
      components: componentsData as CanonicalContextInput['fixtures']['components'],
      primitives: primitivesData as CanonicalContextInput['fixtures']['primitives'],
      widgets: widgetsData as CanonicalContextInput['fixtures']['widgets'],
      typography: typographyData as CanonicalContextInput['fixtures']['typography'],
      typographyScale: typographyScaleData as CanonicalContextInput['fixtures']['typographyScale'],
      pages: pagesData as CanonicalContextInput['fixtures']['pages'],
      widgetsDemo: widgetsDemoData as CanonicalContextInput['fixtures']['widgetsDemo'],
      pagesPreview: pagesPreviewData as CanonicalContextInput['fixtures']['pagesPreview'],
    },
  };
}
