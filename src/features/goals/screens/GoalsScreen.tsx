import { useNavigation } from '@react-navigation/native';
import { Alert, FlatList } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import type { Goal } from '@/domain/models';
import { GoalItem } from '@/features/goals/components/GoalItem';
import { useGoalsStore } from '@/store/goalsStore';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export function GoalsScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(themedStyles);

  const goals = useGoalsStore((state) => state.goals);
  const todayValues = useGoalsStore((state) => state.todayValues);
  const weekCounts = useGoalsStore((state) => state.weekCounts);
  const toggleToday = useGoalsStore((state) => state.toggleToday);
  const addProgress = useGoalsStore((state) => state.addProgress);
  const archive = useGoalsStore((state) => state.archive);
  const remove = useGoalsStore((state) => state.remove);

  const confirmGoalAction = (goal: Goal) => {
    Alert.alert(goal.title, '¿Qué quieres hacer con esta meta?', [
      { text: 'Editar', onPress: () => navigation.navigate('GoalForm', { goalId: goal.id }) },
      {
        text: 'Archivar',
        onPress: () => void archive(goal.id),
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Eliminar meta',
            'Se borrará junto con todo su historial de constancia. Si solo quieres dejar de verla, archívala: así conservas las rachas que ya llevas.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => void remove(goal.id) },
            ],
          ),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <Screen
      padded={false}
      header={<ScreenHeader title="Metas" subtitle="Lo que quieres sostener en el tiempo" />}
    >
      <FlatList
        data={goals}
        keyExtractor={(goal) => goal.id}
        extraData={todayValues}
        contentContainerStyle={[styles.list, goals.length === 0 && styles.listEmpty]}
        renderItem={({ item }) => (
          <GoalItem
            goal={item}
            value={todayValues.get(item.id) ?? 0}
            weekCount={weekCounts.get(item.id) ?? 0}
            onToggle={() => void toggleToday(item)}
            onAddProgress={(delta) => void addProgress(item, delta)}
            onPress={() => navigation.navigate('GoalForm', { goalId: item.id })}
            onLongPress={() => confirmGoalAction(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="flame-outline"
            title="Aún no hay metas"
            message="Una meta no se tacha y se olvida: se mide por constancia. Tocar guitarra, entrenar, estudiar."
          />
        }
      />

      <Fab onPress={() => navigation.navigate('GoalForm')} accessibilityLabel="Crear meta" />
    </Screen>
  );
}

const themedStyles = createStyles((theme) => ({
  list: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.sm,
    // Deja sitio para que el botón flotante no tape la última meta.
    paddingBottom: theme.layout.fab + theme.spacing.xxl,
  },
  listEmpty: {
    flexGrow: 1,
  },
}));
