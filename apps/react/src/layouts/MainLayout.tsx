import type { ComponentProps } from 'react';
import { MainLayoutView } from './views/MainLayoutView';
import type { LayoutMode } from '@/types';

export function MainLayout(props: ComponentProps<typeof MainLayoutView>) {
  return (
    <MainLayoutView {...props} />
  );
}
