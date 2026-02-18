import { Stack, Text } from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';

export type DashSidebarLink = {
  label: string;
  href: string;
  active?: boolean;
};

export type DashSidebarProps = {
  label?: string;
  links?: DashSidebarLink[];
  'data-class'?: string;
};

export function DashSidebar({
  label,
  links,
  'data-class': dataClass,
}: DashSidebarProps) {
  return (
    <Stack gap="2" p="4" data-class={dataClass ?? 'dash-sidebar-nav'}>
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
          {(link: DashSidebarLink) => (
            <>
              <If test="!!link.active" value={!!link.active}>
                <DomainNavButton
                  href={link.href}
                  size="sm"
                  variant="secondary"
                  justify="start"
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
