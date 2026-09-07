import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { Alert, SectionList, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import type { Goal, Task } from '@/domain/models';
import { GoalItem } from '@/features/goals/components/GoalItem';
import { TaskItem } from '@/features/tasks/components/TaskItem';
import { formatLongDay, isOverdue, todayKey } from '@/lib/date';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useTasksStore } from '@/store/tasksStore';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

type HomeItem = { kind: 'goal'; goal: Goal } | { kind: 'task'; task: Task };

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
  const isTaskDone = useTasksStore((state) => state.isDoneToday);
  const completedToday = useTasksStore((state) => state.completedToday);
  const toggleTask = useTasksStore((state) => state.toggleComplete);
  const archiveTask = useTasksStore((state) => state.archive);

  const goalsForToday = useGoalsStore((state) => state.goalsForToday);
  const todayValues = useGoalsStore((state) => state.todayValues);
  const weekCounts = useGoalsStore((state) => state.weekCounts);
  const isGoalDone = useGoalsStore((state) => state.isDoneToday);
  const toggleGoal = useGoalsStore((state) => state.toggleToday);
  const addProgress = useGoalsStore((state) => state.addProgress);

  const byId = useCategoriesStore((state) => state.byId);
  const today = todayKey();

  const goals = goalsForToday();

  /**
   * Orden de la jornada: primero lo pendiente, dentro de ello lo vencido, y
   * luego por prioridad. Lo ya hecho baja al final, donde sirve de recuento sin
   * estorbar a lo que queda.
   *
   * `completedToday` entra en las dependencias porque el estado de las tareas
   * recurrentes no vive en el objeto de la tarea, y sin él la lista no se
   * reordenaría al marcar una.
   */
  const orderedTasks = useMemo(() => {
    const rank = (task: Task) => {
      if (isTaskDone(task)) return 3;
      if (
        task.dueDate !== null &&
        task.recurrenceType === 'none' &&
        isOverdue(task.dueDate, today)
      ) {
        return 0;
      }
      return 1;
    };

    return [...todayTasks].sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      return b.priority - a.priority;
    });
  }, [todayTasks, isTaskDone, completedToday, today]);

  const sections = useMemo(() => {
    const result: { title: string; data: HomeItem[] }[] = [];
    if (goals.length > 0) {
      result.push({
        title: 'Metas',
        data: goals.map((goal) => ({ kind: 'goal' as const, goal })),
      });
    }
    if (orderedTasks.length > 0) {
      result.push({
        title: 'Tareas',
        data: orderedTasks.map((task) => ({ kind: 'task' as const, task })),
      });
    }
    return result;
  }, [goals, orderedTasks]);

  const total = goals.length + orderedTasks.length;
  const done =
    goals.filter((goal) => isGoalDone(goal)).length +
    orderedTasks.filter((task) => isTaskDone(task)).length;

  const confirmTaskAction = (task: Task) => {
    Alert.alert(task.title, '¿Qué quieres hacer con esta tarea?', [
      { text: 'Editar', onPress: () => navigation.navigate('TaskForm', { taskId: task.id }) },
      { text: 'Archivar', onPress: () => void archiveTask(task.id) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const askWhatToCreate = () => {
    Alert.alert('Crear', '¿Qué quieres añadir?', [
      { text: 'Nueva tarea', onPress: () => navigation.navigate('TaskForm') },
      { text: 'Nueva meta', onPress: () => navigation.navigate('GoalForm') },
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
      <SectionList
        sections={sections}
        keyExtractor={(item) => (item.kind === 'goal' ? `g${item.goal.id}` : `t${item.task.id}`)}
        extraData={[completedToday, todayValues]}
        stickySectionHeadersEnabled={false}
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
                value={done / total}
                accessibilityLabel={`${done} de ${total} completadas hoy`}
              />
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <Text variant="overline" color="textMuted" style={styles.sectionHeader}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) =>
          item.kind === 'goal' ? (
            <GoalItem
              goal={item.goal}
              value={todayValues.get(item.goal.id) ?? 0}
              weekCount={weekCounts.get(item.goal.id) ?? 0}
              onToggle={() => void toggleGoal(item.goal)}
              onAddProgress={(delta) => void addProgress(item.goal, delta)}
              onPress={() => navigation.navigate('GoalForm', { goalId: item.goal.id })}
              onLongPress={() => navigation.navigate('GoalForm', { goalId: item.goal.id })}
            />
          ) : (
            <TaskItem
              task={item.task}
              completed={isTaskDone(item.task)}
              category={byId(item.task.categoryId)}
              onToggle={() => void toggleTask(item.task)}
              onPress={() => navigation.navigate('TaskForm', { taskId: item.task.id })}
              onLongPress={() => confirmTaskAction(item.task)}
            />
          )
        }
        ListEmptyComponent={
          <EmptyState
            icon="sunny-outline"
            title="Nada pendiente por ahora"
            message="Crea una meta para medir tu constancia, o una tarea con fecha. Lo que toque cada día aparecerá aquí."
          />
        }
      />

      <Fab onPress={askWhatToCreate} accessibilityLabel="Crear tarea o meta" />
    </Screen>
  );
}

const themedStyles = createStyles((theme) => ({
  list: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.xs,
    // Deja sitio para que el botón flotante no tape el último elemento.
    paddingBottom: theme.layout.fab + theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
  },
  sectionHeader: {
    marginTop: theme.spacing.sm,
  },
  summary: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
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
