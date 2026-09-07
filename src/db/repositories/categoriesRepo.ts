import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category } from '@/domain/models';
import { nowIso } from '@/lib/date';
import { createId } from '@/lib/id';

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  position: number;
  created_at: string;
};

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    position: row.position,
    createdAt: row.created_at,
  };
}

export async function listCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY position ASC, name ASC',
  );
  return rows.map(toCategory);
}

export async function getCategory(
  db: SQLiteDatabase,
  id: string,
): Promise<Category | null> {
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ?',
    id,
  );
  return row ? toCategory(row) : null;
}

export async function createCategory(
  db: SQLiteDatabase,
  input: { name: string; color: string; icon?: string | null },
): Promise<Category> {
  const next = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM categories',
  );
  const category: Category = {
    id: createId(),
    name: input.name.trim(),
    color: input.color,
    icon: input.icon ?? null,
    position: next?.next ?? 0,
    createdAt: nowIso(),
  };

  await db.runAsync(
    `INSERT INTO categories (id, name, color, icon, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    category.id,
    category.name,
    category.color,
    category.icon,
    category.position,
    category.createdAt,
  );
  return category;
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  patch: { name?: string; color?: string; icon?: string | null },
): Promise<void> {
  const current = await getCategory(db, id);
  if (!current) return;

  await db.runAsync(
    'UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?',
    patch.name?.trim() ?? current.name,
    patch.color ?? current.color,
    patch.icon !== undefined ? patch.icon : current.icon,
    id,
  );
}

/**
 * Elimina la categoría. Las tareas y metas que la usaban **no** se borran: el
 * `ON DELETE SET NULL` del esquema las deja sin categoría.
 */
export async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', id);
}

/** Reordena según el orden del array recibido. */
export async function reorderCategories(
  db: SQLiteDatabase,
  orderedIds: string[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [index, id] of orderedIds.entries()) {
      await db.runAsync('UPDATE categories SET position = ? WHERE id = ?', index, id);
    }
  });
}
