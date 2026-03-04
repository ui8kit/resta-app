import { Button } from '@ui8kit/core';
import type { DomainNavButtonProps } from '@/types';

export function DomainNavButton({ href, children, 'data-class': dataClass, ...rest }: DomainNavButtonProps) {
  return (
    <Button href={href} data-class={dataClass} {...rest}>
      {children}
    </Button>
  );
}
