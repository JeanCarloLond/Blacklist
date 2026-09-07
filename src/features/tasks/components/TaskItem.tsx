import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/Checkbox';
import { Text } from '@/components/ui/Text';
import type { Category, Task } from '@/domain/models';
import { formatRelativeDay, isOverdue } from '@/lib/date';
import { useTheme } from '@/providers/ThemeProvider';
import { priorityColor } from '@/theme';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type TaskItemProps = {
  task: Task;
  category?: Category;
  onToggle: () => void;
  onPress: () => void;
  onLongPress: () => void;
};

/**
 * Fila de una tarea en la lista.
 *
 * La franja de color de la izquierda codifica la prioridad. Se eligió una
 * franja y no un icono porque se lee sin enfocar la vista: al recorrer la lista
 * de arriba abajo, el patrón de color ya dice dónde está lo urgente.
 *
 * Una vez completada, el título se tacha y baja a texto apagado en lugar de
 * desaparecer: ver lo hecho es parte de la recompensa.
 */
export function TaskItem({
  task,
  category,
  onToggle,
  onPress,
  onLongPress,
}: TaskItemProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  const completed = task.completedAt !== null;
  const overdue = !completed && task.dueDate !== null && isOverdue(task.dueDate);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={task.title}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.priorityBar,
          { backgroundColor: priorityColor(theme.colors, task.priority) },
          completed && styles.faded,
        ]}
      />

      <View style={styles.checkboxSlot}>
        <Checkbox
          checked={completed}
          onToggle={onToggle}
          accessibilityLabel={`Marcar ${task.title} como completada`}
        />
      </View>

      <View style={styles.content}>
        <Text
          variant="subheading"
          color={completed ? 'textMuted' : 'text'}
          style={completed ? styles.struck : undefined}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}

        {category || task.dueDate ? (
          <View style={styles.meta}>
            {category ? (
              <View style={styles.metaItem}>
                <View style={[styles.dot, { backgroundColor: category.color }]} />
                <Text variant="caption" color="textMuted">
                  {category.name}
                </Text>
              </View>
            ) : null}

            {task.dueDate ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name={overdue ? 'alert-circle' : 'calendar-outline'}
                  size={12}
                  color={overdue ? theme.colors.danger : theme.colors.textMuted}
                />
                <Text variant="caption" color={overdue ? 'danger' : 'textMuted'}>
                  {formatRelativeDay(task.dueDate)}
                  {task.dueTime ? ` · ${task.dueTime}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const themedStyles = createStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    paddingLeft: theme.spacing.lg + 6,
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: theme.colors.surfacePressed,
  },
  priorityBar: {
    ...({ position: 'absolute', left: 0, top: 0, bottom: 0 } as const),
    width: 4,
  },
  faded: {
    opacity: 0.3,
  },
  checkboxSlot: {
    // Alinea el checkbox con la primera línea del título en vez de centrarlo:
    // con títulos de dos líneas, centrado se ve descolgado.
    paddingTop: 1,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
  },
}));
