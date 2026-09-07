import { create } from 'zustand';

import {
  archiveGoal,
  completionCountsInRange,
  createGoal,
  deleteGoal,
  listGoals,
  logCompletion,
  removeCompletion,
  updateGoal,
  valuesForDay,
} from '@/db/repositories';
import type { Goal, GoalUpdate, NewGoal } from '@/domain/models';
import { isGoalMet, selectGoalsForDay } from '@/domain/goalSchedule';
import { startOfWeek, todayKey } from '@/lib/date';

import { getDatabase } from './database';

type GoalsState = {
  goals: Goal[];
  /** Cantidad registrada hoy por meta. Ausente = sin registro. */
  todayValues: Map<string, number>;
  /** Días cumplidos en la semana en curso, para las metas por veces/semana. */
  weekCounts: Map<string, number>;
  loading: boolean;

  refresh: () => Promise<void>;
  add: (input: NewGoal) => Promise<void>;
  edit: (id: string, patch: GoalUpdate) => Promise<void>;
  archive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;

  /** Marca o desmarca una meta booleana. */
  toggleToday: (goal: Goal) => Promise<void>;
  /** Suma (o resta, con delta negativo) avance a una meta cuantitativa. */
  addProgress: (goal: Goal, delta: number) => Promise<void>;

  valueToday: (goal: Goal) => number;
  isDoneToday: (goal: Goal) => boolean;
  /** Metas que procede mostrar hoy, cupo semanal incluido. */
  goalsForToday: () => Goal[];
};

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  todayValues: new Map(),
  weekCounts: new Map(),
  loading: false,

  refresh: async () => {
    const db = getDatabase();
    const today = todayKey();

    set({ loading: true });
    try {
      const [goals, todayValues, weekCounts] = await Promise.all([
        listGoals(db),
        valuesForDay(db, 'goal', today),
        completionCountsInRange(db, 'goal', startOfWeek(today), today),
      ]);
      set({ goals, todayValues, weekCounts });
    } finally {
      set({ loading: false });
    }
  },

  add: async (input) => {
    await createGoal(getDatabase(), input);
    await get().refresh();
  },

  edit: async (id, patch) => {
    await updateGoal(getDatabase(), id, patch);
    await get().refresh();
  },

  archive: async (id) => {
    set({ goals: get().goals.filter((goal) => goal.id !== id) });
    await archiveGoal(getDatabase(), id);
    await get().refresh();
  },

  remove: async (id) => {
    set({ goals: get().goals.filter((goal) => goal.id !== id) });
    await deleteGoal(getDatabase(), id);
    await get().refresh();
  },

  /**
   * Marca o desmarca el día.
   *
   * La actualización en memoria va antes de escribir para que el control
   * responda en el mismo fotograma; la recarga posterior confirma.
   */
  toggleToday: async (goal) => {
    const db = getDatabase();
    const today = todayKey();
    const current = get().todayValues.get(goal.id) ?? 0;
    const next = new Map(get().todayValues);

    if (current > 0) {
      next.delete(goal.id);
      set({ todayValues: next });
      await removeCompletion(db, 'goal', goal.id, today);
    } else {
      next.set(goal.id, 1);
      set({ todayValues: next });
      await logCompletion(db, 'goal', goal.id, { day: today, value: 1 });
    }

    await get().refresh();
  },

  /**
   * Ajusta el avance de una meta cuantitativa.
   *
   * Al llegar a cero se borra la fila en vez de guardar un 0: un cero
   * almacenado pintaría el día como "hubo actividad" en el heatmap, cuando la
   * verdad es que ese día no hubo nada.
   */
  addProgress: async (goal, delta) => {
    const db = getDatabase();
    const today = todayKey();
    const current = get().todayValues.get(goal.id) ?? 0;
    const value = Math.max(0, current + delta);

    const next = new Map(get().todayValues);
    if (value === 0) next.delete(goal.id);
    else next.set(goal.id, value);
    set({ todayValues: next });

    if (value === 0) await removeCompletion(db, 'goal', goal.id, today);
    else await logCompletion(db, 'goal', goal.id, { day: today, value });

    await get().refresh();
  },

  valueToday: (goal) => get().todayValues.get(goal.id) ?? 0,

  isDoneToday: (goal) => isGoalMet(goal, get().todayValues.get(goal.id) ?? 0),

  /**
   * Metas que procede mostrar hoy.
   *
   * La regla vive en `selectGoalsForDay`, en la capa de dominio, para poder
   * probarla con cualquier fecha; aquí solo se le pasa el estado actual.
   */
  goalsForToday: () => {
    const { goals, weekCounts, todayValues } = get();
    return selectGoalsForDay(goals, todayKey(), weekCounts, todayValues);
  },
}));
