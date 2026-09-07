import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Puente entre el contexto de SQLite y los stores de Zustand.
 *
 * Los stores viven fuera del árbol de React, así que no pueden llamar a
 * `useSQLiteContext()`. La alternativa sería pasar la conexión como argumento
 * en cada acción, lo que obligaría a que cada pantalla conociera la base solo
 * para reenviarla — justo el detalle que la capa de repositorios existe para
 * esconder. En su lugar, `DatabaseBridge` la registra una vez al arrancar.
 */
let database: SQLiteDatabase | null = null;

export function setDatabase(db: SQLiteDatabase): void {
  database = db;
}

export function getDatabase(): SQLiteDatabase {
  if (!database) {
    throw new Error(
      'La base de datos aún no está lista. Falta montar <DatabaseBridge> dentro de <DatabaseProvider>.',
    );
  }
  return database;
}
