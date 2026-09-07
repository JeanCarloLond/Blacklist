import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { Completion, CompletionEntity, DailyTotal } from '@/domain/models';
import type { DayKey } from '@/lib/date';
import { nowIso, todayKey } from '@/lib/date';
import { createId } from '@/lib/id';

/**
 * Acceso al registro de cumplimiento.
 *
 * Es el repositorio más caliente de la app: alimenta el heatmap, las rachas, el
 * resumen semanal y el estado de cada elemento en la lista de hoy.
 */

type CompletionRow = {
  id: string;
  entity_type: CompletionEntity;
  entity_id: string;
  day: string;
  value: number;
  note: string | null;
  created_at: string;
};

function toCompletion(row: CompletionRow): Completion {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    day: row.day,
    value: row.value,
    note: row.note,
    createdAt: row.created_at,
  };
}

/**
 * Registra (o actualiza) el cumplimiento de una entidad en un día.
 *
 * El `ON CONFLICT` es imprescindible: sin él, tocar dos veces el mismo día
 * insertaría dos filas y la racha contaría de más. Con él, la segunda pulsación
 * corrige el valor en lugar de duplicarlo.
 */
export async function logCompletion(
  db: SQLiteDatabase,
  entityType: CompletionEntity,
  entityId: string,
  options: { day?: DayKey; value?: number; note?: string | null } = {},
): Promise<void> {
  const day = options.day ?? todayKey();
  const value = options.value ?? 1;

  await db.runAsync(
    `INSERT INTO completion_log (id, entity_type, entity_id, day, value, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(entity_type, entity_id, day)
     DO UPDATE SET value = excluded.value, note = excluded.note`,
    createId(),
    entityType,
    entityId,
    day,
    value,
    options.note ?? null,
    nowIso(),
  );
}

/** Deshace el cumplimiento de un día concreto. */
export async function removeCompletion(
  db: SQLiteDatabase,
  entityType: CompletionEntity,
  entityId: string,
  day: DayKey = todayKey(),
): Promise<void> {
  await db.runAsync(
    'DELETE FROM completion_log WHERE entity_type = ? AND entity_id = ? AND day = ?',
    entityType,
    entityId,
    day,
  );
}

/**
 * Alterna el cumplimiento de un día. Devuelve `true` si queda completado.
 * Es lo que dispara el checkbox de la lista de hoy.
 */
export async function toggleCompletion(
  db: SQLiteDatabase,
  entityType: CompletionEntity,
  entityId: string,
  day: DayKey = todayKey(),
): Promise<boolean> {
  const existing = await getCompletion(db, entityType, entityId, day);
  if (existing) {
    await removeCompletion(db, entityType, entityId, day);
    return false;
  }
  await logCompletion(db, entityType, entityId, { day });
  return true;
}

export async function getCompletion(
  db: SQLiteDatabase,
  entityType: CompletionEntity,
  entityId: string,
  day: DayKey,
): Promise<Completion | null> {
  const row = await db.getFirstAsync<CompletionRow>(
    'SELECT * FROM completion_log WHERE entity_type = ? AND entity_id = ? AND day = ?',
    entityType,
    entityId,
    day,
  );
  return row ? toCompletion(row) : null;
}

/**
 * Ids ya completados hoy, para pintar el estado de una lista entera con una
 * sola consulta en vez de una por elemento.
 */
export async function completedIdsForDay(
  db: SQLiteDatabase,
  entityType: CompletionEntity,
  day: DayKey = todayKey(),
): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ entity_id: string }>(
    'SELECT entity_id FROM completion_log WHERE entity_type = ? AND day = ?',
    entityType,
    day,
  );
  return new Set(rows.map((row) => row.entity_id));
}

/** Historial de una entidad dentro de un rango, ordenado del día más antiguo. */
export async function listCompletionsForEntity(
  db: SQLiteDatabase,
  entityType: CompletionEntity,
  entityId: string,
  from: DayKey,
  to: DayKey,
): Promise<Completion[]> {
  const rows = await db.getAllAsync<CompletionRow>(
    `SELECT * FROM completion_log
     WHERE entity_type = ? AND entity_id = ? AND day BETWEEN ? AND ?
     ORDER BY day ASC`,
    entityType,
    entityId,
    from,
    to,
  );
  return rows.map(toCompletion);
}

/**
 * Todos los días con actividad de una entidad, del más reciente al más antiguo.
 *
 * Devuelve solo la columna `day` porque quien lo consume es el cálculo de
 * rachas, al que no le interesa ni el valor ni la nota. Traer la fila completa
 * multiplicaría por seis los datos cruzando el puente nativo sin ganar nada.
 */
export async function completionDays(
  db: SQLiteDatabase,
  entityType: CompletionEntity,
  entityId: string,
): Promise<DayKey[]> {
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT day FROM completion_log
     WHERE entity_type = ? AND entity_id = ?
     ORDER BY day DESC`,
    entityType,
    entityId,
  );
  return rows.map((row) => row.day);
}

/**
 * Consulta que alimenta el heatmap: un agregado por día dentro de un rango.
 *
 * Sin filtro devuelve la actividad combinada de tareas y metas; ésta es la
 * consulta que motivó unificar ambas en una sola tabla, porque aquí es un
 * `GROUP BY` sobre un índice y no un `UNION` de dos tablas.
 */
export async function dailyTotals(
  db: SQLiteDatabase,
  from: DayKey,
  to: DayKey,
  filter: { entityType?: CompletionEntity; entityId?: string } = {},
): Promise<DailyTotal[]> {
  const conditions = ['day BETWEEN ? AND ?'];
  const params: SQLiteBindValue[] = [from, to];

  if (filter.entityType) {
    conditions.push('entity_type = ?');
    params.push(filter.entityType);
  }
  if (filter.entityId) {
    conditions.push('entity_id = ?');
    params.push(filter.entityId);
  }

  const rows = await db.getAllAsync<{ day: string; total: number; count: number }>(
    `SELECT day, SUM(value) AS total, COUNT(*) AS count
     FROM completion_log
     WHERE ${conditions.join(' AND ')}
     GROUP BY day
     ORDER BY day ASC`,
    params,
  );

  return rows.map((row) => ({ day: row.day, total: row.total, count: row.count }));
}

/** Borra el historial de una entidad. Solo al eliminarla definitivamente. */
export async function deleteCompletionsFor(
  db: SQLiteDatabase,
  entityType: CompletionEntity,
  entityId: string,
): Promise<void> {
  await db.runAsync(
    'DELETE FROM completion_log WHERE entity_type = ? AND entity_id = ?',
    entityType,
    entityId,
  );
}
