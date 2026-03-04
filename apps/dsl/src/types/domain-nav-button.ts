import type { ReactNode } from 'react';
import type { ButtonProps } from '@/components';

export type AnchorButtonProps = Extract<ButtonProps, { href: string }>;

export type DomainNavButtonProps = Omit<AnchorButtonProps, 'children' | 'data-class'> & {
  children: ReactNode;
  'data-class'?: string;
};
