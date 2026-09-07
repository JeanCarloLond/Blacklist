import { create } from 'zustand';

import {
  archiveTask,
  completedIdsForDay,
  createTask,
  deleteTask,
  listTasks,
  setTaskCompleted,
  toggleCompletion,
  updateTask,
} from '@/db/repositories';
import type { NewTask, Task, TaskUpdate } from '@/domain/models';
import { tasksForDay } from '@/domain/recurrence';
import { todayKey } from '@/lib/date';

import { getDatabase } from './database';

export type TaskFilterState = {
  search: string;
  categoryId: string | null;
};

type TasksState = {
  /** Lista de la pantalla de Tareas, sujeta al filtro activo. */
  tasks: Task[];
  /** Lo que toca hoy, sin filtrar: la pantalla de Hoy ignora los filtros. */
  todayTasks: Task[];
  /** Ids de tareas recurrentes ya cumplidas hoy. */
  completedToday: Set<string>;
  loading: boolean;
  filter: TaskFilterState;

  refresh: () => Promise<void>;
  setFilter: (patch: Partial<TaskFilterState>) => Promise<void>;

  add: (input: NewTask) => Promise<void>;
  edit: (id: string, patch: TaskUpdate) => Promise<void>;
  toggleComplete: (task: Task) => Promise<void>;
  archive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;

  /** True si la tarea cuenta como hecha hoy, sea única o recurrente. */
  isDoneToday: (task: Task) => boolean;
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  todayTasks: [],
  completedToday: new Set(),
  loading: false,
  filter: { search: '', categoryId: null },

  /**
   * Recarga las dos listas y el registro de hoy.
   *
   * La lista filtrada se resuelve en SQL, pero la de hoy se filtra en memoria:
   * "¿toca hoy esta tarea semanal?" no se expresa en SQL sin contorsiones, y el
   * volumen (decenas o cientos de tareas) no justifica intentarlo.
   *
   * Se pide `includeCompleted` a propósito: al marcar una tarea queremos que se
   * quede tachada en su sitio un momento, no que desaparezca bajo el dedo.
   */
  refresh: async () => {
    const db = getDatabase();
    const { filter } = get();
    const today = todayKey();

    set({ loading: true });
    try {
      const [filtered, all, doneToday] = await Promise.all([
        listTasks(db, {
          search: filter.search,
          categoryId: filter.categoryId ?? undefined,
          includeCompleted: true,
        }),
        listTasks(db, { includeCompleted: true }),
        completedIdsForDay(db, 'task', today),
      ]);

      set({
        tasks: filtered,
        todayTasks: tasksForDay(all, today),
        completedToday: doneToday,
      });
    } finally {
      set({ loading: false });
    }
  },

  setFilter: async (patch) => {
    set({ filter: { ...get().filter, ...patch } });
    await get().refresh();
  },

  add: async (input) => {
    await createTask(getDatabase(), input);
    await get().refresh();
  },

  edit: async (id, patch) => {
    await updateTask(getDatabase(), id, patch);
    await get().refresh();
  },

  /**
   * Alterna el estado de una tarea.
   *
   * Las únicas y las recurrentes se guardan en sitios distintos, y esa
   * diferencia se resuelve aquí para que las pantallas no tengan que conocerla:
   * una tarea única marca su `completedAt`, mientras que una recurrente escribe
   * una fila del día en el registro de constancia, porque "hecha" para una
   * tarea diaria solo significa algo junto a una fecha.
   *
   * La lista en memoria se actualiza antes de escribir para que el control
   * responda en el mismo fotograma; la recarga posterior confirma.
   */
  toggleComplete: async (task) => {
    const db = getDatabase();
    const today = todayKey();

    if (task.recurrenceType === 'none') {
      const completed = task.completedAt === null;
      const completedAt = completed ? new Date().toISOString() : null;
      const apply = (list: Task[]) =>
        list.map((item) => (item.id === task.id ? { ...item, completedAt } : item));

      set({ tasks: apply(get().tasks), todayTasks: apply(get().todayTasks) });
      await setTaskCompleted(db, task.id, completed);
    } else {
      const next = new Set(get().completedToday);
      if (next.has(task.id)) next.delete(task.id);
      else next.add(task.id);

      set({ completedToday: next });
      await toggleCompletion(db, 'task', task.id, today);
    }

    await get().refresh();
  },

  archive: async (id) => {
    set({
      tasks: get().tasks.filter((task) => task.id !== id),
      todayTasks: get().todayTasks.filter((task) => task.id !== id),
    });
    await archiveTask(getDatabase(), id);
    await get().refresh();
  },

  remove: async (id) => {
    set({
      tasks: get().tasks.filter((task) => task.id !== id),
      todayTasks: get().todayTasks.filter((task) => task.id !== id),
    });
    await deleteTask(getDatabase(), id);
    await get().refresh();
  },

  isDoneToday: (task) =>
    task.recurrenceType === 'none'
      ? task.completedAt !== null
      : get().completedToday.has(task.id),
}));
