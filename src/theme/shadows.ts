import { Platform, type ViewStyle } from 'react-native';

/**
 * Elevación.
 *
 * En tema oscuro las sombras son casi invisibles (sombra negra sobre fondo casi
 * negro no separa nada), así que ahí la profundidad se comunica subiendo el
 * color de la superficie, no proyectando sombra. Por eso las sombras se generan
 * con una función que sabe si el tema es oscuro, en vez de ser constantes.
 */
export type ElevationLevel = 0 | 1 | 2 | 3;

export function elevation(level: ElevationLevel, isDark: boolean): ViewStyle {
  if (level === 0 || isDark) return {};

  const config = {
    1: { height: 1, radius: 3, opacity: 0.06, android: 2 },
    2: { height: 4, radius: 10, opacity: 0.09, android: 5 },
    3: { height: 10, radius: 24, opacity: 0.13, android: 12 },
  }[level];

  return Platform.select<ViewStyle>({
    android: { elevation: config.android },
    default: {
      shadowColor: '#0B0F17',
      shadowOffset: { width: 0, height: config.height },
      shadowRadius: config.radius,
      shadowOpacity: config.opacity,
    },
  });
}
