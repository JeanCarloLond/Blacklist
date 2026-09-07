/**
 * Utilidades de fecha para BlackList.
 *
 * Regla del proyecto: un "día" se representa siempre como `DayKey`, la cadena
 * 'YYYY-MM-DD' calculada en la **zona horaria local** del dispositivo. Nunca en
 * UTC: si guardáramos UTC, completar una meta a las 23:30 contaría para el día
 * siguiente y rompería la racha del usuario sin motivo visible.
 *
 * Los timestamps de auditoría (`created_at`, `updated_at`) sí van en ISO
 * completo, porque ahí sí interesa el instante exacto.
 */

/** Cadena 'YYYY-MM-DD' en hora local. */
export type DayKey = string;

/** 0 = domingo, 1 = lunes, ... 6 = sábado. Mismo criterio que `Date#getDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const MS_PER_DAY = 86_400_000;

const pad = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** Convierte un `Date` a su `DayKey` local. */
export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `DayKey` de hoy. */
export function todayKey(): DayKey {
  return toDayKey(new Date());
}

/** Convierte un `DayKey` en un `Date` situado en la medianoche local de ese día. */
export function fromDayKey(key: DayKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Desplaza un `DayKey` en `amount` días (puede ser negativo). */
export function addDays(key: DayKey, amount: number): DayKey {
  const date = fromDayKey(key);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

export function addMonths(key: DayKey, amount: number): DayKey {
  const date = fromDayKey(key);
  date.setMonth(date.getMonth() + amount);
  return toDayKey(date);
}

/**
 * Días completos entre dos `DayKey` (`b - a`). Se normaliza a mediodía antes de
 * restar para que los cambios de horario de verano no produzcan un ±1 erróneo.
 */
export function daysBetween(a: DayKey, b: DayKey): number {
  const from = fromDayKey(a);
  const to = fromDayKey(b);
  from.setHours(12, 0, 0, 0);
  to.setHours(12, 0, 0, 0);
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Día de la semana de un `DayKey`. */
export function weekdayOf(key: DayKey): Weekday {
  return fromDayKey(key).getDay() as Weekday;
}

/** Lunes de la semana a la que pertenece `key`. La semana empieza en lunes. */
export function startOfWeek(key: DayKey): DayKey {
  const weekday = weekdayOf(key);
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDays(key, offset);
}

/** Primer día del mes de `key`. */
export function startOfMonth(key: DayKey): DayKey {
  return `${key.slice(0, 7)}-01`;
}

/** Número de días del mes al que pertenece `key`. */
export function daysInMonth(key: DayKey): number {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  // El día 0 del mes siguiente es el último del actual.
  return new Date(year, month, 0).getDate();
}

/** Rango inclusivo de `DayKey` entre dos fechas. */
export function dayRange(from: DayKey, to: DayKey): DayKey[] {
  const total = daysBetween(from, to);
  if (total < 0) return [];
  const days: DayKey[] = [];
  for (let i = 0; i <= total; i += 1) days.push(addDays(from, i));
  return days;
}

/** Instante actual en ISO 8601, para campos de auditoría. */
export function nowIso(): string {
  return new Date().toISOString();
}

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const MONTH_LABELS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

const WEEKDAY_FULL = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
] as const;

/** 'Lun', 'Mar', ... a partir del índice de día de semana. */
export function weekdayLabel(weekday: Weekday): string {
  return WEEKDAY_LABELS[weekday] ?? '';
}

export function monthLabel(key: DayKey): string {
  const month = Number(key.slice(5, 7)) - 1;
  return MONTH_LABELS[month] ?? '';
}

/** '12 de marzo' — sin año, para contextos donde el año se sobreentiende. */
export function formatDayMonth(key: DayKey): string {
  return `${Number(key.slice(8, 10))} de ${monthLabel(key)}`;
}

/**
 * Etiqueta amable para una fecha: 'Hoy', 'Mañana', 'Ayer' o la fecha corta.
 * Se usa en las tarjetas de tarea, donde "Hoy" comunica mucho más que "07/09".
 */
export function formatRelativeDay(key: DayKey, reference: DayKey = todayKey()): string {
  const diff = daysBetween(reference, key);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1 && diff < 7) return weekdayLabel(weekdayOf(key));
  return formatDayMonth(key);
}

/** True si la fecha ya pasó respecto de hoy (tarea vencida). */
export function isOverdue(key: DayKey, reference: DayKey = todayKey()): boolean {
  return daysBetween(reference, key) < 0;
}

/** 'domingo, 7 de septiembre' — para la cabecera de la pantalla de hoy. */
export function formatLongDay(key: DayKey): string {
  const weekday = WEEKDAY_FULL[weekdayOf(key)] ?? '';
  return `${weekday}, ${formatDayMonth(key)}`;
}
