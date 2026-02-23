import type { MouseEventHandler, ReactNode } from 'react';
import { Button } from '@ui8kit/core';

export type DomainNavButtonProps = {
  href: string;
  children: ReactNode;
  variant?: string;
  size?: string;
  justify?: string;
  w?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  title?: string;
  'aria-label'?: string;
  'data-class'?: string;
};

export function DomainNavButton({
  href,
  children,
  variant,
  size,
  justify,
  w,
  className,
  onClick,
  title,
  'aria-label': ariaLabel,
  'data-class': dataClass,
}: DomainNavButtonProps) {
  return (
    <Button
      href={href}
      variant={variant as never}
      size={size as never}
      justify={justify as never}
      w={w as never}
      className={className}
      onClick={onClick as never}
      title={title}
      aria-label={ariaLabel}
      data-class={dataClass}
    >
      {children}
    </Button>
  );
}
