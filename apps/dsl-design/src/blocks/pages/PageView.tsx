import { useState } from 'react';
import { DesignLayout } from '@/layouts';
import { Block, Stack, Title, Text, Toast } from '@ui8kit/core';
import { MenuDetailPreview, RecipeDetailPreview, PromotionDetailPreview } from '@/blocks/previews';
import type { PagesPreviewFixture, NavItem, SidebarLink } from '@/types';

export interface PagesPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  pagesPreview: PagesPreviewFixture;
}

export function PagesPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  pagesPreview,
}: PagesPageViewProps) {
  const [showToast, setShowToast] = useState(false);
  const { menuDetail, recipeDetail, promotionDetail } = pagesPreview;
  const promotionBadge = '-15%';

  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowToast(true);
  };

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" py="8" data-class="design-pages-section">
        <Stack gap="8" max="w-4xl" mx="auto" items="stretch" data-class="design-pages-stack">
          <Title fontSize="2xl" fontWeight="bold" data-class="design-pages-title">
            Pages
          </Title>

          <Block data-class="design-pages-preview-section">
            <Stack gap="2" mb="4">
              <Title order={4} data-class="design-pages-preview-title">Menu Page</Title>
              <Text fontSize="sm" textColor="muted-foreground">Menu item detail</Text>
            </Stack>
            <Block rounded="md" border="" overflow="hidden" data-class="design-pages-preview">
              <MenuDetailPreview
                item={menuDetail as never}
                promotionBadge={promotionBadge}
                onOrderClick={handleOrderClick}
              />
            </Block>
          </Block>

          <Block data-class="design-pages-preview-section">
            <Stack gap="2" mb="4">
              <Title order={4} data-class="design-pages-preview-title">Recipe Page</Title>
              <Text fontSize="sm" textColor="muted-foreground">Recipe detail with ingredients and steps</Text>
            </Stack>
            <Block rounded="md" border="" overflow="hidden" data-class="design-pages-preview">
              <RecipeDetailPreview
                recipe={recipeDetail as never}
                onOrderClick={handleOrderClick}
              />
            </Block>
          </Block>

          <Block data-class="design-pages-preview-section">
            <Stack gap="2" mb="4">
              <Title order={4} data-class="design-pages-preview-title">Promotion Page</Title>
              <Text fontSize="sm" textColor="muted-foreground">Promo detail with discount and validity</Text>
            </Stack>
            <Block rounded="md" border="" overflow="hidden" data-class="design-pages-preview">
              <PromotionDetailPreview item={promotionDetail as never} />
            </Block>
          </Block>

          <Toast visible={showToast} onClose={() => setShowToast(false)} duration={9000} />
        </Stack>
      </Block>
    </DesignLayout>
  );
}
