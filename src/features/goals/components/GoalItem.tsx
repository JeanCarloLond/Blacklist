import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/Checkbox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import type { Goal } from '@/domain/models';
import {
  describeGoalSchedule,
  goalProgress,
  isGoalMet,
  progressStep,
} from '@/domain/goalSchedule';
import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type GoalItemProps = {
  goal: Goal;
  /** Cantidad registrada hoy (0 si no hay registro). */
  value: number;
  /** Días cumplidos esta semana. Solo se muestra en metas por veces/semana. */
  weekCount?: number;
  onToggle: () => void;
  onAddProgress: (delta: number) => void;
  onPress: () => void;
  onLongPress: () => void;
};

/**
 * Tarjeta de una meta.
 *
 * Las booleanas y las cuantitativas comparten tarjeta pero no control: las
 * primeras llevan un checkbox y las segundas un par de botones de más y menos
 * con su barra de avance. Separarlas en dos componentes duplicaría la cabecera
 * y el pie, que son idénticos.
 */
export function GoalItem({
  goal,
  value,
  weekCount,
  onToggle,
  onAddProgress,
  onPress,
  onLongPress,
}: GoalItemProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  const color = goal.color ?? theme.colors.accent;
  const met = isGoalMet(goal, value);
  const quantitative = goal.kind === 'quantitative';
  const step = progressStep(goal);

  const handleStep = (delta: number) => {
    // Solo vibra al sumar: restar es una corrección, no un logro.
    if (delta > 0) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddProgress(delta);
  };

  const scheduleLine = [
    describeGoalSchedule(goal),
    goal.scheduleType === 'times_per_week' && weekCount !== undefined
      ? `${weekCount}/${goal.timesPerWeek ?? 1} esta semana`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={goal.title}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />

        <View style={styles.titles}>
          <Text variant="subheading" color={met ? 'textMuted' : 'text'} numberOfLines={2}>
            {goal.title}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {scheduleLine}
          </Text>
        </View>

        {quantitative ? (
          <View style={styles.stepper}>
            <Pressable
              onPress={() => handleStep(-step)}
              disabled={value === 0}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Restar ${step} a ${goal.title}`}
              style={({ pressed }) => [
                styles.stepButton,
                value === 0 && styles.stepDisabled,
                pressed && styles.stepPressed,
              ]}
            >
              <Ionicons name="remove" size={20} color={theme.colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => handleStep(step)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Sumar ${step} a ${goal.title}`}
              style={({ pressed }) => [
                styles.stepButton,
                { backgroundColor: color },
                pressed && styles.stepPressed,
              ]}
            >
              <Ionicons name="add" size={20} color={theme.colors.textOnAccent} />
            </Pressable>
          </View>
        ) : (
          <Checkbox
            checked={met}
            onToggle={onToggle}
            color={color}
            accessibilityLabel={`Marcar ${goal.title} como cumplida hoy`}
          />
        )}
      </View>

      {quantitative ? (
        <View style={styles.progress}>
          <ProgressBar
            value={goalProgress(goal, value)}
            color={color}
            accessibilityLabel={`${value} de ${goal.targetValue} ${goal.unit ?? ''}`}
          />
          <View style={styles.progressLabels}>
            <Text variant="caption" color={met ? 'success' : 'textSecondary'}>
              {value} / {goal.targetValue}
              {goal.unit ? ` ${goal.unit}` : ''}
            </Text>
            {met ? (
              <View style={styles.metRow}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                <Text variant="caption" color="success">
                  Cumplida
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const themedStyles = createStyles((theme) => ({
  container: {
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  pressed: {
    backgroundColor: theme.colors.surfacePressed,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.pill,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSunken,
  },
  stepDisabled: {
    opacity: 0.4,
  },
  stepPressed: {
    opacity: 0.7,
  },
  progress: {
    gap: theme.spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
