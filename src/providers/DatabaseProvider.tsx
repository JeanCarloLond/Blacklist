import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { DATABASE_NAME, initializeDatabase } from '@/db/client';
import { useTheme } from '@/providers/ThemeProvider';
import { useCategoriesStore } from '@/store/categoriesStore';
import { setDatabase } from '@/store/database';
import { useTasksStore } from '@/store/tasksStore';

function DatabaseLoading() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

/**
 * Entrega la conexión a los stores y hace la carga inicial.
 *
 * Los stores de Zustand no pueden leer el contexto de React, así que este
 * componente es el único punto donde ambos mundos se tocan. Espera a la primera
 * carga antes de mostrar la app para que ninguna pantalla parpadee con una lista
 * vacía que se rellena un instante después.
 */
function DatabaseBridge({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDatabase(db);
    let active = true;

    void Promise.all([
      useCategoriesStore.getState().refresh(),
      useTasksStore.getState().refresh(),
    ]).finally(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
    };
  }, [db]);

  if (!ready) return <DatabaseLoading />;
  return <>{children}</>;
}

/**
 * Abre la base y corre las migraciones antes de montar la app.
 *
 * Se bloquea el arranque a propósito: si las pantallas se montaran antes de
 * migrar, cada consulta tendría que defenderse de un esquema a medio construir.
 * La espera es de milisegundos salvo la primera vez.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider
      databaseName={DATABASE_NAME}
      onInit={initializeDatabase}
      useSuspense={false}
    >
      <DatabaseBridge>{children}</DatabaseBridge>
    </SQLiteProvider>
  );
}

export { DatabaseLoading };
