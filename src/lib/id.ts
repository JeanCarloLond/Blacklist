/**
 * Generador de identificadores.
 *
 * Se evita `uuid` a propósito: en React Native necesita un polyfill de
 * `crypto.getRandomValues` y aquí no hace falta unicidad global, solo unicidad
 * dentro de una base de datos local. El prefijo temporal en base36 hace además
 * que los ids sean ordenables por fecha de creación, lo que ayuda al depurar.
 */
export function createId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}${random}`;
}
