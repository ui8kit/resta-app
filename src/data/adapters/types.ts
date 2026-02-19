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

export type RecipeIngredient = {
  id: string;
  amount: number;
  unit: string;
  name: string;
  note?: string;
};

export type RecipeStep = {
  id: string;
  step: number;
  title?: string;
  body: string;
};

export type RecipeCookTime = {
  prep: number;
  cook: number;
  total: number;
};

export type RecipeNutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type GuideItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image: Image;
  date?: string;
  category?: Category;
  linkedMenuItemId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  cookTime?: RecipeCookTime;
  servings?: number;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  tags?: string[];
  nutrition?: RecipeNutrition;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image: Image;
  date?: string;
  author?: string;
};

export type LandingFixture = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
};

export type MenuFixture = {
  title: string;
  subtitle: string;
  categories: Category[];
  items: CatalogItem[];
};

export type RecipesFixture = {
  title: string;
  subtitle: string;
  items: GuideItem[];
};

export type BlogFixture = {
  title: string;
  subtitle: string;
  posts: BlogPost[];
};

export type PromotionsFixture = {
  title: string;
  subtitle: string;
  items: PromotionItem[];
};

export type AdminFixture = {
  exportSchema: Record<string, string>;
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
    landing: LandingFixture;
    menu: MenuFixture;
    recipes: RecipesFixture;
    blog: BlogFixture;
    promotions: PromotionsFixture;
    admin: AdminFixture;
  };
};
