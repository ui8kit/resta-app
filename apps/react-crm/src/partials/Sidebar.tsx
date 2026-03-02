import { Block, Stack } from '@/components';
import type { ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
  position?: 'left' | 'right';
}

export function Sidebar(props: SidebarProps) {
  const { children, position } = props;

  return (
    <Block component="aside" data-class={`sidebar sidebar-${position}`}>
      <Stack gap="6" w="full" items="stretch" data-class="sidebar-content">
        {children}
      </Stack>
    </Block>
  );
}
