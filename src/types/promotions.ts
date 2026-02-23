import type { Image } from './common';

export type PromotionDiscount = {
  type: 'percentage' | 'fixed' | 'combo';
  value: number;
  appliesTo?: {
    categoryIds?: string[];
    productIds?: string[];
  };
  couponCode?: string;
};

export type PromotionItem = {
  id: string;
  slug?: string;
  title?: string;
  description?: string;
  validUntil?: string;
  badge?: string;
  discount?: PromotionDiscount;
  image?: Image;
  details?: string;
};
