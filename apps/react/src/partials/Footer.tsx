import { Block, Container, Text } from '@/components';
import type { FooterSection } from '@/types';

interface FooterProps {
  copyright?: string;
  sections?: FooterSection[];
  dataClass?: string;
  dataClassAttr?: string;
}

export function Footer(props: FooterProps) {
  const { copyright, sections, dataClass, dataClassAttr } = props;

  return (
    <Block component="footer" py="8" border="t" bg="card" data-class={dataClass ?? dataClassAttr ?? 'footer'}>
      <Container flex="" justify="center" items="center" gap="8" data-class="footer-container">
        {copyright ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="footer-copyright">{copyright}</Text></>) : null}
      </Container>
    </Block>
  );
}
