import { Block, Stack, Container, Title, Text, Button, Group } from '@/components';

interface HeroBlockProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  children?: React.ReactNode;
}

export function HeroBlock(props: HeroBlockProps) {
  const { title, subtitle, ctaText, ctaUrl, secondaryCtaText, secondaryCtaUrl, children } = props;

  return (
    <Block component="section" py="16" bg="background" data-class="hero-section">
      <Container max="w-7xl" flex="col" gap="8" items="center">
        <Stack gap="4" items="center" max="w-2xl">
          {title ? (<><Title fontSize="5xl" fontWeight="bold" textAlign="center" data-class="hero-title">{title}</Title></>) : null}
          {subtitle ? (<><Text fontSize="xl" textColor="muted-foreground" textAlign="center" data-class="hero-subtitle">{subtitle}</Text></>) : null}
        </Stack>
        <Group gap="4" justify="center" items="center" data-class="hero-actions">
          {ctaText ? (<><Button size="lg" href={ctaUrl} data-class="hero-cta-primary">{ctaText}</Button></>) : null}
          {secondaryCtaText ? (<><Button variant="outline" size="lg" href={secondaryCtaUrl} data-class="hero-cta-secondary">{secondaryCtaText}</Button></>) : null}
        </Group>
        {children}
      </Container>
    </Block>
  );
}
