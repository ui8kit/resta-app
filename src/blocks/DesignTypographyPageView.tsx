import { Block, Stack, Title, Text, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@ui8kit/core';

const FONT_SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const;
const FONT_WEIGHTS = ['normal', 'medium', 'semibold', 'bold'] as const;
const LINE_HEIGHTS = ['tight', 'normal', 'relaxed'] as const;
const LETTER_SPACINGS = ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'] as const;

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog.';

export function DesignTypographyPageView() {
  return (
    <Block component="section" py="8" data-class="design-typography-section">
      <Stack gap="8" max="w-4xl" mx="auto" px="4">
        <Title fontSize="2xl" fontWeight="bold" data-class="design-typography-title">
          Typography
        </Title>

        <Card data-class="design-typography-card">
          <CardHeader>
            <CardTitle order={4}>Font sizes</CardTitle>
            <CardDescription>text-xs through text-5xl</CardDescription>
          </CardHeader>
          <CardContent>
            <Stack gap="2" data-class="design-typography-sizes">
              {FONT_SIZES.map((size) => (
                <Block key={size} data-class="design-typography-size-row">
                  <Text fontSize={size} data-class="design-typography-sample">
                    {size} — {SAMPLE_TEXT}
                  </Text>
                </Block>
              ))}
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
              {FONT_WEIGHTS.map((w) => (
                <Text key={w} fontSize="base" fontWeight={w} data-class="design-typography-weight-sample">
                  {w} — {SAMPLE_TEXT}
                </Text>
              ))}
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
              {LINE_HEIGHTS.map((lh) => (
                <Block key={lh} data-class="design-typography-lh-row">
                  <Text fontSize="xs" textColor="muted-foreground" mb="1">
                    {lh}
                  </Text>
                  <Text fontSize="base" lineHeight={lh} max="w-md" data-class="design-typography-lh-sample">
                    {SAMPLE_TEXT} {SAMPLE_TEXT} {SAMPLE_TEXT}
                  </Text>
                </Block>
              ))}
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
              {LETTER_SPACINGS.map((ls) => (
                <Text key={ls} fontSize="base" letterSpacing={ls} data-class="design-typography-ls-sample">
                  {ls} — {SAMPLE_TEXT}
                </Text>
              ))}
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
              {([1, 2, 3, 4, 5, 6] as const).map((order) => (
                <Title key={order} order={order} data-class="design-typography-title-sample">
                  Heading {order}
                </Title>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Block>
  );
}
