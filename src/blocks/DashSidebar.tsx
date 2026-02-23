import { Stack, Text } from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';
import type { DashboardSidebarLink } from '@/types';

export interface DashSidebarProps {
  label?: string | undefined;
  links?: DashboardSidebarLink[];
  'data-class'?: string;
};

export function DashSidebar({
  label,
  links,
  'data-class': dataClass,
}: DashSidebarProps) {
  return (
    <Stack gap="2" p="4" w="full" items="stretch" data-class={dataClass ?? 'dash-sidebar-nav'}>
      <If test="label" value={!!(label ?? '')}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textColor="muted-foreground"
          data-class="dash-sidebar-label"
        >
          <Var name="label" value={label ?? ''} />
        </Text>
      </If>
      <If test="(links ?? []).length > 0" value={(links ?? []).length > 0}>
        <Loop each="links" as="link" data={links ?? []}>
          {(link: DashboardSidebarLink) => (
            <>
              <If test="!!link.active" value={!!link.active}>
                <DomainNavButton
                  href={link.href}
                  size="sm"
                  variant="secondary"
                  justify="start"
                  w="full"
                  data-class="dash-sidebar-link"
                >
                  <Var name="link.label" value={link.label} />
                </DomainNavButton>
              </If>
              <If test="!link.active" value={!link.active}>
                <DomainNavButton
                  href={link.href}
                  size="sm"
                  variant="ghost"
                  justify="start"
                  w="full"
                  data-class="dash-sidebar-link"
                >
                  <Var name="link.label" value={link.label} />
                </DomainNavButton>
              </If>
            </>
          )}
        </Loop>
      </If>
    </Stack>
  );
}
