import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { NewTask, Priority, RecurrenceType, Task, TaskUpdate } from '@/domain/models';
import { nowIso } from '@/lib/date';
import { createId } from '@/lib/id';

import { parseWeekdays, serializeWeekdays } from './mappers';

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  priority: number;
  due_date: string | null;
  due_time: string | null;
  recurrence_type: RecurrenceType;
  recurrence_days: string | null;
  recurrence_day_of_month: number | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    priority: (row.priority as Priority) ?? 1,
    dueDate: row.due_date,
    dueTime: row.due_time,
    recurrenceType: row.recurrence_type,
    recurrenceDays: parseWeekdays(row.recurrence_days),
    recurrenceDayOfMonth: row.recurrence_day_of_month,
    completedAt: row.completed_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type TaskFilter = {
  categoryId?: string;
  /** Búsqueda por título y descripción. */
  search?: string;
  /** Incluir tareas únicas ya completadas. Por defecto no. */
  includeCompleted?: boolean;
  /** Incluir archivadas. Por defecto no. */
  includeArchived?: boolean;
};

/**
 * Lista de tareas ordenada como se muestra en pantalla: primero las pendientes,
 * luego por prioridad y por fecha límite. Se ordena en SQL y no en JavaScript
 * para no traer y reordenar toda la tabla en cada render.
 *
 * Las tareas sin fecha van al final: `due_date IS NULL` se evalúa como 0 o 1,
 * así que ordenar por esa expresión antes que por la fecha empuja los nulos
 * abajo, en vez de dejarlos arriba como haría SQLite por defecto.
 */
export async function listTasks(
  db: SQLiteDatabase,
  filter: TaskFilter = {},
): Promise<Task[]> {
  const conditions: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (!filter.includeArchived) conditions.push('archived_at IS NULL');
  if (!filter.includeCompleted) conditions.push('completed_at IS NULL');
  if (filter.categoryId) {
    conditions.push('category_id = ?');
    params.push(filter.categoryId);
  }
  if (filter.search?.trim()) {
    conditions.push("(title LIKE ? OR IFNULL(description, '') LIKE ?)");
    const pattern = `%${filter.search.trim()}%`;
    params.push(pattern, pattern);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     ${where}
     ORDER BY completed_at IS NOT NULL,
              priority DESC,
              due_date IS NULL,
              due_date ASC,
              created_at ASC`,
    params,
  );
  return rows.map(toTask);
}

export async function getTask(db: SQLiteDatabase, id: string): Promise<Task | null> {
  const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?', id);
  return row ? toTask(row) : null;
}

/** Tareas recurrentes vivas, base para resolver qué toca en un día concreto. */
export async function listRecurringTasks(db: SQLiteDatabase): Promise<Task[]> {
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE archived_at IS NULL AND recurrence_type != 'none'
     ORDER BY priority DESC, created_at ASC`,
  );
  return rows.map(toTask);
}

export async function createTask(db: SQLiteDatabase, input: NewTask): Promise<Task> {
  const timestamp = nowIso();
  const task: Task = {
    id: createId(),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    categoryId: input.categoryId ?? null,
    priority: input.priority ?? 1,
    dueDate: input.dueDate ?? null,
    dueTime: input.dueTime ?? null,
    recurrenceType: input.recurrenceType ?? 'none',
    recurrenceDays: input.recurrenceDays ?? [],
    recurrenceDayOfMonth: input.recurrenceDayOfMonth ?? null,
    completedAt: null,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO tasks (
       id, title, description, category_id, priority, due_date, due_time,
       recurrence_type, recurrence_days, recurrence_day_of_month,
       completed_at, archived_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    task.id,
    task.title,
    task.description,
    task.categoryId,
    task.priority,
    task.dueDate,
    task.dueTime,
    task.recurrenceType,
    serializeWeekdays(task.recurrenceDays),
    task.recurrenceDayOfMonth,
    task.completedAt,
    task.archivedAt,
    task.createdAt,
    task.updatedAt,
  );
  return task;
}

/**
 * Actualiza solo los campos presentes en el parche.
 *
 * Se construye el SET dinámicamente en vez de leer, fusionar y reescribir la
 * fila entera: así dos ediciones de campos distintos no se pisan entre sí.
 */
export async function updateTask(
  db: SQLiteDatabase,
  id: string,
  patch: TaskUpdate,
): Promise<void> {
  const assignments: string[] = [];
  const params: SQLiteBindValue[] = [];

  const set = (column: string, value: SQLiteBindValue) => {
    assignments.push(`${column} = ?`);
    params.push(value);
  };

  if (patch.title !== undefined) set('title', patch.title.trim());
  if (patch.description !== undefined) {
    set('description', patch.description?.trim() || null);
  }
  if (patch.categoryId !== undefined) set('category_id', patch.categoryId);
  if (patch.priority !== undefined) set('priority', patch.priority);
  if (patch.dueDate !== undefined) set('due_date', patch.dueDate);
  if (patch.dueTime !== undefined) set('due_time', patch.dueTime);
  if (patch.recurrenceType !== undefined) set('recurrence_type', patch.recurrenceType);
  if (patch.recurrenceDays !== undefined) {
    set('recurrence_days', serializeWeekdays(patch.recurrenceDays));
  }
  if (patch.recurrenceDayOfMonth !== undefined) {
    set('recurrence_day_of_month', patch.recurrenceDayOfMonth);
  }

  if (assignments.length === 0) return;

  set('updated_at', nowIso());
  params.push(id);

  await db.runAsync(`UPDATE tasks SET ${assignments.join(', ')} WHERE id = ?`, params);
}

/**
 * Marca o desmarca una tarea única.
 *
 * Las recurrentes no pasan por aquí: su cumplimiento es por día y vive en
 * `completion_log`, porque "hecha" para una tarea diaria solo significa algo
 * junto a una fecha concreta.
 */
export async function setTaskCompleted(
  db: SQLiteDatabase,
  id: string,
  completed: boolean,
): Promise<void> {
  const timestamp = nowIso();
  await db.runAsync(
    'UPDATE tasks SET completed_at = ?, updated_at = ? WHERE id = ?',
    completed ? timestamp : null,
    timestamp,
    id,
  );
}

/** Borrado suave: sale de las listas pero conserva su historial. */
export async function archiveTask(db: SQLiteDatabase, id: string): Promise<void> {
  const timestamp = nowIso();
  await db.runAsync(
    'UPDATE tasks SET archived_at = ?, updated_at = ? WHERE id = ?',
    timestamp,
    timestamp,
    id,
  );
}

export async function restoreTask(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'UPDATE tasks SET archived_at = NULL, updated_at = ? WHERE id = ?',
    nowIso(),
    id,
  );
}

/**
 * Borrado definitivo, incluido su historial de cumplimiento.
 *
 * Las subtareas caen solas por ON DELETE CASCADE, pero `completion_log` no
 * tiene clave foránea (apunta a dos tablas distintas según `entity_type`), así
 * que hay que limpiarlo a mano dentro de la misma transacción.
 */
export async function deleteTask(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "DELETE FROM completion_log WHERE entity_type = 'task' AND entity_id = ?",
      id,
    );
    await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
  });
}
