import type { ComponentProps } from 'react';
import { MainLayoutView } from './views/MainLayoutView';

export type MainLayoutProps = ComponentProps<typeof MainLayoutView>;
export type LayoutMode = 'full' | 'with-sidebar' | 'sidebar-left';

export function MainLayout(props: MainLayoutProps) {
  return <MainLayoutView {...props} />;
}
