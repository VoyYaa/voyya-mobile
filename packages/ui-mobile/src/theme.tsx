import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, type Theme, type ThemeMode } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  overrideMode?: ThemeMode;
  fontsReady?: boolean;
}

export function ThemeProvider({
  children,
  overrideMode,
  fontsReady = false,
}: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();
  const mode: ThemeMode = overrideMode ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => buildTheme(mode, fontsReady), [mode, fontsReady]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme() must be used within <ThemeProvider>.');
  }
  return theme;
}
