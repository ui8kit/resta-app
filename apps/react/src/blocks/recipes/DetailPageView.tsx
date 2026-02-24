import { MainLayout } from '@/layouts';
import { Block, Container, Title, Text, Group, Badge, Grid } from '@/components';
import { DomainNavButton } from '@/partials';
import type { NavItem, RecipeIngredient, RecipeStep } from '@/types';
import { Fragment } from 'react';

interface RecipeDetailPageViewProps {
  navItems?: NavItem[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  recipe?: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    image?: { src: string; alt?: string };
    date?: string;
    category?: { id: string; title: string };
    linkedMenuItemId?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    cookTime?: { prep: number; cook: number; total: number };
    servings?: number;
    ingredients?: RecipeIngredient[];
    steps?: RecipeStep[];
    tags?: string[];
    nutrition?: { calories: number; protein: number; fat: number; carbs: number };
  };
}

export function RecipeDetailPageView(props: RecipeDetailPageViewProps) {
  const { navItems, sidebar, headerTitle, headerSubtitle, recipe } = props;

  const ingredients = recipe?.ingredients ?? [];
  const steps = recipe?.steps ?? [];

  return (
    <MainLayout mode={"full"} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <Block component="article" data-class="recipe-detail-section">
        <Container max="w-2xl" py="16">
          {recipe ? (<><Block data-class="recipe-detail-content"><Group items="center" gap="2" mb="2">{recipe.difficulty ? (<><Badge variant="outline" data-class="recipe-detail-difficulty">{recipe.difficulty}</Badge></>) : null}{recipe.category.title ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-category">{recipe.category.title}</Text></>) : null}</Group><Title fontSize="4xl" fontWeight="bold" data-class="recipe-detail-title">{recipe.title}</Title><Group items="center" gap="2" mt="2" data-class="recipe-detail-meta">{recipe.date ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-date">{recipe.date}</Text></>) : null}{recipe.cookTime.total ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-time">{recipe.cookTime.total}</Text></>) : null}{recipe.servings ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-servings">{recipe.servings}</Text></>) : null}</Group>{recipe.excerpt ? (<><Text fontSize="lg" mt="4" textColor="muted-foreground" data-class="recipe-detail-excerpt">{recipe.excerpt}</Text></>) : null}<Block py="8" data-class="recipe-detail-body"><Text fontSize="base" lineHeight="relaxed" data-class="recipe-detail-text">{recipe.body}</Text></Block><Grid cols="1-2" gap="6" data-class="recipe-detail-grid"><Block data-class="recipe-detail-ingredients"><Title order={3} fontSize="xl" fontWeight="semibold" mb="4"> Ingredients </Title>{ingredients.length > 0 ? (<><Block data-class="recipe-ingredients-list">{(recipe.ingredients ?? []).map((ingredient, index) => (
          <Fragment key={ingredient.id ?? index}>
          <Group items="baseline" gap="2" py="2" data-class="recipe-ingredient-row"><Text fontWeight="semibold" data-class="recipe-ingredient-amount">{ingredient.amountWithUnit}</Text><Text data-class="recipe-ingredient-name">{ingredient.name}{ingredient.note ? (<><Text component="span">' ('{ingredient.note}')'</Text></>) : null}</Text></Group>
          </Fragment>
          ))}</Block></>) : null}</Block><Block data-class="recipe-detail-steps"><Title order={3} fontSize="xl" fontWeight="semibold" mb="4"> Steps </Title>{steps.length > 0 ? (<><Block data-class="recipe-steps-list">{(recipe.steps ?? []).map((recipeStep, index) => (
          <Fragment key={recipeStep.id ?? index}>
          <Block py="2" data-class="recipe-step"><Text fontWeight="bold" data-class="recipe-step-number"> Step {recipeStep.step}</Text>{recipeStep.title ? (<><Text fontWeight="semibold" data-class="recipe-step-title">{recipeStep.title}</Text></>) : null}<Text data-class="recipe-step-body">{recipeStep.body}</Text></Block>
          </Fragment>
          ))}</Block></>) : null}</Block></Grid>{recipe.nutrition ? (<><Block py="8" data-class="recipe-detail-nutrition"><Title order={4} fontSize="lg" fontWeight="semibold" mb="2"> Nutrition (per serving) </Title><Text textColor="muted-foreground" data-class="recipe-detail-nutrition-line">{recipe.nutrition.calories} kcal ' · '{recipe.nutrition.protein}g protein ' · '{recipe.nutrition.fat}g fat ' · '{recipe.nutrition.carbs}g carbs </Text></Block></>) : null}{recipe.linkedMenuItemId ? (<><DomainNavButton href={`/menu/${recipe?.linkedMenuItemId}`} size={"lg"} data-class={"recipe-detail-cta"}>Order in the restaurant</DomainNavButton></>) : null}</Block></>) : null}
        </Container>
      </Block>
    </MainLayout>
  );
}
