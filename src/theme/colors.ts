import { amber, blue, green, neutral, red, violet } from './palette';

/**
 * Tokens semánticos de color.
 *
 * Las pantallas consumen SOLO estos nombres, nunca la paleta cruda. Así el tema
 * claro y el oscuro se intercambian sin tocar ni una pantalla: cada token existe
 * en ambos y significa lo mismo ("el fondo de una tarjeta"), aunque su valor
 * hexadecimal cambie.
 */
export type ColorTokens = {
  /** Fondo de la app, detrás de todo. */
  background: string;
  /** Fondo de tarjetas y listas sobre `background`. */
  surface: string;
  /** Superficie que debe destacar sobre `surface` (modales, hojas). */
  surfaceElevated: string;
  /** Hueco: campos de texto, pistas de progreso, celdas vacías del heatmap. */
  surfaceSunken: string;
  /** Realce momentáneo al pulsar. */
  surfacePressed: string;

  /** Separadores y bordes de tarjeta. */
  border: string;
  /** Borde con más presencia: foco, elemento seleccionado. */
  borderStrong: string;

  /** Texto principal. */
  text: string;
  /** Metadatos, subtítulos, texto de apoyo. */
  textSecondary: string;
  /** Texto de baja jerarquía: placeholders, tareas ya completadas. */
  textMuted: string;
  /** Texto sobre fondos de acento saturados. */
  textOnAccent: string;

  /** Color de marca: acciones primarias, estado activo, foco. */
  accent: string;
  /** Acento pulsado. */
  accentPressed: string;
  /** Fondo tenue de acento: chips, badges, resaltados. */
  accentSoft: string;

  /** Logro cumplido: completado, racha viva. */
  success: string;
  successSoft: string;
  /** Atención: prioridad media, vence pronto. */
  warning: string;
  warningSoft: string;
  /** Urgencia o acción destructiva: prioridad alta, vencido, eliminar. */
  danger: string;
  dangerSoft: string;
  /** Informativo neutro: prioridad baja. */
  info: string;
  infoSoft: string;

  /**
   * Escala del heatmap de constancia, de menos a más actividad.
   * El índice 0 es el día sin actividad; el 4, el día de cumplimiento total.
   * Es una tupla fija para que indexarla nunca devuelva `undefined`.
   */
  heatmap: readonly [string, string, string, string, string];

  /** Velo oscuro tras modales y hojas inferiores. */
  overlay: string;
};

export const darkColors: ColorTokens = {
  background: neutral[0],
  surface: neutral[50],
  surfaceElevated: neutral[100],
  surfaceSunken: neutral[200],
  surfacePressed: neutral[200],

  border: neutral[200],
  borderStrong: neutral[300],

  text: neutral[950],
  textSecondary: neutral[700],
  textMuted: neutral[500],
  // Texto casi negro sobre el acento, no blanco: el violeta claro del tema
  // oscuro solo alcanza 3.29:1 contra blanco (insuficiente para texto), y 5.78:1
  // contra este tono. Un boton violeta claro con texto oscuro es ademas mas
  // legible de un vistazo que el clasico violeta saturado con texto blanco.
  textOnAccent: neutral[0],

  accent: violet[400],
  accentPressed: violet[500],
  accentSoft: violet[900],

  success: green[400],
  successSoft: green[900],
  warning: amber[400],
  warningSoft: amber[900],
  danger: red[400],
  dangerSoft: red[900],
  info: blue[400],
  infoSoft: blue[900],

  heatmap: [neutral[100], violet[800], violet[700], violet[500], violet[400]],

  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const lightColors: ColorTokens = {
  background: neutral[975],
  surface: neutral[1000],
  surfaceElevated: neutral[1000],
  surfaceSunken: neutral[900],
  surfacePressed: neutral[900],

  border: neutral[900],
  borderStrong: neutral[800],

  text: '#12151A',
  textSecondary: '#5A6472',
  // neutral[600] se queda en 2.92:1 sobre el fondo claro, por debajo del minimo.
  textMuted: neutral[550],
  textOnAccent: neutral[1000],

  accent: violet[600],
  accentPressed: violet[700],
  accentSoft: violet[50],

  // En claro se usan los tonos 600: los 400 son legibles sobre fondo oscuro
  // pero no alcanzan contraste suficiente sobre blanco.
  success: green[600],
  successSoft: green[50],
  warning: amber[600],
  warningSoft: amber[50],
  danger: red[600],
  dangerSoft: red[50],
  info: blue[600],
  infoSoft: blue[50],

  heatmap: [neutral[900], violet[100], violet[200], violet[300], violet[600]],

  overlay: 'rgba(16, 20, 28, 0.45)',
};

/** Color asociado a cada nivel de prioridad de una tarea. */
export function priorityColor(
  colors: ColorTokens,
  priority: 0 | 1 | 2,
): string {
  switch (priority) {
    case 2:
      return colors.danger;
    case 1:
      return colors.warning;
    case 0:
      return colors.info;
  }
}
