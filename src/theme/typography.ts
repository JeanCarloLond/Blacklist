import type { TextStyle } from 'react-native';

/**
 * Escala tipográfica.
 *
 * Se usa la fuente del sistema a propósito (`fontFamily` sin definir): es la que
 * el usuario ya lee todo el día, carga instantáneamente y respeta los ajustes de
 * accesibilidad del dispositivo. Meter una fuente propia costaría un `expo-font`
 * + assets + una pantalla de carga, a cambio de poca diferencia real.
 *
 * La jerarquía se apoya sobre todo en **peso y color**, no en tamaño: en una
 * lista de tareas los tamaños muy dispares crean ruido visual. De ahí que
 * `body` y `bodyStrong` midan lo mismo y solo cambien de peso.
 *
 * El `letterSpacing` negativo en los tamaños grandes compensa que las fuentes de
 * sistema se ven demasiado sueltas al ampliarlas.
 */
export type TypographyVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline'
  | 'numeric';

type Variant = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'textTransform'
>;

export const typography: Record<TypographyVariant, Variant> = {
  /** Cifras protagonistas: días de racha, nivel. */
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.8 },
  /** Título de pantalla. */
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  /** Cabecera de sección. */
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  /** Título de tarjeta o de tarea. */
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  /** Texto corrido. */
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  /** Texto corrido con énfasis, mismo tamaño que `body`. */
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  /** Etiquetas de botón y de campo. */
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  /** Metadatos: fecha límite, categoría, contador. */
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  /** Rótulo de sección en mayúsculas. */
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  /** Cifras tabulares en estadísticas. */
  numeric: { fontSize: 22, lineHeight: 27, fontWeight: '700', letterSpacing: -0.3 },
};
