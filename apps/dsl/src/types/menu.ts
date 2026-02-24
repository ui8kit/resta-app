import type { Category, Price } from './common';

export type MenuPrice = Price;
export type MenuCategory = Category;

export type MenuVariant = {
  id: string;
  title: string;
  priceModifier: MenuPrice;
};

export type MenuModifier = {
  id: string;
  title: string;
  price: MenuPrice;
  type: 'checkbox' | 'radio';
};

export type CatalogItemVariant = {
  id: string;
  title: string;
  priceModifier: MenuPrice;
};

export type CatalogItemModifier = {
  id: string;
  title: string;
  price: MenuPrice;
  type: 'checkbox' | 'radio';
};

export type MenuItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: MenuPrice;
  compareAtPrice?: MenuPrice;
  category: MenuCategory;
  image?: { src: string; alt?: string };
  details?: string;
  availability?: 'available' | 'unavailable' | 'limited';
  variants?: MenuVariant[];
  modifiers?: MenuModifier[];
  promotionIds?: string[];
};

export type CartEntry = {
  id?: string;
  itemId: string;
  title: string;
  price: MenuPrice;
  quantity: number;
};
