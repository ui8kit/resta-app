import type { ReactNode } from 'react';
import { Block, Stack } from '@ui8kit/core';

export interface SidebarProps {
  children: ReactNode;
  position?: 'left' | 'right';
}

export function Sidebar({ children, position = 'left' }: SidebarProps) {
  return (
    <Block
      component="aside"
      data-class={`design-sidebar design-sidebar-${position}`}
    >
      <Stack gap="6" w="full" items="stretch" data-class="design-sidebar-content">
        {children}
      </Stack>
    </Block>
  );
}
