import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import type { ViewStyle } from 'react-native';

import { darkColors, lightColors, type ColorTokens } from './colors';
import { elevation, type ElevationLevel } from './shadows';
import { layout, radius, spacing } from './spacing';
import { typography } from './typography';

export type ThemeMode = 'light' | 'dark';

/**
 * Preferencia de tema del usuario. `system` sigue el ajuste del dispositivo, que
 * es el valor por defecto: casi nadie quiere que una sola app se salga del tema
 * que ya eligió para el teléfono.
 */
export type ThemePreference = ThemeMode | 'system';

export type Theme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorTokens;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  /** Sombra del nivel indicado, ya resuelta para este tema. */
  elevation: (level: ElevationLevel) => ViewStyle;
};

function createTheme(mode: ThemeMode): Theme {
  const isDark = mode === 'dark';
  return {
    mode,
    isDark,
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    radius,
    layout,
    elevation: (level) => elevation(level, isDark),
  };
}

export const darkTheme = createTheme('dark');
export const lightTheme = createTheme('light');

export function themeFor(mode: ThemeMode): Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}

/**
 * Traduce nuestros tokens al tema que espera React Navigation, para que el
 * fondo de las pantallas al hacer transiciones y la barra de pestañas usen los
 * mismos colores que el resto de la app. Sin esto se ve un destello blanco al
 * navegar en modo oscuro.
 */
export function toNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.isDark ? NavDarkTheme : NavDefaultTheme;
  return {
    ...base,
    dark: theme.isDark,
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}

export type { ColorTokens } from './colors';
export type { ElevationLevel } from './shadows';
export type { TypographyVariant } from './typography';
export { layout, radius, spacing } from './spacing';
export { typography } from './typography';
export { priorityColor } from './colors';
