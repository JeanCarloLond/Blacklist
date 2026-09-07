import type { DayKey, Weekday } from '@/lib/date';

/** 0 baja · 1 media · 2 alta. Se guarda como entero para poder ordenar en SQL. */
export type Priority = 0 | 1 | 2;

export const PRIORITY_LOW: Priority = 0;
export const PRIORITY_MEDIUM: Priority = 1;
export const PRIORITY_HIGH: Priority = 2;

/**
 * Frecuencia de una tarea.
 *
 * Se descarta RRULE/iCalendar a propósito: son ~40 KB de librería y un modelo
 * mental grande para cubrir casos ("cada tercer martes") que esta app no
 * necesita. Estos cinco tipos cubren todo lo previsto; si algún día hacen falta
 * reglas raras, se migra.
 */
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: Priority;
  /** Fecha límite. `null` = tarea sin fecha, vive en la bandeja. */
  dueDate: DayKey | null;
  /** Hora límite 'HH:mm', solo tiene sentido junto a `dueDate`. */
  dueTime: string | null;

  recurrenceType: RecurrenceType;
  /** Días de la semana en los que aplica, para 'weekly'. Vacío si no aplica. */
  recurrenceDays: Weekday[];
  /** Día del mes (1-31), para 'monthly'. */
  recurrenceDayOfMonth: number | null;

  /**
   * Momento en que se completó. Solo se usa en tareas **únicas**: las
   * recurrentes no tienen un "completada" global, sino una fila por día en
   * `completion_log`.
   */
  completedAt: string | null;
  /** Borrado suave: la tarea desaparece de las listas pero conserva historial. */
  archivedAt: string | null;

  createdAt: string;
  updatedAt: string;
};

/** True si la tarea se repite en el tiempo en lugar de completarse una vez. */
export function isRecurring(task: Task): boolean {
  return task.recurrenceType !== 'none';
}

/** Campos que el usuario rellena al crear una tarea. */
export type NewTask = {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  priority?: Priority;
  dueDate?: DayKey | null;
  dueTime?: string | null;
  recurrenceType?: RecurrenceType;
  recurrenceDays?: Weekday[];
  recurrenceDayOfMonth?: number | null;
};

/** Cambios parciales sobre una tarea existente. */
export type TaskUpdate = Partial<NewTask>;
