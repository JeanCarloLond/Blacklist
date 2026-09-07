import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { DEFAULT_GOAL_COLOR, GOAL_COLORS } from '@/constants/goalColors';
import type { GoalKind, GoalScheduleType } from '@/domain/models';
import type { Weekday } from '@/lib/date';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/providers/ThemeProvider';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useGoalsStore } from '@/store/goalsStore';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

const KINDS: [GoalKind, string, string][] = [
  ['boolean', 'Sí o no', 'La cumples o no la cumples'],
  ['quantitative', 'Con cantidad', 'Mides cuánto haces cada día'],
];

const SCHEDULES: [GoalScheduleType, string][] = [
  ['daily', 'Cada día'],
  ['weekdays', 'Días concretos'],
  ['times_per_week', 'Veces por semana'],
];

const WEEK: [Weekday, string][] = [
  [1, 'L'],
  [2, 'M'],
  [3, 'X'],
  [4, 'J'],
  [5, 'V'],
  [6, 'S'],
  [0, 'D'],
];

export function GoalFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'GoalForm'>>();
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  const goalId = route.params?.goalId;
  const goals = useGoalsStore((state) => state.goals);
  const addGoal = useGoalsStore((state) => state.add);
  const editGoal = useGoalsStore((state) => state.edit);
  const removeGoal = useGoalsStore((state) => state.remove);
  const categories = useCategoriesStore((state) => state.categories);

  const existing = useMemo(
    () => (goalId ? goals.find((goal) => goal.id === goalId) : undefined),
    [goalId, goals],
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [color, setColor] = useState<string>(existing?.color ?? DEFAULT_GOAL_COLOR);
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [kind, setKind] = useState<GoalKind>(existing?.kind ?? 'boolean');
  const [target, setTarget] = useState(
    existing?.targetValue !== null && existing?.targetValue !== undefined
      ? String(existing.targetValue)
      : '',
  );
  const [unit, setUnit] = useState(existing?.unit ?? '');
  const [scheduleType, setScheduleType] = useState<GoalScheduleType>(
    existing?.scheduleType ?? 'daily',
  );
  const [scheduleDays, setScheduleDays] = useState<Weekday[]>(existing?.scheduleDays ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState(existing?.timesPerWeek ?? 3);
  const [errors, setErrors] = useState<{ title?: string; target?: string }>({});
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: Weekday) => {
    setScheduleDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const parsedTarget = Number(target.replace(',', '.'));
    const next: { title?: string; target?: string } = {};

    if (trimmedTitle.length === 0) {
      next.title = 'Ponle un nombre para poder guardarla.';
    }
    if (kind === 'quantitative' && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
      next.target = 'Indica un objetivo mayor que cero.';
    }
    if (next.title || next.target) {
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: trimmedTitle,
        description: description.trim() || null,
        color,
        categoryId,
        kind,
        targetValue: kind === 'quantitative' ? parsedTarget : null,
        unit: kind === 'quantitative' ? unit.trim() || null : null,
        scheduleType,
        scheduleDays: scheduleType === 'weekdays' ? scheduleDays : [],
        timesPerWeek: scheduleType === 'times_per_week' ? timesPerWeek : null,
      };

      if (existing) await editGoal(existing.id, payload);
      else await addGoal(payload);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(
      'Eliminar meta',
      'Se borrará junto con todo su historial de constancia. Si solo quieres dejar de verla, archívala desde la lista: así conservas las rachas que ya llevas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeGoal(existing.id);
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
          title={existing ? 'Editar meta' : 'Nueva meta'}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <View style={styles.form}>
        <TextField
          label="Nombre"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors({ ...errors, title: undefined });
          }}
          placeholder="Tocar guitarra, entrenar, leer…"
          error={errors.title}
          autoFocus={!existing}
        />

        <TextField
          label="Descripción (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Por qué te importa, o cómo la cuentas"
          multiline
        />

        <View style={styles.field}>
          <Text variant="label" color="textSecondary">
            Cómo se mide
          </Text>
          <View style={styles.kindRow}>
            {KINDS.map(([value, label, hint]) => {
              const selected = kind === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setKind(value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.kindCard, selected && { borderColor: color }]}
                >
                  <Text variant="bodyStrong" color={selected ? 'text' : 'textSecondary'}>
                    {label}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {kind === 'quantitative' ? (
          <View style={styles.quantRow}>
            <View style={styles.quantTarget}>
              <TextField
                label="Objetivo diario"
                value={target}
                onChangeText={(text) => {
                  setTarget(text);
                  if (errors.target) setErrors({ ...errors, target: undefined });
                }}
                placeholder="20"
                keyboardType="numeric"
                error={errors.target}
              />
            </View>
            <View style={styles.quantUnit}>
              <TextField
                label="Unidad"
                value={unit}
                onChangeText={setUnit}
                placeholder="min"
                autoCapitalize="none"
              />
            </View>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text variant="label" color="textSecondary">
            Frecuencia
          </Text>
          <View style={styles.optionsRow}>
            {SCHEDULES.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                selected={scheduleType === value}
                onPress={() => setScheduleType(value)}
              />
            ))}
          </View>

          {scheduleType === 'weekdays' ? (
            <View style={styles.weekRow}>
              {WEEK.map(([day, label]) => {
                const selected = scheduleDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleDay(day)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`Repetir los ${label}`}
                    style={[
                      styles.weekDay,
                      selected && { backgroundColor: color, borderColor: color },
                    ]}
                  >
                    <Text
                      variant="label"
                      style={{
                        color: selected
                          ? theme.colors.textOnAccent
                          : theme.colors.textSecondary,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {scheduleType === 'times_per_week' ? (
            <View style={styles.optionsRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((times) => (
                <Chip
                  key={times}
                  label={String(times)}
                  selected={timesPerWeek === times}
                  onPress={() => setTimesPerWeek(times)}
                />
              ))}
            </View>
          ) : null}

          {scheduleType === 'times_per_week' ? (
            <Text variant="caption" color="textMuted">
              Cualquier día cuenta. Cuando completes las {timesPerWeek} de la semana, dejará de
              aparecer en Hoy hasta la semana siguiente.
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text variant="label" color="textSecondary">
            Color
          </Text>
          <View style={styles.optionsRow}>
            {GOAL_COLORS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setColor(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected: color === option }}
                accessibilityLabel={`Color ${option}`}
                style={[styles.colorSwatch, { backgroundColor: option }]}
              >
                {color === option ? (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                ) : null}
              </Pressable>
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

        <Button
          label={existing ? 'Guardar cambios' : 'Crear meta'}
          onPress={() => void handleSave()}
          loading={saving}
          block
          style={styles.save}
        />

        {existing ? (
          <Button
            label="Eliminar meta"
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
  kindRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  kindCard: {
    flex: 1,
    gap: 2,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  quantRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quantTarget: {
    flex: 2,
  },
  quantUnit: {
    flex: 1,
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
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: {
    marginTop: theme.spacing.sm,
  },
}));
