import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';

/** Nombre del archivo de la base en el almacenamiento de la app. */
export const DATABASE_NAME = 'blacklist.db';

/**
 * Prepara la conexión y aplica las migraciones pendientes. Se ejecuta una vez
 * al arrancar, desde el `onInit` de `SQLiteProvider`.
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  await runMigrations(db);
}
