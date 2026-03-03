import type { ReactNode } from 'react';
import { Button } from '@/components';
import type { ButtonProps } from '@/components';

type AnchorButtonProps = Extract<ButtonProps, { href: string }>;

export type DomainNavButtonProps = Omit<AnchorButtonProps, 'children' | 'data-class'> & {
  children: ReactNode;
  'data-class'?: string;
};

export function DomainNavButton({ href, children, 'data-class': dataClass, ...rest }: DomainNavButtonProps) {
  return (
    <Button href={href} data-class={dataClass} {...rest}>
      {children}
    </Button>
  );
}
