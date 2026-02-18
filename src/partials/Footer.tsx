import { Block, Container, Text } from '@ui8kit/core';
import { If, Var } from '@ui8kit/dsl';

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterSection = {
  title: string;
  links: FooterLink[];
};

export type FooterProps = {
  copyright?: string;
  sections?: FooterSection[];
  dataClass?: string;
  'data-class'?: string;
};

export function Footer({
  copyright = '© 2025 RestA. All rights reserved.',
  sections = [],
  dataClass,
  'data-class': dataClassAttr,
}: FooterProps) {
  return (
    <Block
      component="footer"
      py="8"
      border="t"
      bg="card"
      data-class={dataClass ?? dataClassAttr ?? 'footer'}
    >
      <Container
        flex=""
        justify="center"
        items="center"
        gap="8"
        data-class="footer-container"
      >
        <If test="copyright" value={!!(copyright ?? '')}>
          <Text fontSize="sm" textColor="muted-foreground" data-class="footer-copyright">
            <Var name="copyright" value={copyright ?? ''} />
          </Text>
        </If>
      </Container>
    </Block>
  );
}
