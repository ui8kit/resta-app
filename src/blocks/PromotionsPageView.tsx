import { MainLayout } from '@/layouts';
import { SidebarContent } from '@/blocks';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';

export type PromotionItem = {
  id: string;
  title: string;
  description: string;
  validUntil?: string;
  image?: string;
  details?: string;
};

export interface PromotionsPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  promotions: { title?: string; subtitle?: string; items?: PromotionItem[] };
}

export function PromotionsPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  promotions,
}: PromotionsPageViewProps) {
  const items = promotions.items ?? [];
  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" data-class="promotions-section">
        <Block py="16" data-class="promotions-header">
          <If test="promotions.title" value={!!promotions.title}>
            <Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="promotions-title">
              <Var name="promotions.title" value={promotions.title} />
            </Text>
          </If>
          <If test="promotions.subtitle" value={!!promotions.subtitle}>
            <Text
              fontSize="lg"
              textColor="muted-foreground"
              textAlign="center"
              max="w-xl"
              mx="auto"
              data-class="promotions-subtitle"
            >
              <Var name="promotions.subtitle" value={promotions.subtitle} />
            </Text>
          </If>
        </Block>
        <Grid cols="1-2-3" gap="6" data-class="promotions-grid">
          <Loop each="items" as="item" data={items}>
            {(item: PromotionItem) => (
              <Card data-class="promotions-item-card">
                <CardHeader>
                  <CardTitle order={4} data-class="promotions-item-title">
                    <Var name="item.title" value={item.title} />
                  </CardTitle>
                  <CardDescription data-class="promotions-item-description">
                    <Var name="item.description" value={item.description} />
                  </CardDescription>
                  <If test="item.validUntil" value={!!item.validUntil}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="promotions-item-valid">
                      Valid until: <Var name="item.validUntil" value={item.validUntil} />
                    </Text>
                  </If>
                </CardHeader>
                <CardContent data-class="promotions-item-actions">
                  <DomainNavButton href={`/promotions/${item.id}`} size="sm" data-class="promotions-item-link">
                    View Details
                  </DomainNavButton>
                </CardContent>
              </Card>
            )}
          </Loop>
        </Grid>
      </Block>
    </MainLayout>
  );
}
