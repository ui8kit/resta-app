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

export interface TokensPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  section: DesignSectionFixture;
}

export function TokensPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  section,
}: TokensPageViewProps) {
  const items = section.items ?? [];

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" flex="col" gap="6" data-class="tokens-page-section">
        <Block component="header" flex="col" gap="2" data-class="tokens-page-header">
          <If test="section.title" value={!!section.title}>
            <CardTitle order={2} data-class="tokens-page-title">
              <Var name="section.title" value={section.title} />
            </CardTitle>
          </If>
          <If test="section.subtitle" value={!!section.subtitle}>
            <CardDescription data-class="tokens-page-subtitle">
              <Var name="section.subtitle" value={section.subtitle} />
            </CardDescription>
          </If>
        </Block>

        <Grid grid="cols-1" gap="4" data-class="tokens-page-grid">
          <Loop each="items" as="item" data={items}>
            {(item: DesignSectionItem) => (
              <Card data-class="tokens-item-card">
                <CardHeader>
                  <If test="item.title" value={!!item.title}>
                    <CardTitle order={4} data-class="tokens-item-title">
                      <Var name="item.title" value={item.title} />
                    </CardTitle>
                  </If>
                  <If test="item.description" value={!!item.description}>
                    <CardDescription data-class="tokens-item-description">
                      <Var name="item.description" value={item.description} />
                    </CardDescription>
                  </If>
                </CardHeader>
                <CardContent>
                  <If test="item.badge" value={!!item.badge}>
                    <Badge variant="outline" data-class="tokens-item-badge">
                      <Var name="item.badge" value={item.badge ?? ''} />
                    </Badge>
                  </If>
                  <If test="item.slug" value={!!item.slug}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="tokens-item-slug">
                      <Var name="item.slug" value={item.slug} />
                    </Text>
                  </If>
                </CardContent>
              </Card>
            )}
          </Loop>
        </Grid>
      </Block>
    </DesignLayout>
  );
}
