import type { Goal } from '@/domain/models';
import { daysBetween, weekdayLabel, weekdayOf, type DayKey } from '@/lib/date';

/**
 * Cuándo toca una meta y cuánto se ha cumplido.
 *
 * Lógica pura, como la de recurrencia de tareas. La diferencia importante con
 * aquélla es `times_per_week`: esa meta no toca días concretos, sino un número
 * de veces por semana, así que "¿toca hoy?" depende de cuánto se lleva hecho en
 * la semana y no solo del calendario.
 */

/** ¿Está la meta activa (no archivada y ya empezada) ese día? */
export function isGoalActive(goal: Goal, day: DayKey): boolean {
  if (goal.archivedAt !== null) return false;
  return daysBetween(goal.startedAt, day) >= 0;
}

/**
 * ¿Toca la meta en ese día por calendario?
 *
 * Para `times_per_week` devuelve siempre `true`: cualquier día vale para sumar
 * una de las veces de la semana. Que siga haciendo falta o no es otra pregunta,
 * y la responde `isGoalPendingThisWeek`.
 */
export function goalAppliesOn(goal: Goal, day: DayKey): boolean {
  if (!isGoalActive(goal, day)) return false;

  switch (goal.scheduleType) {
    case 'daily':
      return true;
    case 'weekdays':
      // Sin días marcados se comporta como diaria, que es lo menos sorprendente
      // ante una configuración a medias.
      return goal.scheduleDays.length === 0 || goal.scheduleDays.includes(weekdayOf(day));
    case 'times_per_week':
      return true;
  }
}

/**
 * ¿Sigue quedando cupo esta semana? Solo aplica a `times_per_week`.
 *
 * @param doneThisWeek días ya cumplidos en la semana en curso.
 */
export function isGoalPendingThisWeek(goal: Goal, doneThisWeek: number): boolean {
  if (goal.scheduleType !== 'times_per_week') return true;
  return doneThisWeek < (goal.timesPerWeek ?? 1);
}

/**
 * Avance de una meta en un día, entre 0 y 1.
 *
 * Las booleanas solo conocen 0 o 1. Las cuantitativas devuelven la fracción del
 * objetivo, que es lo que permite pintar cumplimiento parcial en el heatmap en
 * vez de tratar "leí 18 de 20 minutos" como un día en blanco.
 */
export function goalProgress(goal: Goal, value: number): number {
  if (goal.kind === 'boolean') return value > 0 ? 1 : 0;
  const target = goal.targetValue ?? 1;
  if (target <= 0) return value > 0 ? 1 : 0;
  return Math.min(1, value / target);
}

/** ¿Cuenta la meta como cumplida ese día? */
export function isGoalMet(goal: Goal, value: number): boolean {
  return goalProgress(goal, value) >= 1;
}

/**
 * Incremento del botón "+" de una meta cuantitativa.
 *
 * Se escala con el objetivo para que llegar a la meta cueste unos pocos toques:
 * sumar de uno en uno hasta 60 minutos sería absurdo, y de diez en diez para un
 * objetivo de 3 sería inservible.
 */
export function progressStep(goal: Goal): number {
  const target = goal.targetValue ?? 1;
  if (target <= 10) return 1;
  if (target <= 60) return 5;
  return 10;
}

/** Descripción legible de la frecuencia, para la tarjeta y el formulario. */
export function describeGoalSchedule(goal: Goal): string {
  switch (goal.scheduleType) {
    case 'daily':
      return 'Cada día';
    case 'weekdays': {
      if (goal.scheduleDays.length === 0) return 'Cada día';
      return [...goal.scheduleDays]
        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
        .map((weekday) => weekdayLabel(weekday))
        .join(', ');
    }
    case 'times_per_week': {
      const times = goal.timesPerWeek ?? 1;
      return `${times} ${times === 1 ? 'vez' : 'veces'} por semana`;
    }
  }
}

/** Objetivo legible: '20 min', '3 páginas'. Vacío en las booleanas. */
export function describeGoalTarget(goal: Goal): string | null {
  if (goal.kind !== 'quantitative' || goal.targetValue === null) return null;
  return goal.unit ? `${goal.targetValue} ${goal.unit}` : String(goal.targetValue);
}

/**
 * Metas que procede mostrar en un día.
 *
 * Una meta de "3 veces por semana" ya cumplida desaparece del día, salvo que se
 * haya hecho hoy: dejarla sugeriría que aún falta algo, y quitarla nada más
 * marcarla impediría deshacer un toque por error.
 *
 * Vive aquí y no en el store para poder probarla con cualquier fecha: dentro
 * del store dependería de `todayKey()`, y la rama del cupo agotado solo se
 * podría comprobar los días que tienen jornadas previas en la semana.
 *
 * @param weekCounts días ya cumplidos esta semana, por id de meta.
 * @param dayValues cantidad registrada en `day`, por id de meta.
 */
export function selectGoalsForDay(
  goals: Goal[],
  day: DayKey,
  weekCounts: Map<string, number>,
  dayValues: Map<string, number>,
): Goal[] {
  return goals.filter((goal) => {
    if (!goalAppliesOn(goal, day)) return false;
    if (goal.scheduleType !== 'times_per_week') return true;

    const doneThatDay = (dayValues.get(goal.id) ?? 0) > 0;
    return doneThatDay || isGoalPendingThisWeek(goal, weekCounts.get(goal.id) ?? 0);
  });
}
