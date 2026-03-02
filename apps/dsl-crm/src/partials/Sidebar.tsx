import { Block, Stack } from '@ui8kit/core';
import type { ReactNode } from 'react';
import type { UtilityPropBag } from '@/lib/utility-props';

export type SidebarProps = {
  children: ReactNode;
  position?: 'left' | 'right';
  'data-class'?: string;
  className?: string;
} & UtilityPropBag;

export function Sidebar({
  children,
  position = 'right',
  className,
  'data-class': dataClassProp,
  ...layoutProps
}: SidebarProps) {
  const dataClass = dataClassProp ?? `sidebar sidebar-${position}`;
  return (
    <Block
      component="aside"
      data-class={dataClass}
      className={className}
      {...layoutProps}
    >
      <Stack gap="6" w="full" items="stretch" data-class="sidebar-content">
        {children}
      </Stack>
    </Block>
  );
}
