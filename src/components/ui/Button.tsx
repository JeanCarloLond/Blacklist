import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  block = false,
  style,
}: ButtonProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();
  const inactive = disabled || loading;

  const background = {
    primary: theme.colors.accent,
    secondary: theme.colors.surface,
    ghost: 'transparent',
    danger: theme.colors.dangerSoft,
  }[variant];

  const foreground = {
    primary: theme.colors.textOnAccent,
    secondary: theme.colors.text,
    ghost: theme.colors.accent,
    danger: theme.colors.danger,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.bordered,
        { backgroundColor: background },
        block && styles.block,
        // Se atenua el boton entero en vez de cambiar sus colores: mantiene la
        // forma reconocible y no obliga a definir una paleta de estado inactivo.
        inactive && styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={foreground} /> : null}
          <Text variant="label" style={{ color: foreground }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const themedStyles = createStyles((theme) => ({
  base: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: {
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
  },
  block: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  inactive: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
}));
