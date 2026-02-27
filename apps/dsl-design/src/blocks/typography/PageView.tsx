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
import { If, Loop, Var } from '@ui8kit/dsl';
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
          <Stack flex="col" gap="2" data-class="design-typography-header">
            <If test="typographyScale.title" value={!!typographyScale.title}>
              <Title fontSize="2xl" fontWeight="bold" data-class="design-typography-title">
                <Var name="typographyScale.title" value={typographyScale.title} />
              </Title>
            </If>
            <If test="typographyScale.subtitle" value={!!typographyScale.subtitle}>
              <Text fontSize="sm" textColor="muted-foreground" data-class="design-typography-subtitle">
                <Var name="typographyScale.subtitle" value={typographyScale.subtitle} />
              </Text>
            </If>
          </Stack>

          <Card data-class="design-typography-card">
            <CardHeader>
              <CardTitle order={4}>Font sizes</CardTitle>
              <CardDescription>text-xs through text-5xl</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="2" data-class="design-typography-sizes">
                <Loop each="fontSizes" as="size" data={fontSizes}>
                  {(size) => (
                    <Stack data-class="design-typography-size-row">
                      <If test="size" value={!!size}>
                        <Text fontSize={size as never} data-class="design-typography-sample">
                          <Var name="size" value={size} /> — <Var name="sampleText" value={sampleText} />
                        </Text>
                      </If>
                    </Stack>
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
                    <If test="w" value={!!w}>
                      <Text fontSize="base" fontWeight={w as never} data-class="design-typography-weight-sample">
                        <Var name="w" value={w} /> — <Var name="sampleText" value={sampleText} />
                      </Text>
                    </If>
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
                    <Stack data-class="design-typography-lh-row">
                      <If test="lh" value={!!lh}>
                        <Text fontSize="xs" textColor="muted-foreground" mb="1">
                          <Var name="lh" value={lh} />
                        </Text>
                      </If>
                      <If test="sampleText" value={!!sampleText}>
                        <Text fontSize="base" lineHeight={lh as never} max="w-md" data-class="design-typography-lh-sample">
                          <Var name="sampleText" value={sampleText} /> <Var name="sampleText" value={sampleText} /> <Var name="sampleText" value={sampleText} />
                        </Text>
                      </If>
                    </Stack>
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
                    <If test="ls" value={!!ls}>
                      <Text fontSize="base" letterSpacing={ls as never} data-class="design-typography-ls-sample">
                        <Var name="ls" value={ls} /> — <Var name="sampleText" value={sampleText} />
                      </Text>
                    </If>
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
                    <If test="order" value={!!order}>
                      <>
                        <If test="order === 1" value={order === 1}>
                          <Title order={1} data-class="design-typography-title-sample">
                            Heading <Var name="order" value={String(order)} />
                          </Title>
                        </If>
                        <If test="order === 2" value={order === 2}>
                          <Title order={2} data-class="design-typography-title-sample">
                            Heading <Var name="order" value={String(order)} />
                          </Title>
                        </If>
                        <If test="order === 3" value={order === 3}>
                          <Title order={3} data-class="design-typography-title-sample">
                            Heading <Var name="order" value={String(order)} />
                          </Title>
                        </If>
                        <If test="order === 4" value={order === 4}>
                          <Title order={4} data-class="design-typography-title-sample">
                            Heading <Var name="order" value={String(order)} />
                          </Title>
                        </If>
                        <If test="order === 5" value={order === 5}>
                          <Title order={5} data-class="design-typography-title-sample">
                            Heading <Var name="order" value={String(order)} />
                          </Title>
                        </If>
                        <If test="order === 6" value={order === 6}>
                          <Title order={6} data-class="design-typography-title-sample">
                            Heading <Var name="order" value={String(order)} />
                          </Title>
                        </If>
                      </>
                    </If>
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
