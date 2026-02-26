import { Block, Container, Group, Text, Stack } from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import { DomainNavButton } from './DomainNavButton';
import { ThemeToggle } from './ThemeToggle';
import type { NavItem } from '@/types';

export interface DesignHeaderProps {
  title?: string;
  subtitle?: string;
  navItems?: NavItem[];
  'data-class'?: string;
}

export function DesignHeader({
  title,
  subtitle,
  navItems,
  'data-class': dataClass,
}: DesignHeaderProps) {
  const topNav = navItems ?? [];

  return (
    <Block
      component="header"
      py="2"
      bg="background"
      border="b"
      shadow="sm"
      data-class={dataClass ?? 'design-header'}
    >
      <Container
        max="w-6xl"
        mx="auto"
        px="4"
        flex=""
        justify="between"
        items="center"
        gap="8"
        data-class="design-header-container"
      >
        <a href="/" data-class="design-header-brand">
          <Group component="span" gap="1" items="center" data-class="design-header-brand-content">
            <Stack component="span" gap="0" items="start" data-class="design-header-brand-text">
              <If test="title" value={!!(title ?? '')}>
                <Text
                  fontSize="base"
                  fontWeight="bold"
                  textColor="primary"
                  data-class="design-header-brand-title"
                >
                  <Var name="title" value={title ?? 'RestA Design'} />
                </Text>
              </If>
              <If test="subtitle" value={!!(subtitle ?? '')}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  textColor="muted-foreground"
                  data-class="design-header-brand-subtitle"
                >
                  <Var name="subtitle" value={subtitle ?? 'Design System'} />
                </Text>
              </If>
            </Stack>
          </Group>
        </a>

        <Group gap="2" items="center" data-class="design-header-nav-group">
          <If test="topNav.length > 0" value={topNav.length > 0}>
            <Block component="nav" flex="" gap="2" items="center" data-class="design-header-nav">
              <Loop each="navItems" as="item" data={topNav}>
                {(item: NavItem) => (
                  <DomainNavButton
                    variant="link"
                    size="xs"
                    href={item.url}
                    data-class="design-header-nav-item"
                  >
                    <Text fontWeight="bold" fontSize="sm" component="span">
                      <Var name="item.title" value={item.title} />
                    </Text>
                  </DomainNavButton>
                )}
              </Loop>
            </Block>
          </If>
          <ThemeToggle />
        </Group>
      </Container>
    </Block>
  );
}
