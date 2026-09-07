import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  /** Crece con el contenido, para descripciones. */
  multiline?: boolean;
};

/**
 * Campo de texto.
 *
 * La etiqueta va siempre encima y no como marcador de posición: el marcador
 * desaparece al escribir, y con él la única pista de qué campo es ese, que es
 * un problema real al revisar un formulario ya relleno.
 */
export function TextField({
  label,
  error,
  multiline = false,
  style,
  ...rest
}: TextFieldProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <TextInput
        {...rest}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error ? styles.errored : null,
          style,
        ]}
      />
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const themedStyles = createStyles((theme) => ({
  container: {
    gap: theme.spacing.sm,
  },
  input: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  focused: {
    borderColor: theme.colors.accent,
  },
  errored: {
    borderColor: theme.colors.danger,
  },
}));
