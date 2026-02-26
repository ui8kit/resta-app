import { DesignLayout } from '@/layouts';
import { Block, Stack, Title, Text, Grid } from '@ui8kit/core';
import { Loop, Var } from '@ui8kit/dsl';
import type { ColorsFixture, ColorTokenGroup, ColorToken, NavItem, SidebarLink } from '@/types';

export interface ColorsPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  colors: ColorsFixture;
}

function ColorSwatch({ id, label }: ColorToken) {
  return (
    <Block data-class="design-colors-swatch">
      <Block
        bg={id as never}
        rounded="md"
        min="h-20"
        border=""
        data-class="design-colors-swatch-block"
      >
        {' '}
      </Block>
      <Text fontSize="xs" textColor="muted-foreground" mt="2" data-class="design-colors-swatch-label">
        <Var name="label" value={label} />
      </Text>
    </Block>
  );
}

export function ColorsPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  colors,
}: ColorsPageViewProps) {
  const groups = colors.groups ?? [];

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" py="8" data-class="design-colors-section">
        <Stack gap="8" max="w-4xl" mx="auto" items="stretch" data-class="design-colors-stack">
          <Block flex="col" gap="2" data-class="design-colors-header">
            <Title fontSize="2xl" fontWeight="bold" data-class="design-colors-title">
              <Var name="colors.title" value={colors.title} />
            </Title>
            <Text fontSize="sm" textColor="muted-foreground" data-class="design-colors-subtitle">
              <Var name="colors.subtitle" value={colors.subtitle} />
            </Text>
          </Block>

          <Loop each="groups" as="group" data={groups}>
            {(group: ColorTokenGroup) => (
              <Block key={group.id} data-class="design-colors-group">
                <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="design-colors-group-title">
                  <Var name="group.label" value={group.label} />
                </Text>
                <Grid cols="1-2-3" gap="4" data-class="design-colors-grid">
                  <Loop each="group.tokens" as="t" data={group.tokens}>
                    {(t: ColorToken) => <ColorSwatch key={t.id} id={t.id} label={t.label} />}
                  </Loop>
                </Grid>
              </Block>
            )}
          </Loop>
        </Stack>
      </Block>
    </DesignLayout>
  );
}
