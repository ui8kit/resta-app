import type { MouseEventHandler, ReactNode } from 'react';
import { Button } from '@/components';

interface DomainNavButtonProps {
  href: string;
  children: ReactNode;
  variant?: string;
  size?: string;
  justify?: string;
  w?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  title?: string;
  ariaLabel?: string;
  dataClass?: string;
}

export function DomainNavButton(props: DomainNavButtonProps) {
  const { href, children, variant, size, justify, w, className, onClick, title, ariaLabel, dataClass } = props;

  return (
    <Button href={href} variant={variant as never} size={size as never} justify={justify as never} w={w as never} onClick={onClick as never} title={title} aria-label={ariaLabel} data-class={dataClass}>
      {children}
    </Button>
  );
}
