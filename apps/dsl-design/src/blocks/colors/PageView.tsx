import { DesignLayout } from '@/layouts';
import { Block, Stack, Title, Text, Grid } from '@ui8kit/core';
import { ColorTokenSwatch } from '@/components';
import { If, Loop, Var } from '@ui8kit/dsl';
import type { ColorsFixture, ColorTokenGroup, ColorToken, NavItem, SidebarLink } from '@/types';

export interface ColorsPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  colors: ColorsFixture;
}

export function ColorsPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  colors,
}: ColorsPageViewProps) {
  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" py="8" data-class="design-colors-section">
        <Stack gap="8" max="w-4xl" mx="auto" items="stretch" data-class="design-colors-stack">
          <Stack flex="col" gap="2" data-class="design-colors-header">
            <If test="colors.title" value={!!colors.title}>
              <Title fontSize="2xl" fontWeight="bold" data-class="design-colors-title">
                <Var name="colors.title" value={colors.title} />
              </Title>
            </If>
            <If test="colors.subtitle" value={!!colors.subtitle}>
              <Text fontSize="sm" textColor="muted-foreground" data-class="design-colors-subtitle">
                <Var name="colors.subtitle" value={colors.subtitle} />
              </Text>
            </If>
          </Stack>

          <Loop each="groups" as="group" data={colors.groups}>
            {(group: ColorTokenGroup) => (
              <Stack key={group.id} data-class="design-colors-group">
                <If test="group.label" value={!!group.label}>
                  <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="design-colors-group-title">
                    <Var name="group.label" value={group.label} />
                  </Text>
                </If>
                <Grid cols="1-2-3" gap="4" data-class="design-colors-grid">
                  <Loop each="group.tokens" as="t" data={group.tokens}>
                    {(t: ColorToken) => (
                      <Stack key={t.id} items="stretch" data-class="design-colors-swatch">
                        <ColorTokenSwatch tokenId={t.id} className="border border-border h-20" />
                        <If test="t.label" value={!!t.label}>
                          <Text fontSize="xs" textColor="muted-foreground" mt="2">
                            <Var name="t.label" value={t.label} />
                          </Text>
                        </If>
                      </Stack>
                    )}
                  </Loop>
                </Grid>
              </Stack>
            )}
          </Loop>
        </Stack>
      </Block>
    </DesignLayout>
  );
}
