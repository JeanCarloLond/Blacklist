import { View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type ProgressBarProps = {
  /** Avance entre 0 y 1. Los valores fuera de rango se recortan. */
  value: number;
  color?: string;
  accessibilityLabel?: string;
};

export function ProgressBar({ value, color, accessibilityLabel }: ProgressBarProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View
        style={[
          styles.fill,
          {
            // El ancho va en porcentaje para no depender de medir el
            // contenedor: así la barra ya aparece bien en el primer render.
            width: `${clamped * 100}%`,
            backgroundColor: color ?? theme.colors.accent,
          },
        ]}
      />
    </View>
  );
}

const themedStyles = createStyles((theme) => ({
  track: {
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
}));
