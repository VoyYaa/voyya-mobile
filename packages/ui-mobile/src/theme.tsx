// =============================================================================
// VoyYa — ThemeProvider + useTheme (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Respeta el modo del sistema (`useColorScheme`) por defecto. KISS: sin toggle
// manual todavía (no lo pide ninguna spec); `overrideMode` queda como escape
// hatch para tests/previews sin romper el contrato del hook.
// =============================================================================

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, type Theme, type ThemeMode } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Fuerza un modo específico (tests/previews). Por defecto sigue al sistema. */
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
    throw new Error('useTheme() debe usarse dentro de <ThemeProvider>.');
  }
  return theme;
}
