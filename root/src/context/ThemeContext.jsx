import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'fleettrack-theme';
const ThemeContext = createContext(null);

export function resolveInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyThemeClass(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const isLightTheme = theme === 'light';

  document.documentElement.classList.toggle('light', isLightTheme);
  document.documentElement.style.colorScheme = isLightTheme ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write failures and keep the in-memory theme active.
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      isLightTheme: theme === 'light',
      setTheme,
      theme,
      toggleTheme: () => {
        setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
