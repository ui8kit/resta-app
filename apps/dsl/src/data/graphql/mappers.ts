import type { CanonicalContextInput } from '../adapters/types';

type Nullable<T> = T | null | undefined;

type WpGraphqlCategoryNode = {
  slug?: Nullable<string>;
  name?: Nullable<string>;
};

type WpGraphqlMenuNode = {
  databaseId?: Nullable<number>;
  slug?: Nullable<string>;
  name?: Nullable<string>;
  description?: Nullable<string>;
  shortDescription?: Nullable<string>;
  price?: Nullable<string>;
  regularPrice?: Nullable<string>;
  image?: Nullable<{
    sourceUrl?: Nullable<string>;
    altText?: Nullable<string>;
  }>;
  productCategories?: Nullable<{
    nodes?: Nullable<Array<Nullable<WpGraphqlCategoryNode>>>;
  }>;
  variations?: Nullable<{
    nodes?: Nullable<
      Array<
        Nullable<{
          databaseId?: Nullable<number>;
          name?: Nullable<string>;
          price?: Nullable<string>;
        }>
      >
    >;
  }>;
  metaData?: Nullable<{
    promotion_ids?: Nullable<string[] | string>;
  }>;
};

type WpGraphqlPromotionNode = {
  databaseId?: Nullable<number>;
  slug?: Nullable<string>;
  title?: Nullable<string>;
  excerpt?: Nullable<string>;
  content?: Nullable<string>;
  promotionMeta?: Nullable<{
    badge?: Nullable<string>;
    validUntil?: Nullable<string>;
    discountType?: Nullable<string>;
    discountValue?: Nullable<number | string>;
    couponCode?: Nullable<string>;
    categoryIds?: Nullable<string[]>;
    productIds?: Nullable<string[]>;
  }>;
  featuredImage?: Nullable<{
    node?: Nullable<{
      sourceUrl?: Nullable<string>;
      altText?: Nullable<string>;
    }>;
  }>;
};

type WpGraphqlSiteMenuItemNode = {
  id?: Nullable<string>;
  label?: Nullable<string>;
  path?: Nullable<string>;
  parentId?: Nullable<string>;
};

export type WpGraphqlMenuQueryData = {
  products?: Nullable<{
    nodes?: Nullable<Array<Nullable<WpGraphqlMenuNode>>>;
  }>;
};

export type WpGraphqlPromotionsQueryData = {
  promotions?: Nullable<{
    nodes?: Nullable<Array<Nullable<WpGraphqlPromotionNode>>>;
  }>;
};

export type WpGraphqlSiteQueryData = {
  generalSettings?: Nullable<{
    title?: Nullable<string>;
    description?: Nullable<string>;
  }>;
  menuItems?: Nullable<{
    nodes?: Nullable<Array<Nullable<WpGraphqlSiteMenuItemNode>>>;
  }>;
};

type MapperInput = {
  fallback: CanonicalContextInput;
  menuData: WpGraphqlMenuQueryData;
  promotionsData: WpGraphqlPromotionsQueryData;
  siteData: WpGraphqlSiteQueryData;
};

const DEFAULT_CURRENCY = 'RUB';
type PromotionDiscountType = NonNullable<
  CanonicalContextInput['fixtures']['promotions']['items'][number]['discount']
>['type'];

export function mapWpGraphqlToCanonicalContextInput(input: MapperInput): CanonicalContextInput {
  const fallback = input.fallback;
  const menu = mapMenuFixture(input.menuData, fallback);
  const promotions = mapPromotionsFixture(input.promotionsData, fallback);
  const site = mapSiteFixture(input.siteData, fallback);
  const navigation = mapNavigationFixture(input.siteData, fallback);

  return {
    ...fallback,
    site,
    navigation,
    fixtures: {
      ...fallback.fixtures,
      menu,
      promotions,
    },
  };
}

function mapMenuFixture(
  data: WpGraphqlMenuQueryData,
  fallback: CanonicalContextInput,
): CanonicalContextInput['fixtures']['menu'] {
  const nodes = data.products?.nodes ?? [];
  const items = nodes.flatMap((node, index) => (node ? [mapCatalogItem(node, index)] : []));

  if (!items.length) {
    return fallback.fixtures.menu;
  }

  const categoriesMap = new Map<string, CanonicalContextInput['fixtures']['menu']['categories'][number]>();
  for (const item of items) {
    categoriesMap.set(item.category.id, item.category);
  }

  return {
    ...fallback.fixtures.menu,
    categories: Array.from(categoriesMap.values()),
    items,
  };
}

function mapPromotionsFixture(
  data: WpGraphqlPromotionsQueryData,
  fallback: CanonicalContextInput,
): CanonicalContextInput['fixtures']['promotions'] {
  const nodes = data.promotions?.nodes ?? [];
  const items = nodes.flatMap((node, index) => (node ? [mapPromotionItem(node, index)] : []));

  if (!items.length) {
    return fallback.fixtures.promotions;
  }

  return {
    ...fallback.fixtures.promotions,
    items,
  };
}

function mapSiteFixture(data: WpGraphqlSiteQueryData, fallback: CanonicalContextInput): CanonicalContextInput['site'] {
  const title = getNonEmptyString(data.generalSettings?.title) ?? fallback.site.title;
  const description = getNonEmptyString(data.generalSettings?.description) ?? fallback.site.description;

  return {
    ...fallback.site,
    title,
    description,
  };
}

