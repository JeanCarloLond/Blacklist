import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import type { Priority } from '@/domain/models';
import { addDays, formatDayMonth, fromDayKey, toDayKey, todayKey, type DayKey } from '@/lib/date';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/providers/ThemeProvider';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useTasksStore } from '@/store/tasksStore';
import { priorityColor } from '@/theme';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

const PRIORITIES: [Priority, string][] = [
  [0, 'Baja'],
  [1, 'Media'],
  [2, 'Alta'],
];

export function TaskFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'TaskForm'>>();
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  const taskId = route.params?.taskId;
  const tasks = useTasksStore((state) => state.tasks);
  const addTask = useTasksStore((state) => state.add);
  const editTask = useTasksStore((state) => state.edit);
  const removeTask = useTasksStore((state) => state.remove);
  const categories = useCategoriesStore((state) => state.categories);

  const existing = useMemo(
    () => (taskId ? tasks.find((task) => task.id === taskId) : undefined),
    [taskId, tasks],
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 1);
  const [dueDate, setDueDate] = useState<DayKey | null>(existing?.dueDate ?? null);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const today = todayKey();
  const tomorrow = addDays(today, 1);

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && date) setDueDate(toDayKey(date));
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      setError('Ponle un título para poder guardarla.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: trimmed,
        description: description.trim() || null,
        categoryId,
        priority,
        dueDate,
      };
      if (existing) await editTask(existing.id, payload);
      else await addTask(payload);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(
      'Eliminar tarea',
      'Se borrará junto con su historial. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeTask(existing.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <Screen
      scroll
      header={
        <ScreenHeader
          title={existing ? 'Editar tarea' : 'Nueva tarea'}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <View style={styles.form}>
        <TextField
          label="Título"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (error) setError(undefined);
          }}
          placeholder="¿Qué tienes que hacer?"
          error={error}
          autoFocus={!existing}
          returnKeyType="next"
        />

        <TextField
          label="Descripción (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Detalles, contexto, enlaces…"
          multiline
        />

        <View style={styles.field}>
          <Text variant="label" color="textSecondary">
            Prioridad
          </Text>
          <View style={styles.optionsRow}>
            {PRIORITIES.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                selected={priority === value}
                dotColor={priorityColor(theme.colors, value)}
                onPress={() => setPriority(value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="label" color="textSecondary">
            Categoría
          </Text>
          <View style={styles.optionsRow}>
            <Chip
              label="Ninguna"
              selected={categoryId === null}
              onPress={() => setCategoryId(null)}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                dotColor={category.color}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="label" color="textSecondary">
            Fecha límite
          </Text>
          <View style={styles.optionsRow}>
            <Chip
              label="Sin fecha"
              selected={dueDate === null}
              onPress={() => setDueDate(null)}
            />
            <Chip label="Hoy" selected={dueDate === today} onPress={() => setDueDate(today)} />
            <Chip
              label="Mañana"
              selected={dueDate === tomorrow}
              onPress={() => setDueDate(tomorrow)}
            />
            <Chip
              label={
                dueDate && dueDate !== today && dueDate !== tomorrow
                  ? formatDayMonth(dueDate)
                  : 'Otro día'
              }
              selected={dueDate !== null && dueDate !== today && dueDate !== tomorrow}
              onPress={() => setShowPicker(true)}
            />
          </View>
        </View>

        {showPicker ? (
          <DateTimePicker
            value={dueDate ? fromDayKey(dueDate) : new Date()}
            mode="date"
            onChange={handleDateChange}
          />
        ) : null}

        <Button
          label={existing ? 'Guardar cambios' : 'Crear tarea'}
          onPress={() => void handleSave()}
          loading={saving}
          block
          style={styles.save}
        />

        {existing ? (
          <Button
            label="Eliminar tarea"
            variant="danger"
            icon="trash-outline"
            onPress={handleDelete}
            block
          />
        ) : null}
      </View>
    </Screen>
  );
}

const themedStyles = createStyles((theme) => ({
  form: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  field: {
    gap: theme.spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  save: {
    marginTop: theme.spacing.sm,
  },
}));
