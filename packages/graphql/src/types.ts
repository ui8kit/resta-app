/**
 * Canonical context input shape for WPGraphQL mappers.
 * Keep in sync with apps/dsl/src/data/adapters/types.ts
 */
import type { DashboardSidebarLink, NavItem, PageFixture, SidebarLink, SiteInfo } from '@ui8kit/sdk/source/data';

export type Price = {
  amount: number;
  currency: string;
  display: string;
};

export type Image = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type Category = {
  id: string;
  title: string;
};

export type CatalogVariant = {
  id: string;
  title: string;
  priceModifier: Price;
};

export type CatalogModifier = {
  id: string;
  title: string;
  price: Price;
  type: 'checkbox' | 'radio';
};

export type CatalogItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: Price;
  compareAtPrice?: Price;
  category: Category;
  image: Image;
  details?: string;
  availability: 'available' | 'unavailable' | 'limited';
  variants: CatalogVariant[];
  modifiers: CatalogModifier[];
  promotionIds: string[];
};

export type PromotionDiscount = {
  type: 'percentage' | 'fixed' | 'combo';
  value: number;
  appliesTo: {
    categoryIds: string[];
    productIds: string[];
  };
  couponCode: string;
};

export type PromotionItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  validUntil?: string;
  discount?: PromotionDiscount;
  badge?: string;
  image: Image;
  details?: string;
};

export type MenuFixture = {
  title: string;
  subtitle: string;
  categories: Category[];
  items: CatalogItem[];
};

export type PromotionsFixture = {
  title: string;
  subtitle: string;
  items: PromotionItem[];
};

export type NavigationFixture = {
  navItems: NavItem[];
  sidebarLinks: SidebarLink[];
  adminSidebarLinks: DashboardSidebarLink[];
  labels?: {
    adminSidebarLabel?: string;
  };
};

export type CanonicalContextInput = {
  site: SiteInfo;
  page: PageFixture['page'];
  navigation: NavigationFixture;
  fixtures: {
    landing: unknown;
    menu: MenuFixture;
    recipes: unknown;
    blog: unknown;
    promotions: PromotionsFixture;
    admin: unknown;
  };
};
