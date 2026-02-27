import { useState } from 'react';
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
  Badge,
  Group,
  Button,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Sheet,
  Toast,
} from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import { HeroBlock } from '@/blocks/HeroBlock';
import { DomainNavButton } from '@/partials';
import type { WidgetsDemoFixture, NavItem, SidebarLink } from '@/types';

export interface WidgetsPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  widgetsDemo: WidgetsDemoFixture;
}

export function WidgetsPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  widgetsDemo,
}: WidgetsPageViewProps) {
  const [showToast, setShowToast] = useState(false);
  const { hero, menuItems, accordionItems } = widgetsDemo;

  function handleOrderClick(e: React.MouseEvent) {
    e.preventDefault();
    setShowToast(true);
  }

  function handleCloseToast() {
    setShowToast(false);
  }

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" py="8" data-class="design-widgets-section">
        <Stack gap="8" max="w-4xl" mx="auto" items="stretch" data-class="design-widgets-stack">
          <Title fontSize="2xl" fontWeight="bold" data-class="design-widgets-title">
            Widgets
          </Title>

          <Block data-class="design-widgets-hero">
            <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
              Hero
            </Text>
            <HeroBlock
              title={hero.title}
              subtitle={hero.subtitle}
              ctaText={hero.ctaText}
              ctaUrl={hero.ctaUrl}
              secondaryCtaText={hero.secondaryCtaText}
              secondaryCtaUrl={hero.secondaryCtaUrl}
            />
          </Block>

          <Block data-class="design-widgets-menu-cards">
            <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
              Menu cards
            </Text>
            <Grid cols="1-2-3" gap="4">
              <Loop each="menuItems" as="item" data={menuItems}>
                {(item) => (
                  <Card max="w-sm" data-class="design-widget-menu-card">
                    <CardHeader>
                      <If test="item.promotionIds.length" value={!!item.promotionIds?.length}>
                        <Badge variant="outline" mb="2">
                          -15%
                        </Badge>
                      </If>
                      <If test="item.category.title" value={!!item.category?.title}>
                        <Text fontSize="xs" textColor="muted-foreground">
                          <Var name="item.category.title" value={item.category?.title} />
                        </Text>
                      </If>
                      <If test="item.title" value={!!item.title}>
                        <CardTitle order={4}><Var name="item.title" value={item.title} /></CardTitle>
                      </If>
                      <If test="item.description" value={!!item.description}>
                        <CardDescription><Var name="item.description" value={item.description} /></CardDescription>
                      </If>
                      <Group items="baseline" gap="2" mt="2">
                        <If test="item.price.display" value={!!item.price?.display}>
                          <Text fontSize="lg" fontWeight="semibold" textColor="primary">
                            <Var name="item.price.display" value={item.price?.display} />
                          </Text>
                        </If>
                        <If test="item.compareAtPrice.display" value={!!item.compareAtPrice?.display}>
                          <Text fontSize="sm" textColor="muted-foreground">
                            <Var name="item.compareAtPrice.display" value={item.compareAtPrice?.display} />
                          </Text>
                        </If>
                      </Group>
                    </CardHeader>
                    <CardContent>
                      <Group gap="2" flex="wrap">
                        <Loop each="item.variants" as="v" data={item.variants ?? []}>
                          {(v) => (
                            <Button variant="outline" size="sm">
                              <If test="v.title" value={!!v.title}>
                                <Text component="span"><Var name="v.title" value={v.title} /></Text>
                              </If>
                              <If test="v.priceModifier.display" value={!!v.priceModifier?.display}>
                                <Text component="span" fontSize="sm"><Var name="v.priceModifier.display" value={v.priceModifier?.display} /></Text>
                              </If>
                            </Button>
                          )}
                        </Loop>
                      </Group>
                      <Block mt="2">
                        <DomainNavButton href="#" size="sm" onClick={handleOrderClick}>
                          View / Order
                        </DomainNavButton>
                      </Block>
                    </CardContent>
                  </Card>
                )}
              </Loop>
            </Grid>
          </Block>

          <Block data-class="design-widgets-menu-card">
            <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
              Menu item card (single)
            </Text>
            <Card max="w-sm" data-class="design-widget-menu-card">
              <CardHeader>
                <Group items="center" gap="2" mb="1">
                  <Badge variant="outline">-15%</Badge>
                  <Text fontSize="xs" textColor="muted-foreground">Grill</Text>
                </Group>
                <CardTitle order={4}>Salmon Steak on the Grill</CardTitle>
                <CardDescription>Atlantic salmon, herb butter, lemon.</CardDescription>
                <Group items="baseline" gap="2" mt="2">
                  <Text fontSize="lg" fontWeight="semibold" textColor="primary">890 ₽</Text>
                  <Text fontSize="sm" textColor="muted-foreground">990 ₽</Text>
                </Group>
              </CardHeader>
              <CardContent>
                <Group gap="2" flex="wrap">
                  <Button variant="outline" size="sm">200g</Button>
                  <Button variant="outline" size="sm">300g +200 ₽</Button>
                </Group>
                <Block mt="2">
                  <DomainNavButton href="#" size="sm" onClick={handleOrderClick}>
                    View / Order
                  </DomainNavButton>
                </Block>
              </CardContent>
            </Card>
          </Block>

          <Block data-class="design-widgets-recipe-card">
            <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
              Recipe card
            </Text>
            <Card max="w-sm" data-class="design-widget-recipe-card">
              <CardHeader>
                <Group items="center" gap="2" mb="1">
                  <Badge variant="outline">medium</Badge>
                  <Text fontSize="xs" textColor="muted-foreground">Grill</Text>
                </Group>
                <CardTitle order={4}>Salmon Steak on the Grill at Home</CardTitle>
                <CardDescription>Replicate our grill salmon method in 25 minutes.</CardDescription>
                <Text fontSize="sm" textColor="muted-foreground" mt="1">
                  25 min · 2 servings
                </Text>
              </CardHeader>
              <CardContent>
                <DomainNavButton href="#" size="sm" onClick={handleOrderClick}>
                  View Recipe
                </DomainNavButton>
              </CardContent>
            </Card>
          </Block>

          <Block data-class="design-widgets-promo-card">
            <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
              Promotion card
            </Text>
            <Card max="w-sm" data-class="design-widget-promo-card">
              <CardHeader>
                <Badge variant="outline" mb="2">-15%</Badge>
                <CardTitle order={4}>Happy Hour Grill</CardTitle>
                <CardDescription>15% off grill items, Mon–Fri 11:00–13:00.</CardDescription>
                <Text fontSize="xs" textColor="muted-foreground" mt="1">
                  percentage · categoryIds: grill
                </Text>
              </CardHeader>
              <CardContent>
                <DomainNavButton href="#" size="sm" onClick={handleOrderClick}>
                  View Promotion
                </DomainNavButton>
              </CardContent>
            </Card>
          </Block>

          <Block data-class="design-widgets-blog-card">
            <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
              Blog post card
            </Text>
            <Card max="w-sm" data-class="design-widget-blog-card">
              <CardHeader>
                <CardTitle order={4}>Classic Tiramisu at Home</CardTitle>
                <CardDescription>Authentic Italian tiramisu recipe.</CardDescription>
                <Text fontSize="xs" textColor="muted-foreground" mt="1">
                  Jan 28, 2025 · Chef Maria
                </Text>
              </CardHeader>
              <CardContent>
                <DomainNavButton href="#" size="sm" onClick={handleOrderClick}>
                  Read More
                </DomainNavButton>
              </CardContent>
            </Card>
          </Block>

          <Block data-class="design-widgets-accordion">
            <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
              Accordion
            </Text>
            <Accordion type="single" collapsible defaultValue="faq-1" max="w-md">
              <Loop each="accordionItems" as="item" data={accordionItems}>
                {(item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger>
                        <If test="item.trigger" value={!!item.trigger}>
                          <Text component="span"><Var name="item.trigger" value={item.trigger} /></Text>
                        </If>
                      </AccordionTrigger>
                      <AccordionContent>
                        <If test="item.content" value={!!item.content}>
                          <Text fontSize="sm" textColor="muted-foreground">
                            <Var name="item.content" value={item.content} />
                          </Text>
                        </If>
                      </AccordionContent>
                    </AccordionItem>
                )}
              </Loop>
            </Accordion>
          </Block>

          <Block data-class="design-widgets-sheet">
            <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
              Sheet
            </Text>
            <Sheet id="design-sheet" title="Design Panel" showTrigger triggerVariant="outline" triggerSize="sm">
              <Stack gap="4" data-class="design-sheet-content">
                <Text fontSize="sm" textColor="muted-foreground">
                  Sheet overlay content. Click the trigger to open.
                </Text>
              </Stack>
            </Sheet>
          </Block>

          <Toast visible={showToast} onClose={handleCloseToast} duration={9000} />
        </Stack>
      </Block>
    </DesignLayout>
  );
}
