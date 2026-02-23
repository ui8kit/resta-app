import { Block, Container, Group, Text, Sheet, Stack, Icon, Button } from '@ui8kit/core';
import { If, Else, Var, Loop } from '@ui8kit/dsl';
import { DomainNavButton } from './DomainNavButton';
import { ThemeToggle } from './ThemeToggle';
import { useAdminAuth } from '@/providers/AdminAuthContext';
import { NAV_ICONS } from '@/constants';
import { useAdminNav } from '@/hooks';
import { ChefHat, LogIn, LogOut, Menu } from 'lucide-react';
import type { NavItem } from '@/types';

export type HeaderProps = {
  title?: string;
  subtitle?: string;
  navItems?: NavItem[];
  dataClass?: string;
  'data-class'?: string;
  /** Renders before ThemeToggle in the nav group (e.g. mobile menu burger) */
  beforeThemeToggle?: React.ReactNode;
};

export function Header({
  title,
  subtitle,
  navItems,
  dataClass,
  'data-class': dataClassAttr,
  beforeThemeToggle,
}: HeaderProps) {
  const { isAuthenticated } = useAdminAuth();
  const { handleLogout } = useAdminNav();

  return (
    <Block
      component="header"
      py="2"
      bg="background"
      border="b"
      shadow="sm"
      data-class={dataClass ?? dataClassAttr ?? 'header'}
    >
      <Container
        max="w-6xl"
        mx="auto"
        px="4"
        flex=""
        justify="between"
        items="center"
        gap="8"
        data-class="header-container"
      >
        <a href="/" data-class="header-brand">
          <Group component="span" gap="1" items="center" data-class="header-brand-content">
            <Icon lucideIcon={ChefHat} strokeWidth={1.5} text="chart-3" data-class="header-brand-icon" className="w-[38px] h-[38px]" />
            <Stack component="span" gap="0" items="start" data-class="header-brand-text">
              <If test="title" value={!!(title ?? '')}>
                <Text
                  fontSize="base"
                  fontWeight="bold"
                  textColor="primary"
                  data-class="header-brand-title"
                >
                  <Var name="title" value={title ?? 'RestA'} />
                </Text>
              </If>
              <If test="subtitle" value={!!(subtitle ?? 'Restaurant & Bar')}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  textColor="muted-foreground"
                  data-class="header-brand-subtitle"
                  style={{ marginTop: '-0.5em' }}
                >
                  <Var name="subtitle" value={subtitle ?? 'Restaurant & Bar'} />
                </Text>
              </If>
            </Stack>
          </Group>
        </a>

        <Group gap="0" items="center" data-class="header-nav-group">
          <If test="navItems" value={(navItems ?? []).length > 0}>
            <Block flex="" gap="2" items="center" data-class="header-nav-wrapper">
              <Block
                component="nav"
                flex=""
                gap="2"
                items="center"
                data-class="header-nav"
                className="hidden md:flex"
              >
                <Loop each="navItems" as="item" data={navItems ?? []}>
                  {(item: NavItem) => (
                    <DomainNavButton
                      variant="link"
                      size="xs"
                      href={item.url}
                      data-class="header-nav-item"
                    >
                      <Text fontWeight="bold" fontSize="sm" component="span">
                        <Var name="item.title" value={item.title} />
                      </Text>
                    </DomainNavButton>
                  )}
                </Loop>
              </Block>
              <Block className="flex md:hidden" data-class="header-mobile-menu">
            <Sheet
              id="header-mobile-menu"
              side="left"
              size="sm"
              title="Menu"
              openLabel="Open menu"
              closeLabel="Close menu"
              triggerVariant="link"
              triggerSize="sm"
              data-class="header-mobile-sheet"
            >
              <Stack gap="1" w="full" data-class="header-mobile-nav">
                <Loop each="navItems" as="item" data={navItems ?? []}>
                  {(item: NavItem) => (
                    <DomainNavButton
                      variant="link"
                      size="xs"
                      href={item.url}
                      justify="start"
                      w="full"
                      data-class="header-mobile-nav-link"
                      className="h-9 justify-start text-left"
                      onClick={() => {
                        const cb = document.getElementById('header-mobile-menu') as HTMLInputElement | null;
                        if (cb) cb.checked = false;
                      }}
                    >
                      <Group component="span" gap="2" items="center" data-class="header-mobile-nav-link-content">
                        <Icon
                          lucideIcon={NAV_ICONS[item.id] ?? Menu}
                          size="sm"
                          data-class="header-mobile-nav-icon"
                        />
                        <Text component="span" fontSize="sm">
                          <Var name="item.title" value={item.title} />
                        </Text>
                      </Group>
                    </DomainNavButton>
                  )}
                </Loop>
              </Stack>
            </Sheet>
              </Block>
            </Block>
          </If>
          {beforeThemeToggle}
          <ThemeToggle />
          <If test="isAuthenticated" value={isAuthenticated}>
            <Button
              variant="link"
              size="sm"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              data-class="header-admin-link"
            >
              <Icon lucideIcon={LogOut} size="sm" data-class="header-admin-icon" />
            </Button>
          <Else>
            <DomainNavButton
              variant="link"
              size="sm"
              href="/admin"
              title="Admin / Login"
              aria-label="Admin / Login"
              data-class="header-admin-link"
            >
              <Icon lucideIcon={LogIn} size="sm" data-class="header-admin-icon" />
            </DomainNavButton>
          </Else>
          </If>
        </Group>
      </Container>
    </Block>
  );
}
