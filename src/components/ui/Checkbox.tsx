import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

const AnimatedView = Animated.createAnimatedComponent(View);

export type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  /** Color del relleno. Por defecto el acento; las metas usan el suyo. */
  color?: string;
  accessibilityLabel: string;
  disabled?: boolean;
};

/**
 * Control de completado.
 *
 * Marcar una tarea es la acción que más veces se repite en la app, así que se
 * cuida el detalle: un rebote corto al marcar y una vibración ligera. La
 * animación es de ida solamente — al desmarcar el relleno se va sin rebote,
 * porque celebrar un "deshacer" resulta raro.
 *
 * El área pulsable se amplía con `hitSlop` en vez de agrandar el cuadro: así el
 * dedo acierta sin que el dibujo domine la fila.
 */
export function Checkbox({
  checked,
  onToggle,
  color,
  accessibilityLabel,
  disabled = false,
}: CheckboxProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();
  const fillColor = color ?? theme.colors.accent;

  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = checked
      ? withSpring(1, { damping: 12, stiffness: 260 })
      : withTiming(0, { duration: 120 });
  }, [checked, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    // Solo al completar: una vibración al desmarcar se percibe como un error.
    if (!checked) {
      scale.value = withSequence(
        withTiming(0.86, { duration: 90 }),
        withSpring(1, { damping: 9, stiffness: 300 }),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      <AnimatedView
        style={[
          styles.box,
          boxStyle,
          { borderColor: checked ? fillColor : theme.colors.borderStrong },
        ]}
      >
        <AnimatedView style={[styles.fill, fillStyle, { backgroundColor: fillColor }]}>
          <Ionicons name="checkmark" size={16} color={theme.colors.textOnAccent} />
        </AnimatedView>
      </AnimatedView>
    </Pressable>
  );
}

const themedStyles = createStyles((theme) => ({
  box: {
    width: theme.layout.checkbox,
    height: theme.layout.checkbox,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    ...({
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
    } as const),
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
