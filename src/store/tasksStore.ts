import { create } from 'zustand';

import {
  archiveTask,
  createTask,
  deleteTask,
  listTasks,
  setTaskCompleted,
  updateTask,
} from '@/db/repositories';
import type { NewTask, Task, TaskUpdate } from '@/domain/models';

import { getDatabase } from './database';

export type TaskFilterState = {
  search: string;
  categoryId: string | null;
};

type TasksState = {
  tasks: Task[];
  loading: boolean;
  filter: TaskFilterState;

  refresh: () => Promise<void>;
  setFilter: (patch: Partial<TaskFilterState>) => Promise<void>;

  add: (input: NewTask) => Promise<void>;
  edit: (id: string, patch: TaskUpdate) => Promise<void>;
  toggleComplete: (task: Task) => Promise<void>;
  archive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  filter: { search: '', categoryId: null },

  /**
   * Recarga la lista aplicando el filtro actual.
   *
   * Se pide `includeCompleted` a propósito: al marcar una tarea queremos que se
   * quede tachada en su sitio un momento, no que desaparezca de golpe bajo el
   * dedo. El repositorio ya las devuelve ordenadas al final de la lista.
   */
  refresh: async () => {
    const { filter } = get();
    set({ loading: true });
    try {
      const tasks = await listTasks(getDatabase(), {
        search: filter.search,
        categoryId: filter.categoryId ?? undefined,
        includeCompleted: true,
      });
      set({ tasks });
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
   * Alterna el estado de una tarea única.
   *
   * Se actualiza la lista en memoria antes de tocar la base para que el
   * checkbox responda en el mismo fotograma de la pulsación. La escritura va
   * después y la recarga confirma; si algo fallara, la recarga devolvería el
   * estado real.
   */
  toggleComplete: async (task) => {
    const completed = task.completedAt === null;
    const completedAt = completed ? new Date().toISOString() : null;

    set({
      tasks: get().tasks.map((item) =>
        item.id === task.id ? { ...item, completedAt } : item,
      ),
    });

    await setTaskCompleted(getDatabase(), task.id, completed);
    await get().refresh();
  },

  archive: async (id) => {
    set({ tasks: get().tasks.filter((task) => task.id !== id) });
    await archiveTask(getDatabase(), id);
    await get().refresh();
  },

  remove: async (id) => {
    set({ tasks: get().tasks.filter((task) => task.id !== id) });
    await deleteTask(getDatabase(), id);
    await get().refresh();
  },
}));
