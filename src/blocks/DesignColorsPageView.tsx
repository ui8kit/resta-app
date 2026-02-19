import { Block, Stack, Title, Text, Grid } from '@ui8kit/core';

const BACKGROUND_TOKENS = [
  { id: 'background', label: 'background' },
  { id: 'card', label: 'card' },
  { id: 'popover', label: 'popover' },
  { id: 'muted', label: 'muted' },
  { id: 'accent', label: 'accent' },
];

const BRAND_TOKENS = [
  { id: 'primary', label: 'primary' },
  { id: 'secondary', label: 'secondary' },
  { id: 'destructive', label: 'destructive' },
  { id: 'border', label: 'border' },
  { id: 'input', label: 'input' },
  { id: 'ring', label: 'ring' },
];

const FOREGROUND_TOKENS = [
  { id: 'foreground', label: 'foreground' },
  { id: 'muted-foreground', label: 'muted-foreground' },
  { id: 'primary-foreground', label: 'primary-foreground' },
  { id: 'secondary-foreground', label: 'secondary-foreground' },
  { id: 'destructive-foreground', label: 'destructive-foreground' },
  { id: 'accent-foreground', label: 'accent-foreground' },
];

function ColorSwatch({ id, label }: { id: string; label: string }) {
  return (
    <Block data-class="design-colors-swatch">
      <Block
        bg={id as any}
        rounded="md"
        h="min-20"
        border=""
        data-class="design-colors-swatch-block"
        className="border border-border"
      />
      <Text fontSize="xs" textColor="muted-foreground" mt="2" data-class="design-colors-swatch-label">
        {label}
      </Text>
    </Block>
  );
}

export function DesignColorsPageView() {
  return (
    <Block component="section" py="8" data-class="design-colors-section">
      <Stack gap="8" max="w-4xl" mx="auto" px="4">
        <Title fontSize="2xl" fontWeight="bold" data-class="design-colors-title">
          Color Tokens
        </Title>
        <Block data-class="design-colors-background">
          <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="design-colors-group-title">
            Background
          </Text>
          <Grid cols="1-2-3" gap="4" data-class="design-colors-grid">
            {BACKGROUND_TOKENS.map((t) => (
              <ColorSwatch key={t.id} id={t.id} label={t.label} />
            ))}
          </Grid>
        </Block>
        <Block data-class="design-colors-brand">
          <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="design-colors-group-title">
            Brand
          </Text>
          <Grid cols="1-2-3" gap="4" data-class="design-colors-grid">
            {BRAND_TOKENS.map((t) => (
              <ColorSwatch key={t.id} id={t.id} label={t.label} />
            ))}
          </Grid>
        </Block>
        <Block data-class="design-colors-foreground">
          <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="design-colors-group-title">
            Foreground
          </Text>
          <Grid cols="1-2-3" gap="4" data-class="design-colors-grid">
            {FOREGROUND_TOKENS.map((t) => (
              <ColorSwatch key={t.id} id={t.id} label={t.label} />
            ))}
          </Grid>
        </Block>
      </Stack>
    </Block>
  );
}
