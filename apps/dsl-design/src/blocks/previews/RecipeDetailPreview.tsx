import { Block, Stack, Title, Text, Button, Group } from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';

export interface RecipeDetailPreviewProps {
  recipe: {
    title?: string;
    description?: string;
    category?: { title?: string };
    time?: string;
    servings?: string;
    ingredients?: string[];
    steps?: string[];
  };
  onOrderClick?: (e: React.MouseEvent) => void;
}

export function RecipeDetailPreview({ recipe, onOrderClick }: RecipeDetailPreviewProps) {
  const ingredients = recipe.ingredients ?? [];
  const steps = recipe.steps ?? [];

  return (
    <Block p="6" data-class="recipe-detail-preview">
      <Stack gap="4">
        <If test="recipe.category.title" value={!!recipe.category?.title}>
          <Text fontSize="xs" textColor="muted-foreground"><Var name="recipe.category.title" value={recipe.category?.title} /></Text>
        </If>
        <If test="recipe.title" value={!!recipe.title}>
          <Title order={2}><Var name="recipe.title" value={recipe.title} /></Title>
        </If>
        <If test="recipe.description" value={!!recipe.description}>
          <Text fontSize="sm" textColor="muted-foreground"><Var name="recipe.description" value={recipe.description} /></Text>
        </If>
        <Group gap="2" items="center">
          <If test="recipe.time" value={!!recipe.time}>
            <Text fontSize="sm"><Var name="recipe.time" value={recipe.time} /></Text>
          </If>
          <If test="recipe.servings" value={!!recipe.servings}>
            <Text fontSize="sm"><Var name="recipe.servings" value={recipe.servings} /></Text>
          </If>
        </Group>
        <If test="ingredients.length" value={ingredients.length > 0}>
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="semibold">Ingredients</Text>
            <Loop each="ingredients" as="ing" data={ingredients}>
              {(ing) => <Text key={ing} fontSize="sm"><Var name="ing" value={ing} /></Text>}
            </Loop>
          </Stack>
        </If>
        <If test="steps.length" value={steps.length > 0}>
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="semibold">Steps</Text>
            <Loop each="steps" as="step" data={steps}>
              {(step) => <Text key={step} fontSize="sm"><Var name="step" value={step} /></Text>}
            </Loop>
          </Stack>
        </If>
        <If test="onOrderClick" value={!!onOrderClick}>
          <Button size="sm" onClick={onOrderClick}>View Recipe</Button>
        </If>
      </Stack>
    </Block>
  );
}
