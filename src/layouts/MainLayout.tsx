import type { ComponentProps } from 'react';
import { MainLayoutView } from './views/MainLayoutView';
import type { LayoutMode } from '@/types';

export type MainLayoutProps = ComponentProps<typeof MainLayoutView>;
export type { LayoutMode };

export function MainLayout(props: MainLayoutProps) {
  return <MainLayoutView {...props} />;
}
