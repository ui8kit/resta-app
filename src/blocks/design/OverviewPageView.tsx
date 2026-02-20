import { Block, Stack, Title, Text, Card, CardHeader, CardTitle, CardDescription, CardContent, Grid } from '@ui8kit/core';
import { DomainNavButton } from '@/partials';

const SECTIONS = [
  { id: 'colors', title: 'Colors', description: 'Semantic color tokens and swatches.', href: '/design/colors' },
  { id: 'typography', title: 'Typography', description: 'Font sizes, weights, line heights, and Title scale.', href: '/design/typography' },
  { id: 'components', title: 'Components', description: 'Button, Badge, Field, Icon, and Card variants.', href: '/design/components' },
  { id: 'widgets', title: 'Widgets', description: 'Hero, menu cards grid, recipe card, promo, blog, Accordion, Sheet.', href: '/design/widgets' },
  { id: 'pages', title: 'Pages', description: 'Full page previews: menu, recipe, promotion detail.', href: '/design/pages' },
];

export function DesignOverviewPageView() {
  return (
    <Block component="section" py="8" data-class="design-overview-section">
      <Stack gap="8" max="w-4xl" mx="auto" px="4" items="stretch">
        <Stack gap="2" data-class="design-overview-header">
          <Title fontSize="2xl" fontWeight="bold" data-class="design-overview-title">
            Design System
          </Title>
          <Text fontSize="sm" textColor="muted-foreground" data-class="design-overview-intro">
            Visual reference for design tokens, primitives, components, and widgets from the restaurant site.
          </Text>
        </Stack>
        <Grid cols="1-2" gap="6" data-class="design-overview-grid">
          {SECTIONS.map((s) => (
            <Card key={s.id} data-class="design-overview-card">
              <CardHeader>
                <CardTitle order={4} data-class="design-overview-card-title">
                  {s.title}
                </CardTitle>
                <CardDescription data-class="design-overview-card-description">
                  {s.description}
                </CardDescription>
              </CardHeader>
              <CardContent data-class="design-overview-card-actions">
                <DomainNavButton href={s.href} size="sm" data-class="design-overview-card-link">
                  View
                </DomainNavButton>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Block>
  );
}
