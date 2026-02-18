import type { ReactNode } from 'react';
import { Button } from '@ui8kit/core';

type DomainNavButtonProps = {
  href: string;
  children: ReactNode;
  [key: string]: unknown;
};

export function DomainNavButton({ href, children, ...buttonProps }: DomainNavButtonProps) {
  return (
    <Button href={href} {...(buttonProps as Record<string, unknown>)}>
      {children}
    </Button>
  );
}
