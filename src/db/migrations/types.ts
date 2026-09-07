export type Migration = {
  /** Número consecutivo empezando en 1. Nunca se reutiliza ni se reordena. */
  version: number;
  /** Nombre descriptivo, solo para los registros de arranque. */
  name: string;
  /** SQL que lleva el esquema de `version - 1` a `version`. */
  up: string;
};
