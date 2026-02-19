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
} from '@ui8kit/core';
import { HeroBlock } from './HeroBlock';
import { DomainNavButton } from '@/partials';
import { context } from '@/data/context';

export function DesignWidgetsPageView() {
  return (
    <Block component="section" py="8" data-class="design-widgets-section">
      <Stack gap="8" max="w-4xl" mx="auto" px="4" items="stretch">
        <Title fontSize="2xl" fontWeight="bold" data-class="design-widgets-title">
          Widgets
        </Title>

        <Block data-class="design-widgets-hero">
          <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
            Hero
          </Text>
          <HeroBlock
            title="Welcome"
            subtitle="A reduced hero block for design reference."
            ctaText="Get Started"
            ctaUrl="/"
            secondaryCtaText="Learn More"
            secondaryCtaUrl="/design"
          />
        </Block>

        <Block data-class="design-widgets-menu-cards">
          <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
            Menu cards
          </Text>
          <Grid cols="1-2-3" gap="4">
            {(context.menu.items?.slice(0, 3) ?? []).map((item) => (
              <Card key={item.id} data-class="design-widget-menu-card" max="w-sm">
                <CardHeader>
                  {item.promotionIds?.length ? (
                    <Badge variant="outline" mb="2">
                      -15%
                    </Badge>
                  ) : null}
                  <Text fontSize="xs" textColor="muted-foreground">
                    {item.category?.title}
                  </Text>
                  <CardTitle order={4}>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                  <Group items="baseline" gap="2" mt="2">
                    <Text fontSize="lg" fontWeight="semibold" textColor="primary">
                      {item.price?.display}
                    </Text>
                    {item.compareAtPrice?.display && (
                      <Text fontSize="sm" textColor="muted-foreground" textDecoration="line-through">
                        {item.compareAtPrice.display}
                      </Text>
                    )}
                  </Group>
                </CardHeader>
                <CardContent>
                  <Group gap="2" wrap="">
                    {item.variants?.slice(0, 2).map((v) => (
                      <Button key={v.id} variant="outline" size="sm">
                        {v.title}
                        {v.priceModifier?.display ? ` ${v.priceModifier.display}` : ''}
                      </Button>
                    ))}
                  </Group>
                  <DomainNavButton href="#" size="sm" mt="2">
                    View / Order
                  </DomainNavButton>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Block>

        <Block data-class="design-widgets-menu-card">
          <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
            Menu item card (single)
          </Text>
          <Card data-class="design-widget-menu-card" max="w-sm">
            <CardHeader>
              <Group items="center" gap="2" mb="1">
                <Badge variant="outline" data-class="design-widget-menu-badge">
                  -15%
                </Badge>
                <Text fontSize="xs" textColor="muted-foreground">
                  Grill
                </Text>
              </Group>
              <CardTitle order={4}>Salmon Steak on the Grill</CardTitle>
              <CardDescription>Atlantic salmon, herb butter, lemon.</CardDescription>
              <Group items="baseline" gap="2" mt="2">
                <Text fontSize="lg" fontWeight="semibold" textColor="primary">
                  890 ₽
                </Text>
                <Text fontSize="sm" textColor="muted-foreground" textDecoration="line-through">
                  990 ₽
                </Text>
              </Group>
            </CardHeader>
            <CardContent>
              <Group gap="2" wrap="">
                <Button variant="outline" size="sm">
                  200g
                </Button>
                <Button variant="outline" size="sm">
                  300g +200 ₽
                </Button>
              </Group>
              <DomainNavButton href="#" size="sm" mt="2">
                View / Order
              </DomainNavButton>
            </CardContent>
          </Card>
        </Block>

        <Block data-class="design-widgets-recipe-card">
          <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
            Recipe card
          </Text>
          <Card data-class="design-widget-recipe-card" max="w-sm">
            <CardHeader>
              <Group items="center" gap="2" mb="1">
                <Badge variant="outline">medium</Badge>
                <Text fontSize="xs" textColor="muted-foreground">
                  Grill
                </Text>
              </Group>
              <CardTitle order={4}>Salmon Steak on the Grill at Home</CardTitle>
              <CardDescription>Replicate our grill salmon method in 25 minutes.</CardDescription>
              <Text fontSize="sm" textColor="muted-foreground" mt="1">
                25 min · 2 servings
              </Text>
            </CardHeader>
            <CardContent>
              <DomainNavButton href="#" size="sm">
                View Recipe
              </DomainNavButton>
            </CardContent>
          </Card>
        </Block>

        <Block data-class="design-widgets-promo-card">
          <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
            Promotion card
          </Text>
          <Card data-class="design-widget-promo-card" max="w-sm">
            <CardHeader>
              <Badge variant="outline" mb="2">
                -15%
              </Badge>
              <CardTitle order={4}>Happy Hour Grill</CardTitle>
              <CardDescription>15% off grill items, Mon–Fri 11:00–13:00.</CardDescription>
              <Text fontSize="xs" textColor="muted-foreground" mt="1">
                percentage · categoryIds: grill
              </Text>
            </CardHeader>
            <CardContent>
              <DomainNavButton href="#" size="sm">
                View Promotion
              </DomainNavButton>
            </CardContent>
          </Card>
        </Block>

        <Block data-class="design-widgets-blog-card">
          <Text fontSize="sm" fontWeight="semibold" mb="2" textColor="muted-foreground">
            Blog post card
          </Text>
          <Card data-class="design-widget-blog-card" max="w-sm">
            <CardHeader>
              <CardTitle order={4}>Classic Tiramisu at Home</CardTitle>
              <CardDescription>Authentic Italian tiramisu recipe.</CardDescription>
              <Text fontSize="xs" textColor="muted-foreground" mt="1">
                Jan 28, 2025 · Chef Maria
              </Text>
            </CardHeader>
            <CardContent>
              <DomainNavButton href="#" size="sm">
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
            <AccordionItem value="faq-1">
              <AccordionTrigger>What are your delivery hours?</AccordionTrigger>
              <AccordionContent>
                <Text fontSize="sm" textColor="muted-foreground">
                  We deliver Mon–Sun from 11:00 to 23:00.
                </Text>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger>Do you offer vegetarian options?</AccordionTrigger>
              <AccordionContent>
                <Text fontSize="sm" textColor="muted-foreground">
                  Yes, we have salads, sides, and several main courses.
                </Text>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger>How can I apply a promo code?</AccordionTrigger>
              <AccordionContent>
                <Text fontSize="sm" textColor="muted-foreground">
                  Enter the code at checkout. Some promos apply automatically.
                </Text>
              </AccordionContent>
            </AccordionItem>
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
      </Stack>
    </Block>
  );
}
