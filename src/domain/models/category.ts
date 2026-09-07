/** Etiqueta de color con la que se agrupan tareas y metas. */
export type Category = {
  id: string;
  name: string;
  /** Color en hexadecimal, elegido por el usuario. */
  color: string;
  /** Nombre de icono de Ionicons, opcional. */
  icon: string | null;
  /** Orden manual en las listas de filtro. */
  position: number;
  createdAt: string;
};
