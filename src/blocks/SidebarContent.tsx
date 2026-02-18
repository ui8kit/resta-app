import { Stack, Text } from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';

export type SidebarLink = {
  label: string;
  href: string;
};

export type SidebarContentProps = {
  title?: string;
  links?: SidebarLink[];
  'data-class'?: string;
};

export function SidebarContent({
  title,
  links,
  'data-class': dataClass,
}: SidebarContentProps) {
  const normalizedLinks = (links ?? []) as SidebarLink[];

  return (
    <Stack gap="4" data-class={dataClass ?? 'sidebar-widgets'}>
      <Stack component="nav" data-class="sidebar-widget">
        <If test="title" value={!!(title ?? '')}>
          <Text component="h3" fontSize="sm" fontWeight="semibold" data-class="sidebar-widget-title">
            <Var name="title" value={title ?? ''} />
          </Text>
        </If>
        <If test="links" value={normalizedLinks.length > 0}>
          <Stack gap="1" data-class="sidebar-links">
            <Loop each="links" as="link" data={normalizedLinks}>
              {(link: SidebarLink) => (
                <DomainNavButton
                  href={link.href}
                  variant="link"
                  size="sm"
                  justify="start"
                  data-class="sidebar-link"
                >
                  <Var name="link.label" value={link.label} />
                </DomainNavButton>
              )}
            </Loop>
          </Stack>
        </If>
      </Stack>
    </Stack>
  );
}
