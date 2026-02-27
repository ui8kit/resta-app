import { DesignLayout } from '@/layouts';
import { Block, Stack, Title, Text, Grid } from '@ui8kit/core';
import { If, Var } from '@ui8kit/dsl';
import type { ColorsFixture, NavItem, SidebarLink } from '@/types';

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
          <Block flex="col" gap="2" data-class="design-colors-header">
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
          </Block>

          <Block data-class="design-colors-background">
            <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="design-colors-group-title">
              Background
            </Text>
            <Grid cols="1-2-3" gap="4" data-class="design-colors-grid">
              <Block data-class="design-colors-swatch">
                <Block bg="background" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">background</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="card" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">card</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="popover" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">popover</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="muted" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">muted</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="accent" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">accent</Text>
              </Block>
            </Grid>
          </Block>
          <Block data-class="design-colors-brand">
            <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="design-colors-group-title">
              Brand
            </Text>
            <Grid cols="1-2-3" gap="4" data-class="design-colors-grid">
              <Block data-class="design-colors-swatch">
                <Block bg="primary" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">primary</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="secondary" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">secondary</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="destructive" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">destructive</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="border" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">border</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="input" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">input</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="ring" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">ring</Text>
              </Block>
            </Grid>
          </Block>
          <Block data-class="design-colors-foreground">
            <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="design-colors-group-title">
              Foreground
            </Text>
            <Grid cols="1-2-3" gap="4" data-class="design-colors-grid">
              <Block data-class="design-colors-swatch">
                <Block bg="foreground" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">foreground</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="muted-foreground" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">muted-foreground</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="primary-foreground" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">primary-foreground</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="secondary-foreground" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">secondary-foreground</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="destructive-foreground" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">destructive-foreground</Text>
              </Block>
              <Block data-class="design-colors-swatch">
                <Block bg="accent-foreground" rounded="md" border="" className="border border-border h-20">{' '}</Block>
                <Text fontSize="xs" textColor="muted-foreground" mt="2">accent-foreground</Text>
              </Block>
            </Grid>
          </Block>
        </Stack>
      </Block>
    </DesignLayout>
  );
}
