import { Block, Stack } from '@ui8kit/core';

export function LandingPage() {
  return (
    <Block
      component="main"
      min="h-screen"
      flex=""
      items="center"
      justify="center"
      bg="background"
      text="foreground"
      data-class="landing-page"
    >
      <Stack gap="4" items="center" data-class="landing-content">
        <Block
          component="h1"
          text="2xl"
          font="bold"
          data-class="landing-title"
        >
          Welcome
        </Block>
      </Stack>
    </Block>
  );
}
