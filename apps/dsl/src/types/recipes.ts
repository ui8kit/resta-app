export type RecipeIngredient = {
  id: string;
  amountWithUnit?: string;
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

export type RecipeItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  image?: { src: string; alt?: string };
  date?: string;
  category?: { id: string; title: string };
  difficulty?: 'easy' | 'medium' | 'hard';
  cookTime?: { prep: number; cook: number; total: number };
  servings?: number;
  tags?: string[];
};
