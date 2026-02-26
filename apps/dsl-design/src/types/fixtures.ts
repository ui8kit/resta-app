export type ColorToken = { id: string; label: string };

export type ColorTokenGroup = {
  id: string;
  label: string;
  tokens: ColorToken[];
};

export type ColorsFixture = {
  title: string;
  subtitle: string;
  groups: ColorTokenGroup[];
};

export type ComponentsFixture = {
  title: string;
  subtitle: string;
  buttonVariants: string[];
  buttonSizes: string[];
  badgeVariants: string[];
  badgeSizes: string[];
  iconSamples: { icon: string; label: string }[];
  fieldTypes: Array<{
    type: string;
    label: string;
    placeholder?: string;
    rows?: number;
    optionLabel?: string;
    options?: { value: string; label: string }[];
  }>;
};

export type TypographyScaleFixture = {
  title: string;
  subtitle: string;
  sampleText: string;
  fontSizes: string[];
  fontWeights: string[];
  lineHeights: string[];
  letterSpacings: string[];
  titleOrders: number[];
};

export type WidgetsDemoFixture = {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaUrl: string;
    secondaryCtaText: string;
    secondaryCtaUrl: string;
  };
  menuItems: Array<{
    id: string;
    title: string;
    description: string;
    category?: { title: string };
    price?: { display: string };
    compareAtPrice?: { display: string };
    promotionIds?: string[];
    variants?: Array<{ id: string; title: string; priceModifier?: { display: string } }>;
  }>;
  accordionItems: Array<{ id: string; trigger: string; content: string }>;
};

export type PagesPreviewFixture = {
  menuDetail: Record<string, unknown>;
  recipeDetail: Record<string, unknown>;
  promotionDetail: Record<string, unknown>;
};
