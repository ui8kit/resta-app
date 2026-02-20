/**
 * Sample data for design system page previews.
 * Used by DesignPagesPageView.
 */

import type { MenuDetailPreviewItem } from '../previews/MenuDetailPreview';
import type { RecipeDetailPreviewRecipe } from '../previews/RecipeDetailPreview';
import type { PromotionDetailPreviewItem } from '../previews/PromotionDetailPreview';

export const menuDetailSample: MenuDetailPreviewItem = {
  id: 'grill-salmon-steak',
  title: 'Salmon Steak on the Grill',
  description: 'Atlantic salmon, herb butter, lemon.',
  price: { display: '890 ₽' },
  compareAtPrice: { display: '990 ₽' },
  category: { id: 'grill', title: 'Grill' },
  details: 'Grilled over charcoal, served with herb butter and seasonal vegetables.',
  availability: 'available',
  variants: [
    { id: 'v1', title: '200g', priceModifier: { display: '' } },
    { id: 'v2', title: '300g', priceModifier: { display: '+200 ₽' } },
  ],
  modifiers: [
    { id: 'm1', title: 'Extra sauce', price: { display: '+50 ₽' } },
    { id: 'm2', title: 'Side salad', price: { display: '+150 ₽' } },
  ],
  promotionIds: ['happy-hour-grill'],
};

export const recipeDetailSample: RecipeDetailPreviewRecipe = {
  id: 'recipe-1',
  title: 'Salmon Steak on the Grill at Home',
  excerpt: 'Replicate our grill salmon method in 25 minutes.',
  body: 'Pat the salmon dry. Season with salt and pepper. Heat the grill to medium-high. Grill 4–5 minutes per side until internal temp reaches 145°F.',
  date: '2025-01-15',
  difficulty: 'medium',
  category: { id: 'grill', title: 'Grill' },
  cookTime: { prep: 10, cook: 15, total: 25 },
  servings: 2,
  ingredients: [
    { id: 'i1', amount: 2, unit: ' fillets', name: 'Atlantic salmon' },
    { id: 'i2', amount: 2, unit: ' tbsp', name: 'herb butter' },
    { id: 'i3', amount: 1, unit: ' ', name: 'lemon', note: 'wedges' },
  ],
  steps: [
    { id: 's1', step: 1, title: 'Prep', body: 'Pat salmon dry. Season with salt and pepper.' },
    { id: 's2', step: 2, title: 'Grill', body: 'Grill 4–5 min per side until 145°F.' },
  ],
  nutrition: { calories: 420, protein: 38, fat: 28, carbs: 2 },
};

export const promotionDetailSample: PromotionDetailPreviewItem = {
  id: 'happy-hour-grill',
  title: 'Happy Hour Grill',
  description: '15% off grill dishes on weekdays from 11:00 to 13:00.',
  validUntil: '2025-12-31',
  badge: '-15%',
  discount: { type: 'percentage', couponCode: '' },
  details: 'Automatically applied to grill dishes during active hours.',
};
