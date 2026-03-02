import { Button, Icon } from '@/components';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/theme';
import { Fragment } from 'react';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <Fragment>
    {isDarkMode ? (<><Button variant="ghost" size="icon" onClick={toggleDarkMode} title="Switch to light mode" aria-label="Switch to light mode" data-class="theme-toggle-light"><Icon lucideIcon={Sun} size="sm" data-class="theme-toggle-icon"></Icon></Button></>) : null}
    {!isDarkMode ? (<><Button variant="ghost" size="sm" onClick={toggleDarkMode} title="Switch to dark mode" aria-label="Switch to dark mode" data-class="theme-toggle-dark"><Icon lucideIcon={Moon} size="sm" data-class="theme-toggle-icon"></Icon></Button></>) : null}

    </Fragment>
  );
}
