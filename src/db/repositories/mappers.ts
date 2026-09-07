import type { Weekday } from '@/lib/date';

/**
 * Conversiones entre lo que SQLite sabe guardar y lo que el dominio usa.
 *
 * SQLite no tiene booleanos ni listas: se guardan como 0/1 y como texto
 * separado por comas. Concentrar esa traducción aquí evita que cada repositorio
 * improvise su propio formato.
 */

/** '1,3,5' -> [1, 3, 5]. Descarta valores fuera de rango en vez de confiar. */
export function parseWeekdays(raw: string | null): Weekday[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((day): day is Weekday => Number.isInteger(day) && day >= 0 && day <= 6);
}

/** [1, 3, 5] -> '1,3,5'. Una lista vacía se guarda como NULL, no como ''. */
export function serializeWeekdays(days: Weekday[] | undefined): string | null {
  if (!days || days.length === 0) return null;
  return [...new Set(days)].sort((a, b) => a - b).join(',');
}

export function toBool(value: number): boolean {
  return value === 1;
}

export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}
