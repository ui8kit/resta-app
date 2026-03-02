import { Block, Container, Group, Text, Sheet, Stack, Icon, Button } from '@/components';
import { DomainNavButton } from './DomainNavButton';
import { ThemeToggle } from './ThemeToggle';
import { useAdminAuth } from '@/providers/AdminAuthContext';
import { NAV_ICONS } from '@/constants';
import { useAdminNav } from '@/hooks';
import { ChefHat, LogIn, LogOut, Menu } from 'lucide-react';
import type { NavItem } from '@/types';
import { Fragment } from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  navItems?: NavItem[];
  dataClass?: string;
  dataClassAttr?: string;
  beforeThemeToggle?: React.ReactNode;
}

export function Header(props: HeaderProps) {
  const { title, subtitle, navItems, dataClass, dataClassAttr, beforeThemeToggle } = props;

  const { isAuthenticated } = useAdminAuth();
  const { handleLogout } = useAdminNav();

  return (
    <Block component="header" py="2" bg="background" border="b" shadow="sm" data-class={dataClass ?? dataClassAttr ?? 'header'}>
      <Container max="w-6xl" mx="auto" px="4" flex="" justify="between" items="center" gap="8" data-class="header-container">
        <a href="/" data-class="header-brand">
          <Group component="span" gap="1" items="center" data-class="header-brand-content">
            <Icon lucideIcon={ChefHat} strokeWidth={1.5} text="chart-3" data-class="header-brand-icon" className="w-[38px] h-[38px]">
            </Icon>
            <Stack component="span" gap="0" items="start" data-class="header-brand-text">
              {title ? (<><Text fontSize="base" fontWeight="bold" textColor="primary" data-class="header-brand-title">{title}</Text></>) : null}
              {subtitle ? (<><Text fontSize="xs" fontWeight="bold" textColor="muted-foreground" data-class="header-brand-subtitle" style={{ marginTop: '-0.5em' }}>{subtitle}</Text></>) : null}
            </Stack>
          </Group>
        </a>
        <Group gap="0" items="center" data-class="header-nav-group">
          {navItems ? (<><Block flex="" gap="2" items="center" data-class="header-nav-wrapper"><Block component="nav" flex="" gap="2" items="center" data-class="header-nav" className="hidden md:flex">{navItems.map((item, index) => (
          <Fragment key={item.id ?? index}>
          <DomainNavButton variant={"link"} size={"xs"} href={item.url} data-class={"header-nav-item"}><Text fontWeight="bold" fontSize="sm" component="span">{item.title}</Text></DomainNavButton>
          </Fragment>
          ))}</Block><Block className="flex md:hidden" data-class="header-mobile-menu"><Sheet id="header-mobile-menu" side="left" size="sm" title="Menu" openLabel="Open menu" closeLabel="Close menu" triggerVariant="link" triggerSize="sm" data-class="header-mobile-sheet"><Stack gap="1" w="full" data-class="header-mobile-nav">{navItems.map((item, index) => (
          <Fragment key={item.id ?? index}>
          <DomainNavButton variant={"link"} size={"xs"} href={item.url} justify={"start"} w={"full"} data-class={"header-mobile-nav-link"} className={"h-9 justify-start text-left"} onClick={() => {
                                  const cb = document.getElementById('header-mobile-menu') as HTMLInputElement | null;
                                  if (cb) cb.checked = false;
                                }}><Group component="span" gap="2" items="center" data-class="header-mobile-nav-link-content"><Icon lucideIcon={NAV_ICONS[item.id] ?? Menu} size="sm" data-class="header-mobile-nav-icon"></Icon><Text component="span" fontSize="sm">{item.title}</Text></Group></DomainNavButton>
          </Fragment>
          ))}</Stack></Sheet></Block></Block></>) : null}
          {beforeThemeToggle}
          <ThemeToggle />
          {isAuthenticated ? (<><Button variant="link" size="sm" onClick={handleLogout} title="Logout" aria-label="Logout" data-class="header-admin-link"><Icon lucideIcon={LogOut} size="sm" data-class="header-admin-icon"></Icon></Button></>) : (<><DomainNavButton variant={"link"} size={"sm"} href={"/admin"} title={"Admin / Login"} aria-label={"Admin / Login"} data-class={"header-admin-link"}><Icon lucideIcon={LogIn} size="sm" data-class="header-admin-icon"></Icon></DomainNavButton></>)}
        </Group>
      </Container>
    </Block>
  );
}
