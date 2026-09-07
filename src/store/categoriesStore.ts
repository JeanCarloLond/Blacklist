import { create } from 'zustand';

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/db/repositories';
import type { Category } from '@/domain/models';

import { getDatabase } from './database';

type CategoriesState = {
  categories: Category[];
  loaded: boolean;
  refresh: () => Promise<void>;
  add: (input: { name: string; color: string; icon?: string | null }) => Promise<Category>;
  edit: (
    id: string,
    patch: { name?: string; color?: string; icon?: string | null },
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Búsqueda por id sin recorrer la lista en cada tarjeta de tarea. */
  byId: (id: string | null) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loaded: false,

  refresh: async () => {
    const categories = await listCategories(getDatabase());
    set({ categories, loaded: true });
  },

  add: async (input) => {
    const category = await createCategory(getDatabase(), input);
    await get().refresh();
    return category;
  },

  edit: async (id, patch) => {
    await updateCategory(getDatabase(), id, patch);
    await get().refresh();
  },

  remove: async (id) => {
    await deleteCategory(getDatabase(), id);
    await get().refresh();
  },

  byId: (id) => (id ? get().categories.find((category) => category.id === id) : undefined),
}));
