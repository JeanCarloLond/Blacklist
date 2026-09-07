import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import type { TypographyVariant } from '@/theme';

/**
 * Tokens de color válidos para texto. Se restringe a propósito: el resto de
 * tokens (fondos, bordes) nunca deben acabar pintando una letra, y dejar el tipo
 * abierto a `string` invitaría a colar hexadecimales sueltos por las pantallas.
 */
export type TextColor =
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'textOnAccent'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: TextColor;
};

/**
 * Texto de la app. Sustituye al `Text` de React Native en todas las pantallas
 * para que ningún tamaño ni color quede fuera del sistema de diseño.
 */
export function Text({
  variant = 'body',
  color = 'text',
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[theme.typography[variant], { color: theme.colors[color] }, style]}
      {...rest}
    />
  );
}
