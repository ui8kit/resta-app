import { Block, Stack, Container, Title, Text, Button, Group } from '@ui8kit/core';
import { If, Var, Slot } from '@ui8kit/dsl';

export interface HeroBlockProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  backgroundImage?: string;
  children?: React.ReactNode;
}

export function HeroBlock({
  title,
  subtitle,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
  children,
}: HeroBlockProps) {
  return (
    <Block
      component="section"
      py="16"
      bg="background"
      data-class="hero-section"
    >
      <Container max="w-7xl" flex="col" gap="8" items="center">
        <Stack gap="4" items="center" max="w-2xl">
            <Title
              fontSize="5xl"
              fontWeight="bold"
              textAlign="center"
              data-class="hero-title"
            >
              <Var name="title" value={title} />
            </Title>

            <If test="subtitle" value={!!subtitle}>
              <Text
                fontSize="xl"
                textColor="muted-foreground"
                textAlign="center"
                data-class="hero-subtitle"
              >
                <Var name="subtitle" value={subtitle} />
              </Text>
            </If>
        </Stack>

        <Group gap="4" justify="center" items="center" data-class="hero-actions">
            <If test="ctaText" value={!!ctaText}>
              <Button
                size="lg"
                href={ctaUrl}
                data-class="hero-cta-primary"
              >
                <Var name="ctaText" value={ctaText} />
              </Button>
            </If>

            <If test="secondaryCtaText" value={!!secondaryCtaText}>
              <Button
                variant="outline"
                size="lg"
                href={secondaryCtaUrl}
                data-class="hero-cta-secondary"
              >
                <Var name="secondaryCtaText" value={secondaryCtaText} />
              </Button>
            </If>
        </Group>

        <Slot name="extra">
          {children}
        </Slot>
      </Container>
    </Block>
  );
}