function mapNavigationFixture(
  data: WpGraphqlSiteQueryData,
  fallback: CanonicalContextInput,
): CanonicalContextInput['navigation'] {
  const nodes = data.menuItems?.nodes ?? [];
  const navItems = nodes
    .filter((node): node is WpGraphqlSiteMenuItemNode => Boolean(node) && !node?.parentId)
    .map((node, index) => {
      const path = normalizePath(node.path);
      return {
        id: getNonEmptyString(node.id) ?? `nav-${index + 1}`,
        title: getNonEmptyString(node.label) ?? `Item ${index + 1}`,
        url: path,
      };
    });

  if (!navItems.length) {
    return fallback.navigation;
  }

  return {
    ...fallback.navigation,
    navItems,
    sidebarLinks: navItems.slice(0, 2).map((item) => ({
      label: item.title,
      href: item.url,
    })),
  };
}

function mapCatalogItem(
  node: WpGraphqlMenuNode,
  index: number,
): CanonicalContextInput['fixtures']['menu']['items'][number] {
  const categoryNode = node.productCategories?.nodes?.find(Boolean);
  const categoryId = getNonEmptyString(categoryNode?.slug) ?? 'uncategorized';
  const categoryTitle = getNonEmptyString(categoryNode?.name) ?? 'Uncategorized';
  const itemTitle = getNonEmptyString(node.name) ?? `Menu Item ${index + 1}`;
  const imageSrc = getNonEmptyString(node.image?.sourceUrl) ?? '';
  const imageAlt = getNonEmptyString(node.image?.altText) ?? itemTitle;
  const compareAtPriceDisplay = getNonEmptyString(node.regularPrice);
  const variants = (node.variations?.nodes ?? [])
    .filter((variant): variant is NonNullable<typeof variant> => Boolean(variant))
    .map((variant, variantIndex) => {
      const variantName = getNonEmptyString(variant.name) ?? `Variant ${variantIndex + 1}`;
      const priceModifier = toPrice(variant.price, '');

      return {
        id: String(variant.databaseId ?? `${node.databaseId ?? index + 1}-variant-${variantIndex + 1}`),
        title: variantName,
        priceModifier,
      };
    });

  return {
    id: String(node.databaseId ?? index + 1),
    slug: getNonEmptyString(node.slug) ?? `menu-item-${index + 1}`,
    title: itemTitle,
    description: getNonEmptyString(node.description) ?? '',
    details: getNonEmptyString(node.shortDescription) ?? '',
    price: toPrice(node.price, ''),
    compareAtPrice: compareAtPriceDisplay ? toPrice(compareAtPriceDisplay, '') : undefined,
    category: {
      id: categoryId,
      title: categoryTitle,
    },
    image: {
      src: imageSrc,
      alt: imageAlt,
      width: 0,
      height: 0,
    },
    availability: 'available',
    variants,
    modifiers: [],
    promotionIds: normalizePromotionIds(node.metaData?.promotion_ids),
  };
}

function mapPromotionItem(
  node: WpGraphqlPromotionNode,
  index: number,
): CanonicalContextInput['fixtures']['promotions']['items'][number] {
  const title = getNonEmptyString(node.title) ?? `Promotion ${index + 1}`;
  const discountType = normalizeDiscountType(node.promotionMeta?.discountType);
  const discountValue = toNumber(node.promotionMeta?.discountValue);

  return {
    id: String(node.databaseId ?? index + 1),
    slug: getNonEmptyString(node.slug) ?? `promotion-${index + 1}`,
    title,
    description: getNonEmptyString(node.excerpt) ?? '',
    details: getNonEmptyString(node.content) ?? '',
    validUntil: getNonEmptyString(node.promotionMeta?.validUntil),
    badge: getNonEmptyString(node.promotionMeta?.badge),
    image: {
      src: getNonEmptyString(node.featuredImage?.node?.sourceUrl) ?? '',
      alt: getNonEmptyString(node.featuredImage?.node?.altText) ?? title,
      width: 0,
      height: 0,
    },
    discount: discountType
      ? {
          type: discountType,
          value: discountValue,
          appliesTo: {
            categoryIds: node.promotionMeta?.categoryIds ?? [],
            productIds: node.promotionMeta?.productIds ?? [],
          },
          couponCode: getNonEmptyString(node.promotionMeta?.couponCode) ?? '',
        }
      : undefined,
  };
}

function toPrice(
  value: Nullable<string>,
  defaultDisplay: string,
): CanonicalContextInput['fixtures']['menu']['items'][number]['price'] {
  const amount = toNumber(value);
  const display = getNonEmptyString(value) ?? defaultDisplay;

  return {
    amount,
    currency: DEFAULT_CURRENCY,
    display,
  };
}

function toNumber(value: Nullable<string | number>): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return 0;
  }

  const normalized = value.replace(/[^\d,.\-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getNonEmptyString(value: Nullable<string>): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeDiscountType(value: Nullable<string>): PromotionDiscountType | undefined {
  if (value === 'percentage' || value === 'fixed' || value === 'combo') {
    return value;
  }
  return undefined;
}

function normalizePromotionIds(value: Nullable<string[] | string>): string[] {
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }
  return [];
}

function normalizePath(value: Nullable<string>): string {
  const path = getNonEmptyString(value) ?? '/';
  return path.startsWith('/') ? path : `/${path}`;
}
