import { DesignLayout } from '@/layouts';
import {
  Block,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Text,
} from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import type { DesignSectionFixture, DesignSectionItem, NavItem, SidebarLink } from '@/types';

export interface WidgetsPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  section: DesignSectionFixture;
}

export function WidgetsPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  section,
}: WidgetsPageViewProps) {
  const items = section.items ?? [];

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" gap="6" data-class="widgets-page-section">
        <Block component="header" gap="2" data-class="widgets-page-header">
          <CardTitle order={2} data-class="widgets-page-title">
            <Var name="section.title" value={section.title} />
          </CardTitle>
          <CardDescription data-class="widgets-page-subtitle">
            <Var name="section.subtitle" value={section.subtitle} />
          </CardDescription>
        </Block>

        <Grid grid="cols-1" gap="4" data-class="widgets-page-grid">
          <Loop each="items" as="item" data={items}>
            {(item: DesignSectionItem) => (
              <Card data-class="widgets-item-card">
                <CardHeader>
                  <CardTitle order={4} data-class="widgets-item-title">
                    <Var name="item.title" value={item.title} />
                  </CardTitle>
                  <CardDescription data-class="widgets-item-description">
                    <Var name="item.description" value={item.description} />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <If test="item.badge" value={!!item.badge}>
                    <Badge variant="outline" data-class="widgets-item-badge">
                      <Var name="item.badge" value={item.badge ?? ''} />
                    </Badge>
                  </If>
                  <Text fontSize="sm" textColor="muted-foreground" data-class="widgets-item-slug">
                    <Var name="item.slug" value={item.slug} />
                  </Text>
                </CardContent>
              </Card>
            )}
          </Loop>
        </Grid>
      </Block>
    </DesignLayout>
  );
}
