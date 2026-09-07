import type { Task } from '@/domain/models';
import {
  daysBetween,
  daysInMonth,
  toDayKey,
  weekdayLabel,
  weekdayOf,
  type DayKey,
  type Weekday,
} from '@/lib/date';

/**
 * Resolución de recurrencia: dado un día, ¿toca esta tarea?
 *
 * Lógica pura, sin React ni SQL, porque es la parte con más aristas de la app y
 * conviene poder probarla aislada. Las reglas no se materializan en la base:
 * una tarea diaria no crea 365 filas, guarda su regla y aquí se calcula qué
 * toca. Materializar el futuro hincharía la base y obligaría a regenerarlo cada
 * vez que se edita la regla.
 */

const WEEKDAY_MON_TO_FRI: Weekday[] = [1, 2, 3, 4, 5];

/**
 * Primer día en que la tarea puede aparecer.
 *
 * En las tareas recurrentes, `dueDate` no es un vencimiento sino la fecha de
 * inicio de la serie. Si no se indicó, la serie empieza el día en que se creó:
 * así una tarea diaria creada hoy no aparece como incumplida en el pasado.
 */
export function startDayOf(task: Task): DayKey {
  return task.dueDate ?? toDayKey(new Date(task.createdAt));
}

/** ¿Aplica la tarea en el día indicado? */
export function appliesOn(task: Task, day: DayKey): boolean {
  if (task.archivedAt !== null) return false;

  if (task.recurrenceType === 'none') {
    return task.dueDate === day;
  }

  // Antes del inicio de la serie no toca, aunque la regla encaje.
  if (daysBetween(startDayOf(task), day) < 0) return false;

  switch (task.recurrenceType) {
    case 'daily':
      return true;

    case 'weekdays':
      return WEEKDAY_MON_TO_FRI.includes(weekdayOf(day));

    case 'weekly':
      // Sin días marcados se cae al día de la semana en que arrancó la serie,
      // que es lo que el usuario espera de un "cada semana" sin más detalle.
      return task.recurrenceDays.length > 0
        ? task.recurrenceDays.includes(weekdayOf(day))
        : weekdayOf(day) === weekdayOf(startDayOf(task));

    case 'monthly':
      return matchesMonthDay(task.recurrenceDayOfMonth, day);
  }
}

/**
 * ¿Cae `day` en el día del mes pedido?
 *
 * El día 31 se ajusta al último día de los meses que no lo tienen. Sin este
 * ajuste, una tarea mensual configurada el día 31 desaparecería en febrero,
 * abril, junio, septiembre y noviembre — cinco meses al año en los que el
 * usuario no vería nunca su tarea y no entendería por qué.
 */
function matchesMonthDay(dayOfMonth: number | null, day: DayKey): boolean {
  if (dayOfMonth === null) return false;

  const currentDay = Number(day.slice(8, 10));
  const total = daysInMonth(day);
  const target = Math.min(dayOfMonth, total);
  return currentDay === target;
}

/** Descripción legible de la regla, para las tarjetas y el formulario. */
export function describeRecurrence(task: Task): string | null {
  switch (task.recurrenceType) {
    case 'none':
      return null;
    case 'daily':
      return 'Cada día';
    case 'weekdays':
      return 'De lunes a viernes';
    case 'weekly': {
      if (task.recurrenceDays.length === 0) {
        return `Cada ${weekdayLabel(weekdayOf(startDayOf(task))).toLowerCase()}`;
      }
      const labels = [...task.recurrenceDays]
        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
        .map((weekday) => weekdayLabel(weekday));
      return labels.join(', ');
    }
    case 'monthly':
      return task.recurrenceDayOfMonth === null
        ? 'Cada mes'
        : `Día ${task.recurrenceDayOfMonth} de cada mes`;
  }
}

/**
 * Tareas que toca hacer en un día.
 *
 * Incluye las tareas únicas vencidas y sin completar, aunque su fecha ya pasara:
 * esconderlas sería la forma más rápida de que el usuario pierda la confianza en
 * la lista. Aparecen marcadas como vencidas, no silenciadas.
 */
export function tasksForDay(tasks: Task[], day: DayKey): Task[] {
  return tasks.filter((task) => {
    if (task.archivedAt !== null) return false;
    if (appliesOn(task, day)) return true;

    const isOneOff = task.recurrenceType === 'none';
    const pending = task.completedAt === null;
    const overdue = task.dueDate !== null && daysBetween(task.dueDate, day) > 0;
    return isOneOff && pending && overdue;
  });
}
