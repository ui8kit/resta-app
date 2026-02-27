import type { ReactNode } from 'react';
import { Button } from '@ui8kit/core';
import type { ButtonProps } from '@/components';

export type DomainNavButtonProps = Omit<ButtonProps, 'href' | 'children' | 'data-class'> & {
  href: string;
  children: ReactNode;
  'data-class'?: string;
};

export function DomainNavButton({
  href,
  children,
  'data-class': dataClass,
  ...rest
}: DomainNavButtonProps) {
  return (
    <Button
      href={href}
      data-class={dataClass}
      {...rest}
    >
      {children}
    </Button>
  );
}
