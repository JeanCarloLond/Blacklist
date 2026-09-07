/**
 * Paleta primitiva: los colores crudos de BlackList.
 *
 * Esta capa NO se usa directamente en las pantallas. Existe para que los tokens
 * semánticos de `colors.ts` tengan de dónde tirar y para que un ajuste de marca
 * se haga en un solo sitio. Si una pantalla importa de aquí, es un bug.
 *
 * Identidad: neutros fríos con tinte azulado (no grises puros, que se ven
 * sucios en pantallas OLED) y un violeta eléctrico como acento. El violeta se
 * eligió porque tiene que convivir con el verde de "completado" y el rojo de
 * "vencido" sin competir con ellos: un acento azul chocaría con el estado de
 * información y uno naranja con el de advertencia.
 */

/** Neutros fríos. 0 = casi negro, 1000 = blanco. */
export const neutral = {
  0: '#0E1013',
  50: '#16191F',
  100: '#1D2129',
  200: '#262B34',
  300: '#343B47',
  400: '#4A5361',
  500: '#6B7280',
  550: '#737C8A',
  600: '#8A93A0',
  700: '#9BA3B0',
  800: '#C9CFD8',
  900: '#E4E7EC',
  950: '#F2F4F7',
  975: '#F7F8FA',
  1000: '#FFFFFF',
} as const;

/** Violeta de marca. */
export const violet = {
  50: '#EFECFE',
  100: '#DAD5FA',
  200: '#B4A9F5',
  300: '#8574EC',
  400: '#8B7BFF',
  500: '#6D5AE6',
  600: '#5B45E0',
  700: '#453D9E',
  800: '#2E2A5C',
  900: '#252142',
} as const;

/** Verde de logro: rachas, completado, progreso cumplido. */
export const green = {
  50: '#E3F9EF',
  100: '#B9EFD6',
  400: '#3DDC97',
  500: '#12B76A',
  600: '#0FA968',
  900: '#0B2E20',
} as const;

/** Ámbar de atención: prioridad media, avisos suaves. */
export const amber = {
  50: '#FFF4E0',
  400: '#FFB84D',
  500: '#F79009',
  600: '#B96B00',
  900: '#3A2A0B',
} as const;

/** Rojo de urgencia: prioridad alta, vencido, destructivo. */
export const red = {
  50: '#FFEBEB',
  400: '#FF6B6B',
  500: '#E5484D',
  600: '#DC3E3E',
  900: '#3D1A1C',
} as const;

/** Azul de información: prioridad baja, estados neutros informativos. */
export const blue = {
  50: '#E7F0FF',
  400: '#5AA2FF',
  600: '#2E6FD9',
  900: '#122744',
} as const;
