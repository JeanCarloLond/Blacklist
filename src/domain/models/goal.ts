import type { DayKey, Weekday } from '@/lib/date';

/**
 * Tipo de meta.
 *
 * - `boolean`: se cumple o no ("ir a la universidad").
 * - `quantitative`: se mide contra un objetivo ("leer 20 min"), lo que permite
 *   representar cumplimiento parcial en el heatmap.
 */
export type GoalKind = 'boolean' | 'quantitative';

/**
 * Cada cuánto toca la meta.
 *
 * `times_per_week` es distinto de los demás: no fija qué días, sino cuántas
 * veces ("entrenar 3 veces por semana"). La racha de este tipo se cuenta por
 * semanas cumplidas, no por días seguidos.
 */
export type GoalScheduleType = 'daily' | 'weekdays' | 'times_per_week';

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  /** Color propio de la meta, que tiñe su heatmap. `null` = usa el acento. */
  color: string | null;
  icon: string | null;

  kind: GoalKind;
  /** Objetivo diario para metas cuantitativas (p. ej. 20). */
  targetValue: number | null;
  /** Unidad legible del objetivo ('min', 'páginas', 'reps'). */
  unit: string | null;

  scheduleType: GoalScheduleType;
  /** Días en que aplica, para `weekdays`. */
  scheduleDays: Weekday[];
  /** Veces por semana, para `times_per_week`. */
  timesPerWeek: number | null;

  /** Desde cuándo cuenta la meta. La constancia previa no existe. */
  startedAt: DayKey;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewGoal = {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  color?: string | null;
  icon?: string | null;
  kind?: GoalKind;
  targetValue?: number | null;
  unit?: string | null;
  scheduleType?: GoalScheduleType;
  scheduleDays?: Weekday[];
  timesPerWeek?: number | null;
  startedAt?: DayKey;
};

export type GoalUpdate = Partial<NewGoal>;
