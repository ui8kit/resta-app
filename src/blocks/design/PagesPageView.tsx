import { useState } from 'react';
import { Block, Stack, Title, Text, Toast } from '@ui8kit/core';
import { MenuDetailPreview, RecipeDetailPreview, PromotionDetailPreview } from './previews';
import { menuDetailSample, recipeDetailSample, promotionDetailSample } from './fixtures/pages';

export function DesignPagesPageView() {
  const promotionBadge = '-15%';
  const [showToast, setShowToast] = useState(false);

  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowToast(true);
  };

  return (
    <Block component="section" py="8" data-class="design-pages-section">
      <Stack gap="8" max="w-4xl" mx="auto" px="4" items="stretch">
        <Title fontSize="2xl" fontWeight="bold" data-class="design-pages-title">
          Pages
        </Title>

        <Block data-class="design-pages-preview-section">
          <Stack gap="2" mb="4">
            <Title order={4} data-class="design-pages-preview-title">Menu Page</Title>
            <Text fontSize="sm" textColor="muted-foreground">Menu item detail</Text>
          </Stack>
          <Block data-class="design-pages-preview" className="rounded-md border border-border overflow-hidden">
            <MenuDetailPreview item={menuDetailSample} promotionBadge={promotionBadge} onOrderClick={handleOrderClick} />
          </Block>
        </Block>

        <Block data-class="design-pages-preview-section">
          <Stack gap="2" mb="4">
            <Title order={4} data-class="design-pages-preview-title">Recipe Page</Title>
            <Text fontSize="sm" textColor="muted-foreground">Recipe detail with ingredients and steps</Text>
          </Stack>
          <Block data-class="design-pages-preview" className="rounded-md border border-border overflow-hidden">
            <RecipeDetailPreview recipe={recipeDetailSample} onOrderClick={handleOrderClick} />
          </Block>
        </Block>

        <Block data-class="design-pages-preview-section">
          <Stack gap="2" mb="4">
            <Title order={4} data-class="design-pages-preview-title">Promotion Page</Title>
            <Text fontSize="sm" textColor="muted-foreground">Promo detail with discount and validity</Text>
          </Stack>
          <Block data-class="design-pages-preview" className="rounded-md border border-border overflow-hidden">
            <PromotionDetailPreview item={promotionDetailSample} />
          </Block>
        </Block>

        <Toast visible={showToast} onClose={() => setShowToast(false)} duration={9000} />
      </Stack>
    </Block>
  );
}
