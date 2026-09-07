import type { DayKey } from '@/lib/date';

/** Qué se completó: una tarea recurrente o una meta. */
export type CompletionEntity = 'task' | 'goal';

/**
 * Una unidad de cumplimiento en un día concreto.
 *
 * Tareas y metas comparten tabla a propósito. El heatmap general es la consulta
 * que más veces ejecuta la app, y con una sola tabla es un `GROUP BY day`; con
 * dos tablas sería un `UNION` en cada render.
 */
export type Completion = {
  id: string;
  entityType: CompletionEntity;
  entityId: string;
  day: DayKey;
  /** 1 para lo booleano; la cantidad lograda para metas cuantitativas. */
  value: number;
  note: string | null;
  createdAt: string;
};

/** Cumplimiento de un día, tal y como lo necesita el heatmap. */
export type DailyTotal = {
  day: DayKey;
  /** Suma de `value` de ese día. */
  total: number;
  /** Número de entidades distintas completadas ese día. */
  count: number;
};
