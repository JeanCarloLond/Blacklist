import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import type { Task } from '@/domain/models';
import { TaskItem } from '@/features/tasks/components/TaskItem';
import { formatLongDay, isOverdue, todayKey } from '@/lib/date';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useTasksStore } from '@/store/tasksStore';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

/**
 * Mensaje de cabecera del resumen.
 *
 * Se evita a propósito cualquier reproche cuando queda trabajo por hacer: la
 * app tiene que dar ganas de volver, y una lista que regaña se cierra y no se
 * abre más. El único momento con celebración explícita es el día completo.
 */
function summaryMessage(done: number, total: number): string {
  if (total === 0) return 'Hoy no tienes nada programado.';
  if (done === total) return '¡Día completo! Nada más pendiente.';
  if (done === 0) return `${total} ${total === 1 ? 'cosa' : 'cosas'} para hoy.`;
  return `${done} de ${total} hechas. Vas bien.`;
}

export function HomeScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(themedStyles);

  const todayTasks = useTasksStore((state) => state.todayTasks);
  const isDoneToday = useTasksStore((state) => state.isDoneToday);
  const completedToday = useTasksStore((state) => state.completedToday);
  const toggleComplete = useTasksStore((state) => state.toggleComplete);
  const archive = useTasksStore((state) => state.archive);
  const byId = useCategoriesStore((state) => state.byId);

  const today = todayKey();

  /**
   * Orden de la jornada: primero lo pendiente, dentro de ello lo vencido, y
   * luego por prioridad. Lo ya hecho baja al final, donde sirve de recuento sin
   * estorbar a lo que queda.
   *
   * `completedToday` entra en las dependencias porque el estado de las tareas
   * recurrentes no vive en el objeto de la tarea, y sin él la lista no se
   * reordenaría al marcar una.
   */
  const ordered = useMemo(() => {
    const rank = (task: Task) => {
      if (isDoneToday(task)) return 3;
      if (task.dueDate !== null && task.recurrenceType === 'none' && isOverdue(task.dueDate, today)) {
        return 0;
      }
      return 1;
    };

    return [...todayTasks].sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      return b.priority - a.priority;
    });
  }, [todayTasks, isDoneToday, completedToday, today]);

  const total = ordered.length;
  const done = ordered.filter((task) => isDoneToday(task)).length;

  const confirmArchive = (task: Task) => {
    Alert.alert(task.title, '¿Qué quieres hacer con esta tarea?', [
      { text: 'Editar', onPress: () => navigation.navigate('TaskForm', { taskId: task.id }) },
      { text: 'Archivar', onPress: () => void archive(task.id) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title="Hoy"
          subtitle={formatLongDay(today)}
          action={{
            icon: 'settings-outline',
            label: 'Ajustes',
            onPress: () => navigation.navigate('Settings'),
          }}
        />
      }
    >
      <FlatList
        data={ordered}
        keyExtractor={(task) => task.id}
        contentContainerStyle={[styles.list, total === 0 && styles.listEmpty]}
        ListHeaderComponent={
          total > 0 ? (
            <View style={styles.summary}>
              <View style={styles.summaryTop}>
                <Text variant="bodyStrong">{summaryMessage(done, total)}</Text>
                <Text variant="caption" color="textMuted">
                  {done}/{total}
                </Text>
              </View>
              <ProgressBar
                value={total === 0 ? 0 : done / total}
                accessibilityLabel={`${done} de ${total} tareas completadas hoy`}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            completed={isDoneToday(item)}
            category={byId(item.categoryId)}
            onToggle={() => void toggleComplete(item)}
            onPress={() => navigation.navigate('TaskForm', { taskId: item.id })}
            onLongPress={() => confirmArchive(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="sunny-outline"
            title="Nada pendiente por ahora"
            message="Cuando crees tareas con fecha o que se repitan, aquí verás lo que toca cada día."
          />
        }
      />

      <Fab onPress={() => navigation.navigate('TaskForm')} accessibilityLabel="Crear tarea" />
    </Screen>
  );
}

const themedStyles = createStyles((theme) => ({
  list: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.xs,
    // Deja sitio para que el botón flotante no tape la última tarea.
    paddingBottom: theme.layout.fab + theme.spacing.xxl,
  },
  listEmpty: {
    flexGrow: 1,
  },
  summary: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accentSoft,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
}));
