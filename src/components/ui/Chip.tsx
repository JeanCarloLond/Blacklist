import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Punto de color a la izquierda, para categorías. */
  dotColor?: string;
};

/**
 * Píldora seleccionable para filtros y selección de categoría.
 *
 * Al seleccionarse cambia el fondo y el peso del texto a la vez. Marcar el
 * estado solo con color deja fuera a quien no lo distingue; el contraste de
 * relleno se ve siempre.
 */
export function Chip({ label, selected = false, onPress, dotColor }: ChipProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text
        variant={selected ? 'bodyStrong' : 'label'}
        style={{
          color: selected ? theme.colors.textOnAccent : theme.colors.textSecondary,
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const themedStyles = createStyles((theme) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 38,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  selected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: theme.radius.pill,
  },
}));
