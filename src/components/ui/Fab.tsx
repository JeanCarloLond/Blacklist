import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type FabProps = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
};

/**
 * Botón flotante de acción principal.
 *
 * Va abajo a la derecha porque es la zona que el pulgar alcanza sin recolocar
 * la mano, que es justo lo que se pidió: la acción más frecuente, al alcance.
 */
export function Fab({ onPress, icon = 'add', accessibilityLabel }: FabProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.fab, theme.elevation(3), pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={28} color={theme.colors.textOnAccent} />
    </Pressable>
  );
}

const themedStyles = createStyles((theme) => ({
  fab: {
    ...({ position: 'absolute' } as const),
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: theme.layout.fab,
    height: theme.layout.fab,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
}));
