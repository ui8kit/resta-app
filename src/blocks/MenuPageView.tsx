import { MainLayout } from '@/layouts';
import { SidebarContent } from '@/blocks';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';

export type MenuItem = {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  image?: string;
  details?: string;
};

export interface MenuPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  menu: { title?: string; subtitle?: string; items?: MenuItem[] };
}

export function MenuPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  menu,
}: MenuPageViewProps) {
  const items = menu.items ?? [];
  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" data-class="menu-section">
        <Block py="16" data-class="menu-header">
          <If test="menu.title" value={!!menu.title}>
            <Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="menu-title">
              <Var name="menu.title" value={menu.title} />
            </Text>
          </If>
          <If test="menu.subtitle" value={!!menu.subtitle}>
            <Text
              fontSize="lg"
              textColor="muted-foreground"
              textAlign="center"
              max="w-xl"
              mx="auto"
              data-class="menu-subtitle"
            >
              <Var name="menu.subtitle" value={menu.subtitle} />
            </Text>
          </If>
        </Block>
        <Grid cols="1-2-3" gap="6" data-class="menu-grid">
          <Loop each="items" as="item" data={items}>
            {(item: MenuItem) => (
              <Card data-class="menu-item-card">
                <CardHeader>
                  <CardTitle order={4} data-class="menu-item-title">
                    <Var name="item.title" value={item.title} />
                  </CardTitle>
                  <CardDescription data-class="menu-item-description">
                    <Var name="item.description" value={item.description} />
                  </CardDescription>
                </CardHeader>
                <CardContent flex="" justify="between" items="center" gap="4" data-class="menu-item-footer">
                  <Text fontSize="lg" fontWeight="semibold" textColor="primary" data-class="menu-item-price">
                    <Var name="item.price" value={item.price} />
                  </Text>
                  <DomainNavButton href={`/menu/${item.id}`} size="sm" data-class="menu-item-link">
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
