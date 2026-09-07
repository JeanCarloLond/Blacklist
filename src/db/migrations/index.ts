import type { SQLiteDatabase } from 'expo-sqlite';

import { migration001 } from './001_init';
import type { Migration } from './types';

/**
 * Migraciones en orden. Añadir siempre al final, nunca editar una ya publicada:
 * los dispositivos que ya la aplicaron no la volverán a ejecutar.
 */
export const migrations: Migration[] = [migration001];

/**
 * Lleva el esquema a la última versión.
 *
 * La versión aplicada se guarda en `PRAGMA user_version` y no en una tabla
 * propia por dos razones: vive en la cabecera del archivo de la base, así que no
 * puede desincronizarse de su contenido; y evita el problema del huevo y la
 * gallina de tener que crear la tabla de versiones antes de saber si el esquema
 * existe.
 *
 * Cada migración corre dentro de una transacción junto con su subida de versión.
 * Si falla a mitad, SQLite revierte ambas cosas y el arranque siguiente la
 * reintenta desde el mismo punto, en vez de quedarse con medio esquema.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    // `PRAGMA` no admite parámetros vinculados, así que la versión se
    // interpola. El guardia impide que un valor no entero llegue al SQL.
    if (!Number.isInteger(migration.version)) {
      throw new Error(`Versión de migración inválida: ${migration.version}`);
    }
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.up);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }

  return migrations[migrations.length - 1]?.version ?? currentVersion;
}

export type { Migration } from './types';
