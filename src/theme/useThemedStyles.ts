import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import type { Theme } from '@/theme';

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

/**
 * Crea una hoja de estilos a partir del tema activo, recalculándola solo cuando
 * el tema cambia.
 *
 * **Define la función `factory` en el ámbito del módulo**, nunca dentro del
 * componente: si se declara inline, su identidad cambia en cada render y el
 * `useMemo` no sirve de nada.
 *
 *     const styles = createStyles((t) => ({ card: { padding: t.spacing.lg } }));
 *     function Card() {
 *       const s = useThemedStyles(styles);
 *     }
 */
export function useThemedStyles<T extends NamedStyles>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}

/**
 * Azúcar para declarar la función de estilos con el tema ya tipado, sin tener
 * que anotar el parámetro en cada archivo.
 */
export function createStyles<T extends NamedStyles>(
  factory: (theme: Theme) => T,
): (theme: Theme) => T {
  return factory;
}
