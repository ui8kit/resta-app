import type { ReactNode } from 'react';
import { Button } from '@/components';
import type { ButtonProps } from '@/components';

interface DomainNavButtonProps {
  href: any;
  children: any;
  dataClass: any;
}

export function DomainNavButton(props: DomainNavButtonProps) {
  const { href, children, dataClass, ...rest } = props;

  return (
    <Button href={href} data-class={dataClass}>
      {children}
    </Button>
  );
}
