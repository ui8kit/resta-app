import type { CanonicalContextInput } from './types';
import siteData from '../../../fixtures/shared/site.json';
import navigationData from '../../../fixtures/shared/navigation.json';
import pageData from '../../../fixtures/shared/page.json';
import landingData from '../../../fixtures/landing.json';
import menuData from '../../../fixtures/menu.json';
import recipesData from '../../../fixtures/recipes.json';
import blogData from '../../../fixtures/blog.json';
import promotionsData from '../../../fixtures/promotions.json';
import adminData from '../../../fixtures/admin.json';
import type { PageFixture, SiteInfo } from './types';

export function loadFixturesContextInput(): CanonicalContextInput {
  return {
    site: siteData as SiteInfo,
    page: (pageData as PageFixture).page,
    navigation: navigationData as CanonicalContextInput['navigation'],
    fixtures: {
      landing: landingData as CanonicalContextInput['fixtures']['landing'],
      menu: menuData as CanonicalContextInput['fixtures']['menu'],
      recipes: recipesData as CanonicalContextInput['fixtures']['recipes'],
      blog: blogData as CanonicalContextInput['fixtures']['blog'],
      promotions: promotionsData as CanonicalContextInput['fixtures']['promotions'],
      admin: adminData as CanonicalContextInput['fixtures']['admin'],
    },
  };
}
