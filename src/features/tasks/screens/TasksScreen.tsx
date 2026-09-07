import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, TextInput, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import type { Task } from '@/domain/models';
import { TaskItem } from '@/features/tasks/components/TaskItem';
import { useTheme } from '@/providers/ThemeProvider';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useTasksStore } from '@/store/tasksStore';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export function TasksScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  const tasks = useTasksStore((state) => state.tasks);
  const filter = useTasksStore((state) => state.filter);
  const setFilter = useTasksStore((state) => state.setFilter);
  const toggleComplete = useTasksStore((state) => state.toggleComplete);
  const isDoneToday = useTasksStore((state) => state.isDoneToday);
  const completedToday = useTasksStore((state) => state.completedToday);
  const archive = useTasksStore((state) => state.archive);
  const remove = useTasksStore((state) => state.remove);

  const categories = useCategoriesStore((state) => state.categories);
  const byId = useCategoriesStore((state) => state.byId);

  const [query, setQuery] = useState(filter.search);

  /**
   * La búsqueda espera 250 ms antes de consultar. Sin esa pausa, cada tecla
   * lanzaría un LIKE contra la tabla entera y la lista parpadearía mientras se
   * escribe.
   */
  useEffect(() => {
    if (query === filter.search) return;
    const timer = setTimeout(() => {
      void setFilter({ search: query });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, filter.search, setFilter]);

  const confirmTaskAction = (task: Task) => {
    Alert.alert(task.title, '¿Qué quieres hacer con esta tarea?', [
      { text: 'Editar', onPress: () => navigation.navigate('TaskForm', { taskId: task.id }) },
      { text: 'Archivar', onPress: () => void archive(task.id) },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Eliminar tarea',
            'Se borrará junto con su historial. Esta acción no se puede deshacer.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => void remove(task.id) },
            ],
          ),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const filtering = filter.search.length > 0 || filter.categoryId !== null;

  return (
    <Screen
      padded={false}
      header={<ScreenHeader title="Tareas" subtitle="Todo lo que tienes pendiente" />}
    >
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar tareas"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersRow}
      >
        <Chip
          label="Todas"
          selected={filter.categoryId === null}
          onPress={() => void setFilter({ categoryId: null })}
        />
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            dotColor={category.color}
            selected={filter.categoryId === category.id}
            onPress={() =>
              void setFilter({
                categoryId: filter.categoryId === category.id ? null : category.id,
              })
            }
          />
        ))}
      </ScrollView>

      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={[
          styles.list,
          tasks.length === 0 && styles.listEmpty,
        ]}
        keyboardShouldPersistTaps="handled"
        extraData={completedToday}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            completed={isDoneToday(item)}
            category={byId(item.categoryId)}
            onToggle={() => void toggleComplete(item)}
            onPress={() => navigation.navigate('TaskForm', { taskId: item.id })}
            onLongPress={() => confirmTaskAction(item)}
          />
        )}
        ListEmptyComponent={
          filtering ? (
            <EmptyState
              icon="search-outline"
              title="Nada coincide"
              message="Prueba con otras palabras o quita el filtro de categoría."
            />
          ) : (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Sin tareas todavía"
              message="Apunta lo que tengas que hacer: una entrega, una llamada, lo que sea que no quieras olvidar."
            />
          )
        }
      />

      <Fab
        onPress={() => navigation.navigate('TaskForm')}
        accessibilityLabel="Crear tarea"
      />
    </Screen>
  );
}

const themedStyles = createStyles((theme) => ({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.layout.screenPadding,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunken,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  filtersRow: {
    flexGrow: 0,
    marginTop: theme.spacing.md,
  },
  filters: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.sm,
    // Deja sitio para que el botón flotante no tape la última tarea.
    paddingBottom: theme.layout.fab + theme.spacing.xxl,
  },
  listEmpty: {
    flexGrow: 1,
  },
}));
