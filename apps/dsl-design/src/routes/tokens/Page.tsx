import { TokensPageView } from '@/blocks';
import { context } from '@/data/context';

export function TokensPage() {
  return (
    <TokensPageView
      navItems={context.navItems}
      sidebarLinks={context.sidebarLinks}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      section={context.tokens}
    />
  );
}
