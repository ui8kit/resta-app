import { Stack, Text } from '@/components';
import { DomainNavButton } from '@/partials';
import type { DashboardSidebarLink } from '@/types';
import { Fragment } from 'react';

interface DashSidebarProps {
  label?: string | undefined;
  links?: DashboardSidebarLink[];
  dataClass?: string;
}

export function DashSidebar(props: DashSidebarProps) {
  const { label, links, dataClass } = props;

  return (
    <Stack gap="2" p="4" w="full" items="stretch" data-class={dataClass ?? 'dash-sidebar-nav'}>
      {label ? (<><Text fontSize="xs" fontWeight="semibold" textColor="muted-foreground" data-class="dash-sidebar-label">{label}</Text></>) : null}
      {(links ?? []).length > 0 ? (<>{links.map((link, index) => (
      <Fragment key={link.id ?? index}>
      {!!link.active ? (<><DomainNavButton href={link.href} size={"sm"} variant={"secondary"} justify={"start"} w={"full"} data-class={"dash-sidebar-link"}>{link.label}</DomainNavButton></>) : null}{!link.active ? (<><DomainNavButton href={link.href} size={"sm"} variant={"ghost"} justify={"start"} w={"full"} data-class={"dash-sidebar-link"}>{link.label}</DomainNavButton></>) : null}
      </Fragment>
      ))}</>) : null}
    </Stack>
  );
}
