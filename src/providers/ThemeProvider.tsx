import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { themeFor, type Theme, type ThemePreference } from '@/theme';

type ThemeContextValue = {
  theme: Theme;
  /** Lo que el usuario eligió: 'system', 'light' o 'dark'. */
  preference: ThemePreference;
  /** Tema realmente aplicado tras resolver 'system'. */
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  /** Preferencia inicial, para restaurarla desde la base de datos al arrancar. */
  initialPreference?: ThemePreference;
};

export function ThemeProvider({
  children,
  initialPreference = 'system',
}: ThemeProviderProps) {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const systemScheme = useColorScheme();

  // `useColorScheme` devuelve null mientras el sistema aún no ha respondido.
  // Se cae a 'dark' por ser el tema base de la identidad de BlackList.
  const resolvedMode =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  const handleSetPreference = useCallback((next: ThemePreference) => {
    setPreference(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeFor(resolvedMode),
      preference,
      setPreference: handleSetPreference,
    }),
    [resolvedMode, preference, handleSetPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Tokens del tema activo. Lanza si se usa fuera del provider, a propósito. */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  }
  return context.theme;
}

/** Control de la preferencia de tema, para la pantalla de ajustes. */
export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemePreference debe usarse dentro de <ThemeProvider>');
  }
  return { preference: context.preference, setPreference: context.setPreference };
}
