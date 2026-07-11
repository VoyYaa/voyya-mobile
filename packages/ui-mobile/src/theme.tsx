import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, type Theme, type ThemeMode } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  overrideMode?: ThemeMode;
}

export function ThemeProvider({ children, overrideMode }: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();
  const mode: ThemeMode = overrideMode ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme() must be used within <ThemeProvider>.');
  }
  return theme;
}
