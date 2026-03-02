import type { ReactNode } from 'react';
import { Button } from '@ui8kit/core';

export interface DomainNavButtonProps {
  href: string;
  children: ReactNode;
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'default' | 'md' | 'lg' | 'xl' | 'icon';
  title?: string;
  'aria-label'?: string;
  className?: string;
  onClick?: () => void;
  'data-class'?: string;
}

export function DomainNavButton({
  href,
  children,
  variant,
  size,
  title,
  'aria-label': ariaLabel,
  className,
  onClick,
  'data-class': dataClass,
}: DomainNavButtonProps) {
  return (
    <Button
      href={href}
      variant={variant}
      size={size}
      title={title}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      data-class={dataClass}
    >
      {children}
    </Button>
  );
}
