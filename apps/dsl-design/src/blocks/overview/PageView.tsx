import { DesignLayout } from '@/layouts';
import {
  Block,
  Stack,
  Title,
  Text,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Grid,
} from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';
import type { OverviewFixture, NavItem, SidebarLink } from '@/types';

export interface OverviewPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  overview: OverviewFixture;
}

export function OverviewPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  overview,
}: OverviewPageViewProps) {
  const sections = overview.sections ?? [];

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" py="8" data-class="design-overview-section">
        <Stack gap="8" max="w-4xl" mx="auto" items="stretch" data-class="design-overview-stack">
          <Stack gap="2" data-class="design-overview-header">
            <Title fontSize="2xl" fontWeight="bold" data-class="design-overview-title">
              <Var name="overview.title" value={overview.title} />
            </Title>
            <If test="overview.intro" value={!!overview.intro}>
              <Text fontSize="sm" textColor="muted-foreground" data-class="design-overview-intro">
                <Var name="overview.intro" value={overview.intro} />
              </Text>
            </If>
          </Stack>

          <Grid cols="1-2" gap="6" data-class="design-overview-grid">
            <Loop each="sections" as="s" data={sections}>
              {(s) => (
                <Card data-class="design-overview-card">
                  <CardHeader>
                    <CardTitle order={4} data-class="design-overview-card-title">
                      <Var name="s.title" value={s.title} />
                    </CardTitle>
                    <CardDescription data-class="design-overview-card-description">
                      <Var name="s.description" value={s.description} />
                    </CardDescription>
                  </CardHeader>
                  <CardContent data-class="design-overview-card-actions">
                    <DomainNavButton
                      href={s.href}
                      size="sm"
                      variant="outline"
                      data-class="design-overview-card-link"
                    >
                      View
                    </DomainNavButton>
                  </CardContent>
                </Card>
              )}
            </Loop>
          </Grid>
        </Stack>
      </Block>
    </DesignLayout>
  );
}
