import { MainLayout } from '@/layouts';
import { Block, Container, Title, Text, Group, Badge, Grid } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';

type RecipeIngredient = {
  id: string;
  amount: number;
  unit: string;
  name: string;
  note?: string;
};

type RecipeStep = {
  id: string;
  step: number;
  title?: string;
  body: string;
};

export interface RecipeDetailPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
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

export function RecipeDetailPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  recipe,
  preview,
}: RecipeDetailPageViewProps) {
  const ingredients = recipe?.ingredients ?? [];
  const steps = recipe?.steps ?? [];

  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="article" data-class="recipe-detail-section">
        <Container max="w-2xl" py="16">
          <If test="recipe" value={!!recipe}>
            <Block data-class="recipe-detail-content">
              <Group items="center" gap="2" mb="2">
                <If test="recipe.difficulty" value={!!recipe?.difficulty}>
                  <Badge variant="outline" data-class="recipe-detail-difficulty">
                    <Var name="recipe.difficulty" value={recipe?.difficulty} />
                  </Badge>
                </If>
                <If test="recipe.category.title" value={!!recipe?.category?.title}>
                  <Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-category">
                    <Var name="recipe.category.title" value={recipe?.category?.title} />
                  </Text>
                </If>
              </Group>
              <Title fontSize="4xl" fontWeight="bold" data-class="recipe-detail-title">
                <Var name="recipe.title" value={recipe?.title} />
              </Title>
              <Group items="center" gap="2" mt="2" data-class="recipe-detail-meta">
                <If test="recipe.date" value={!!recipe?.date}>
                  <Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-date">
                    <Var name="recipe.date" value={recipe?.date} />
                  </Text>
                </If>
                <If test="recipe.cookTime.total" value={!!recipe?.cookTime?.total}>
                  <Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-time">
                    <Var name="recipe.cookTime.total" value={`${recipe?.cookTime?.total} min`} />
                  </Text>
                </If>
                <If test="recipe.servings" value={!!recipe?.servings}>
                  <Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-servings">
                    <Var name="recipe.servings" value={`${recipe?.servings} servings`} />
                  </Text>
                </If>
              </Group>
              <If test="recipe.excerpt" value={!!recipe?.excerpt}>
                <Text fontSize="lg" mt="4" textColor="muted-foreground" data-class="recipe-detail-excerpt">
                  <Var name="recipe.excerpt" value={recipe?.excerpt} />
                </Text>
              </If>
              <Block py="6" data-class="recipe-detail-body">
                <Text fontSize="base" lineHeight="relaxed" data-class="recipe-detail-text">
                  <Var name="recipe.body" value={recipe?.body} />
                </Text>
              </Block>
              <Grid cols="1-2" gap="6" data-class="recipe-detail-grid">
                <Block data-class="recipe-detail-ingredients">
                  <Title order={3} fontSize="xl" fontWeight="semibold" mb="3">
                    Ingredients
                  </Title>
                  <If test="ingredients.length > 0" value={ingredients.length > 0}>
                    <Block data-class="recipe-ingredients-list">
                      <Loop each="recipe.ingredients" as="ingredient" data={ingredients}>
                        {(ingredient: RecipeIngredient) => (
                          <Group items="baseline" gap="2" py="1" data-class="recipe-ingredient-row">
                            <Text fontWeight="semibold" data-class="recipe-ingredient-amount">
                              <Var
                                name="ingredient.amountWithUnit"
                                value={`${ingredient.amount}${ingredient.unit ? ingredient.unit : ''}`}
                              />
                            </Text>
                            <Text data-class="recipe-ingredient-name">
                              <Var name="ingredient.name" value={ingredient.name} />
                              <If test="ingredient.note" value={!!ingredient.note}>
                                {' ('}
                                <Var name="ingredient.note" value={ingredient.note} />
                                {')'}
                              </If>
                            </Text>
                          </Group>
                        )}
                      </Loop>
                    </Block>
                  </If>
                </Block>
                <Block data-class="recipe-detail-steps">
                  <Title order={3} fontSize="xl" fontWeight="semibold" mb="3">
                    Steps
                  </Title>
                  <If test="steps.length > 0" value={steps.length > 0}>
                    <Block data-class="recipe-steps-list">
                      <Loop each="recipe.steps" as="recipeStep" data={steps}>
                        {(recipeStep: RecipeStep) => (
                          <Block py="2" data-class="recipe-step">
                            <Text fontWeight="bold" data-class="recipe-step-number">
                              Step <Var name="recipeStep.step" value={recipeStep.step} />
                            </Text>
                            <If test="recipeStep.title" value={!!recipeStep.title}>
                              <Text fontWeight="semibold" data-class="recipe-step-title">
                                <Var name="recipeStep.title" value={recipeStep.title} />
                              </Text>
                            </If>
                            <Text data-class="recipe-step-body">
                              <Var name="recipeStep.body" value={recipeStep.body} />
                            </Text>
                          </Block>
                        )}
                      </Loop>
                    </Block>
                  </If>
                </Block>
              </Grid>
              <If test="recipe.nutrition" value={!!recipe?.nutrition}>
                <Block py="6" data-class="recipe-detail-nutrition">
                  <Title order={4} fontSize="lg" fontWeight="semibold" mb="2">
                    Nutrition (per serving)
                  </Title>
                  <Text textColor="muted-foreground" data-class="recipe-detail-nutrition-line">
                    <Var name="recipe.nutrition.calories" value={recipe?.nutrition?.calories} /> kcal
                    {' · '}
                    <Var name="recipe.nutrition.protein" value={recipe?.nutrition?.protein} />g protein
                    {' · '}
                    <Var name="recipe.nutrition.fat" value={recipe?.nutrition?.fat} />g fat
                    {' · '}
                    <Var name="recipe.nutrition.carbs" value={recipe?.nutrition?.carbs} />g carbs
                  </Text>
                </Block>
              </If>
              <If test="recipe.linkedMenuItemId" value={!!recipe?.linkedMenuItemId}>
                <DomainNavButton href={`/menu/${recipe?.linkedMenuItemId}`} size="lg" data-class="recipe-detail-cta">
                  Order in the restaurant
                </DomainNavButton>
              </If>
            </Block>
          </If>
        </Container>
      </Block>
    </MainLayout>
  );
}
