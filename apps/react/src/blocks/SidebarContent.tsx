import { Stack, Text } from '@/components';
import { DomainNavButton } from '@/partials';
import type { SidebarLink } from '@/types';
import { Fragment } from 'react';

interface SidebarContentProps {
  title?: string;
  links?: SidebarLink[];
  dataClass?: string | undefined;
}

export function SidebarContent(props: SidebarContentProps) {
  const { title, links, dataClass } = props;

  const normalizedLinks = (links ?? []) as SidebarLink[];

  return (
    <Stack gap="4" data-class={dataClass ?? 'sidebar-widgets'}>
      <Stack component="nav" data-class="sidebar-widget">
        {title ? (<><Text component="h3" fontSize="sm" fontWeight="semibold" data-class="sidebar-widget-title">{title}</Text></>) : null}
        {links ? (<><Stack gap="1" data-class="sidebar-links">{links.map((link, index) => (
        <Fragment key={link.id ?? index}>
        <DomainNavButton href={link.href} variant={"link"} size={"sm"} justify={"start"} data-class={"sidebar-link"}>{link.label}</DomainNavButton>
        </Fragment>
        ))}</Stack></>) : null}
      </Stack>
    </Stack>
  );
}
