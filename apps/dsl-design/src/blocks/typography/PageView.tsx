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
} from '@ui8kit/core';
import { Loop, Var } from '@ui8kit/dsl';
import type { TypographyScaleFixture, NavItem, SidebarLink } from '@/types';

export interface TypographyPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  typographyScale: TypographyScaleFixture;
}

export function TypographyPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  typographyScale,
}: TypographyPageViewProps) {
  const {
    sampleText,
    fontSizes,
    fontWeights,
    lineHeights,
    letterSpacings,
    titleOrders,
  } = typographyScale;

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" py="8" data-class="design-typography-section">
        <Stack gap="8" max="w-4xl" mx="auto" items="stretch" data-class="design-typography-stack">
          <Block flex="col" gap="2" data-class="design-typography-header">
            <Title fontSize="2xl" fontWeight="bold" data-class="design-typography-title">
              <Var name="typographyScale.title" value={typographyScale.title} />
            </Title>
            <Text fontSize="sm" textColor="muted-foreground" data-class="design-typography-subtitle">
              <Var name="typographyScale.subtitle" value={typographyScale.subtitle} />
            </Text>
          </Block>

          <Card data-class="design-typography-card">
            <CardHeader>
              <CardTitle order={4}>Font sizes</CardTitle>
              <CardDescription>text-xs through text-5xl</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="2" data-class="design-typography-sizes">
                <Loop each="fontSizes" as="size" data={fontSizes}>
                  {(size) => (
                    <Block data-class="design-typography-size-row">
                      <Text fontSize={size as never} data-class="design-typography-sample">
                        <Var name="size" value={size} /> — <Var name="sampleText" value={sampleText} />
                      </Text>
                    </Block>
                  )}
                </Loop>
              </Stack>
            </CardContent>
          </Card>

          <Card data-class="design-typography-card">
            <CardHeader>
              <CardTitle order={4}>Font weights</CardTitle>
              <CardDescription>normal, medium, semibold, bold</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="2" data-class="design-typography-weights">
                <Loop each="fontWeights" as="w" data={fontWeights}>
                  {(w) => (
                    <Text fontSize="base" fontWeight={w as never} data-class="design-typography-weight-sample">
                      <Var name="w" value={w} /> — <Var name="sampleText" value={sampleText} />
                    </Text>
                  )}
                </Loop>
              </Stack>
            </CardContent>
          </Card>

          <Card data-class="design-typography-card">
            <CardHeader>
              <CardTitle order={4}>Line heights</CardTitle>
              <CardDescription>tight, normal, relaxed</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="4" data-class="design-typography-line-heights">
                <Loop each="lineHeights" as="lh" data={lineHeights}>
                  {(lh) => (
                    <Block data-class="design-typography-lh-row">
                      <Text fontSize="xs" textColor="muted-foreground" mb="1">
                        <Var name="lh" value={lh} />
                      </Text>
                      <Text fontSize="base" lineHeight={lh as never} max="w-md" data-class="design-typography-lh-sample">
                        <Var name="sampleText" value={sampleText} /> <Var name="sampleText" value={sampleText} /> <Var name="sampleText" value={sampleText} />
                      </Text>
                    </Block>
                  )}
                </Loop>
              </Stack>
            </CardContent>
          </Card>

          <Card data-class="design-typography-card">
            <CardHeader>
              <CardTitle order={4}>Letter spacing</CardTitle>
              <CardDescription>tighter through widest</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="2" data-class="design-typography-letter-spacing">
                <Loop each="letterSpacings" as="ls" data={letterSpacings}>
                  {(ls) => (
                    <Text fontSize="base" letterSpacing={ls as never} data-class="design-typography-ls-sample">
                      <Var name="ls" value={ls} /> — <Var name="sampleText" value={sampleText} />
                    </Text>
                  )}
                </Loop>
              </Stack>
            </CardContent>
          </Card>

          <Card data-class="design-typography-card">
            <CardHeader>
              <CardTitle order={4}>Title scale</CardTitle>
              <CardDescription>Title component order 1–6</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="2" data-class="design-typography-title-scale">
                <Loop each="titleOrders" as="order" data={titleOrders}>
                  {(order) => (
                    <Title order={order as 1 | 2 | 3 | 4 | 5 | 6} data-class="design-typography-title-sample">
                      Heading <Var name="order" value={String(order)} />
                    </Title>
                  )}
                </Loop>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Block>
    </DesignLayout>
  );
}
