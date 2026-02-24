import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const THEME_KEY = 'resta-theme';

export type ThemeBase = {
  name: string;
  rounded: Record<string, unknown> & { default: string };
  buttonSize: Record<string, unknown> & { default: string };
};

export const restaTheme: ThemeBase = {
  name: 'RestA',
  rounded: { default: 'sm', button: 'md', badge: 'xl' },
  buttonSize: { default: 'sm', badge: 'sm' },
};

interface ThemeContextValue {
  theme: ThemeBase;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [isDarkMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: restaTheme,
      isDarkMode,
      toggleDarkMode: () => setIsDarkMode((v) => !v),
      setDarkMode: setIsDarkMode,
    }),
    [isDarkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
