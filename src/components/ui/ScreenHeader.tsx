import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Texto para lectores de pantalla: un icono suelto no dice nada. */
  label: string;
};

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: HeaderAction;
};

/**
 * Cabecera propia en lugar de la nativa de React Navigation.
 *
 * La nativa es más barata, pero impone su tipografía y su altura, y aquí el
 * título de pantalla es parte del sistema de diseño: usa la misma escala que el
 * resto de la app y admite un subtítulo, que la cabecera nativa no da sin
 * trucos. Al ser un componente propio, además, todas las pantallas se ven
 * exactamente igual en Android y en iOS.
 */
export function ScreenHeader({ title, subtitle, onBack, action }: ScreenHeaderProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
      ) : null}

      <View style={styles.titles}>
        <Text variant="title" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {action ? (
        <Pressable
          onPress={action.onPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={8}
        >
          <Ionicons name={action.icon} size={22} color={theme.colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const themedStyles = createStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  pressed: {
    backgroundColor: theme.colors.surfacePressed,
  },
}));
