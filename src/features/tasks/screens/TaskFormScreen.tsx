import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import type { Priority, RecurrenceType } from '@/domain/models';
import {
  addDays,
  formatDayMonth,
  fromDayKey,
  toDayKey,
  todayKey,
  type DayKey,
  type Weekday,
} from '@/lib/date';
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

const RECURRENCES: [RecurrenceType, string][] = [
  ['none', 'Una vez'],
  ['daily', 'Cada día'],
  ['weekdays', 'De lunes a viernes'],
  ['weekly', 'Días concretos'],
  ['monthly', 'Cada mes'],
];

/** La semana empieza en lunes, como en el resto de la app. */
const WEEK: [Weekday, string][] = [
  [1, 'L'],
  [2, 'M'],
  [3, 'X'],
  [4, 'J'],
  [5, 'V'],
  [6, 'S'],
  [0, 'D'],
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
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    existing?.recurrenceType ?? 'none',
  );
  const [weekdays, setWeekdays] = useState<Weekday[]>(existing?.recurrenceDays ?? []);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const today = todayKey();
  const tomorrow = addDays(today, 1);
  const repeats = recurrence !== 'none';

  /**
   * Al pasar a recurrente hace falta una fecha de inicio: sin ella la serie no
   * tiene origen y las reglas semanales no sabrían desde cuándo contar. Se
   * asume hoy, que es lo que espera quien crea un hábito ahora mismo.
   */
  const handleRecurrenceChange = (value: RecurrenceType) => {
    setRecurrence(value);
    if (value !== 'none' && dueDate === null) setDueDate(today);
  };

  const toggleWeekday = (day: Weekday) => {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

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
        recurrenceType: recurrence,
        recurrenceDays: recurrence === 'weekly' ? weekdays : [],
        // El día del mes se deduce de la fecha de inicio en vez de pedirlo
        // aparte: un segundo selector para un dato que ya está implícito solo
        // añade una forma más de contradecirse.
        recurrenceDayOfMonth:
          recurrence === 'monthly' ? Number((dueDate ?? today).slice(8, 10)) : null,
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
            Repetición
          </Text>
          <View style={styles.optionsRow}>
            {RECURRENCES.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                selected={recurrence === value}
                onPress={() => handleRecurrenceChange(value)}
              />
            ))}
          </View>

          {recurrence === 'weekly' ? (
            <View style={styles.weekRow}>
              {WEEK.map(([day, label]) => {
                const selected = weekdays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleWeekday(day)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`Repetir los ${label}`}
                    style={[styles.weekDay, selected && styles.weekDaySelected]}
                  >
                    <Text
                      variant="label"
                      style={{
                        color: selected ? theme.colors.textOnAccent : theme.colors.textSecondary,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {recurrence === 'weekly' && weekdays.length === 0 ? (
            <Text variant="caption" color="textMuted">
              Sin días marcados se repetirá cada semana el mismo día en que empieza.
            </Text>
          ) : null}

          {recurrence === 'monthly' ? (
            <Text variant="caption" color="textMuted">
              Se repetirá el día {Number((dueDate ?? today).slice(8, 10))} de cada mes. En los
              meses más cortos, el último día.
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text variant="label" color="textSecondary">
            {repeats ? 'Empieza el' : 'Fecha límite'}
          </Text>
          <View style={styles.optionsRow}>
            {!repeats ? (
              <Chip
                label="Sin fecha"
                selected={dueDate === null}
                onPress={() => setDueDate(null)}
              />
            ) : null}
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
          {repeats ? (
            <Text variant="caption" color="textMuted">
              La tarea no aparecerá antes de esta fecha.
            </Text>
          ) : null}
        </View>

        {showPicker ? (
          <DateTimePicker
            value={dueDate ? fromDayKey(dueDate) : new Date()}
            mode="date"
            onChange={handleDateChange}
          />
        ) : null}

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
  weekRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  weekDay: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  weekDaySelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  save: {
    marginTop: theme.spacing.sm,
  },
}));
