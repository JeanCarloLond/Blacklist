/**
 * Escala de espaciado, radios y medidas de interacción.
 *
 * Todo múltiplo de 4. Una escala cerrada evita el "16 aquí, 18 allá, 15 más
 * abajo" que hace que una app se vea descuidada sin que sepas señalar por qué.
 */
export const spacing = {
  /** 4 — separación entre un icono y su etiqueta. */
  xs: 4,
  /** 8 — separación interna de elementos relacionados. */
  sm: 8,
  /** 12 — padding de chips y campos compactos. */
  md: 12,
  /** 16 — padding estándar de tarjeta y margen lateral de pantalla. */
  lg: 16,
  /** 20 — separación entre bloques dentro de una sección. */
  xl: 20,
  /** 24 — separación entre secciones. */
  xxl: 24,
  /** 32 — respiro grande, cabeceras de pantalla. */
  xxxl: 32,
  /** 48 — separación de estados vacíos. */
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  /** 16 — radio por defecto de las tarjetas. */
  lg: 16,
  xl: 20,
  /** Cápsula: chips, botones redondeados, avatares. */
  pill: 999,
} as const;

export const layout = {
  /**
   * 48 — altura mínima de cualquier elemento pulsable. Por debajo de esto el
   * dedo falla; es el mínimo que recomiendan tanto Material como HIG.
   */
  touchTarget: 48,
  /** Margen lateral estándar de las pantallas. */
  screenPadding: spacing.lg,
  /** Grosor de borde estándar (hairline visible en todas las densidades). */
  borderWidth: 1,
  /** Lado del cuadrito del heatmap y separación entre cuadritos. */
  heatmapCell: 13,
  heatmapGap: 3,
  /** Diámetro del control de completado en la lista de tareas. */
  checkbox: 26,
  /** Botón flotante de acción principal. */
  fab: 58,
} as const;
