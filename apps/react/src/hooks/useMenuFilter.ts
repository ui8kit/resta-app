import { useState } from 'react';
import type { MenuItem, MenuCategory, PromotionItem } from '@/types';
import type { MenuItemWithComputed } from './useCart';

type MenuInput = {
  categories?: MenuCategory[];
  items?: MenuItem[];
};

type PromotionsInput = {
  items?: PromotionItem[];
};

type CategoryTabVariant = 'secondary' | 'ghost';

export function useMenuFilter(menu: MenuInput, promotions?: PromotionsInput) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const items = menu.items ?? [];
  const categories = menu.categories ?? [];
  const promotionsById = Object.fromEntries((promotions?.items ?? []).map((item) => [item.id, item]));

  const withComputed: MenuItemWithComputed[] = items.map((item) => {
    const firstPromotionId = item.promotionIds?.[0];
    const promo = firstPromotionId ? promotionsById[firstPromotionId] : undefined;
    const hasCompareAt = !!item.compareAtPrice?.display;
    return {
      ...item,
      promotionBadge: promo?.badge ?? '',
      hasPromotion: !!promo?.badge,
      hasCompareAt,
    };
  });

  const filteredItems = selectedCategory
    ? withComputed.filter((item) => item.category?.id === selectedCategory)
    : withComputed;

  const allTabVariant: CategoryTabVariant = selectedCategory === null ? 'secondary' : 'ghost';
  const getCategoryTabVariant = (id: string): CategoryTabVariant =>
    selectedCategory === id ? 'secondary' : 'ghost';

  return {
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredItems,
    allTabVariant,
    getCategoryTabVariant,
  };
}
