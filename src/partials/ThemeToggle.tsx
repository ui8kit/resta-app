import { Button, Icon } from '@ui8kit/core';
import { If } from '@ui8kit/dsl';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/theme';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <>
      <If test="isDarkMode" value={isDarkMode}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title="Switch to light mode"
          aria-label="Switch to light mode"
          data-class="theme-toggle"
        >
          <Icon lucideIcon={Sun} size="sm" data-class="theme-toggle-icon" />
        </Button>
      </If>
      <If test="!isDarkMode" value={!isDarkMode}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title="Switch to dark mode"
          aria-label="Switch to dark mode"
          data-class="theme-toggle"
        >
          <Icon lucideIcon={Moon} size="sm" data-class="theme-toggle-icon" />
        </Button>
      </If>
    </>
  );
}
