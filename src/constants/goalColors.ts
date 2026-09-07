/**
 * Colores que el usuario puede asignar a una meta.
 *
 * Se guardan en hexadecimal en la base, así que son independientes del tema:
 * los tonos están elegidos para verse bien tanto sobre fondo claro como oscuro,
 * evitando los extremos (ni pasteles que se pierden en blanco, ni tonos muy
 * oscuros que desaparecen en negro).
 */
export const GOAL_COLORS = [
  '#6D5AE6', // violeta
  '#2E6FD9', // azul
  '#12A5B0', // turquesa
  '#12B76A', // verde
  '#F79009', // ámbar
  '#E5484D', // rojo
  '#D6409F', // magenta
  '#8B5CF6', // lila
] as const;

export const DEFAULT_GOAL_COLOR = GOAL_COLORS[0];
