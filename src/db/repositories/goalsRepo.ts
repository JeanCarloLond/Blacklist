import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { Goal, GoalKind, GoalScheduleType, GoalUpdate, NewGoal } from '@/domain/models';
import { nowIso, todayKey } from '@/lib/date';
import { createId } from '@/lib/id';

import { parseWeekdays, serializeWeekdays } from './mappers';

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  color: string | null;
  icon: string | null;
  kind: GoalKind;
  target_value: number | null;
  unit: string | null;
  schedule_type: GoalScheduleType;
  schedule_days: string | null;
  times_per_week: number | null;
  started_at: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    color: row.color,
    icon: row.icon,
    kind: row.kind,
    targetValue: row.target_value,
    unit: row.unit,
    scheduleType: row.schedule_type,
    scheduleDays: parseWeekdays(row.schedule_days),
    timesPerWeek: row.times_per_week,
    startedAt: row.started_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Metas vivas, en orden de creación.
 *
 * A diferencia de las tareas, no se ordenan por urgencia: una meta no vence, y
 * reordenarlas cada día por un criterio calculado haría que el usuario perdiera
 * la referencia espacial de dónde está cada una en la lista.
 */
export async function listGoals(
  db: SQLiteDatabase,
  options: { includeArchived?: boolean; categoryId?: string } = {},
): Promise<Goal[]> {
  const conditions: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (!options.includeArchived) conditions.push('archived_at IS NULL');
  if (options.categoryId) {
    conditions.push('category_id = ?');
    params.push(options.categoryId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await db.getAllAsync<GoalRow>(
    `SELECT * FROM goals ${where} ORDER BY created_at ASC`,
    params,
  );
  return rows.map(toGoal);
}

export async function getGoal(db: SQLiteDatabase, id: string): Promise<Goal | null> {
  const row = await db.getFirstAsync<GoalRow>('SELECT * FROM goals WHERE id = ?', id);
  return row ? toGoal(row) : null;
}

/**
 * Crea una meta.
 *
 * El objetivo se normaliza según el tipo antes de tocar la base: una meta
 * booleana guarda `target_value` nulo y una cuantitativa exige valor. El
 * esquema tiene un CHECK que lo impone, pero normalizar aquí evita que un
 * formulario a medio rellenar reviente con un error de SQL en la cara.
 */
export async function createGoal(db: SQLiteDatabase, input: NewGoal): Promise<Goal> {
  const timestamp = nowIso();
  const kind = input.kind ?? 'boolean';
  const targetValue = kind === 'quantitative' ? (input.targetValue ?? 1) : null;

  const goal: Goal = {
    id: createId(),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    categoryId: input.categoryId ?? null,
    color: input.color ?? null,
    icon: input.icon ?? null,
    kind,
    targetValue,
    unit: kind === 'quantitative' ? (input.unit?.trim() || null) : null,
    scheduleType: input.scheduleType ?? 'daily',
    scheduleDays: input.scheduleDays ?? [],
    timesPerWeek: input.scheduleType === 'times_per_week' ? (input.timesPerWeek ?? 3) : null,
    startedAt: input.startedAt ?? todayKey(),
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO goals (
       id, title, description, category_id, color, icon, kind, target_value, unit,
       schedule_type, schedule_days, times_per_week, started_at, archived_at,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    goal.id,
    goal.title,
    goal.description,
    goal.categoryId,
    goal.color,
    goal.icon,
    goal.kind,
    goal.targetValue,
    goal.unit,
    goal.scheduleType,
    serializeWeekdays(goal.scheduleDays),
    goal.timesPerWeek,
    goal.startedAt,
    goal.archivedAt,
    goal.createdAt,
    goal.updatedAt,
  );
  return goal;
}

/**
 * Actualiza una meta.
 *
 * Cambiar de tipo obliga a ajustar `target_value` y `unit` a la vez, o el CHECK
 * del esquema rechaza la fila. Por eso el tipo y el objetivo se resuelven
 * juntos, leyendo el estado actual, en lugar de campo a campo.
 */
export async function updateGoal(
  db: SQLiteDatabase,
  id: string,
  patch: GoalUpdate,
): Promise<void> {
  const current = await getGoal(db, id);
  if (!current) return;

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
  if (patch.color !== undefined) set('color', patch.color);
  if (patch.icon !== undefined) set('icon', patch.icon);

  if (patch.kind !== undefined || patch.targetValue !== undefined || patch.unit !== undefined) {
    const kind = patch.kind ?? current.kind;
    const targetValue =
      kind === 'quantitative'
        ? (patch.targetValue ?? current.targetValue ?? 1)
        : null;
    const unit =
      kind === 'quantitative' ? (patch.unit?.trim() ?? current.unit ?? null) : null;

    set('kind', kind);
    set('target_value', targetValue);
    set('unit', unit);
  }

  if (patch.scheduleType !== undefined || patch.timesPerWeek !== undefined) {
    const scheduleType = patch.scheduleType ?? current.scheduleType;
    set('schedule_type', scheduleType);
    set(
      'times_per_week',
      scheduleType === 'times_per_week'
        ? (patch.timesPerWeek ?? current.timesPerWeek ?? 3)
        : null,
    );
  }
  if (patch.scheduleDays !== undefined) {
    set('schedule_days', serializeWeekdays(patch.scheduleDays));
  }
  if (patch.startedAt !== undefined) set('started_at', patch.startedAt);

  if (assignments.length === 0) return;

  set('updated_at', nowIso());
  params.push(id);

  await db.runAsync(`UPDATE goals SET ${assignments.join(', ')} WHERE id = ?`, params);
}

/**
 * Archiva la meta conservando su historial.
 *
 * Es la operación que debe ofrecer la interfaz por defecto: si alguien deja de
 * entrenar, su racha de tres meses sigue siendo parte de su historia y no tiene
 * por qué desaparecer del heatmap.
 */
export async function archiveGoal(db: SQLiteDatabase, id: string): Promise<void> {
  const timestamp = nowIso();
  await db.runAsync(
    'UPDATE goals SET archived_at = ?, updated_at = ? WHERE id = ?',
    timestamp,
    timestamp,
    id,
  );
}

export async function restoreGoal(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'UPDATE goals SET archived_at = NULL, updated_at = ? WHERE id = ?',
    nowIso(),
    id,
  );
}

/** Borrado definitivo, historial de constancia incluido. */
export async function deleteGoal(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "DELETE FROM completion_log WHERE entity_type = 'goal' AND entity_id = ?",
      id,
    );
    await db.runAsync('DELETE FROM goals WHERE id = ?', id);
  });
}
