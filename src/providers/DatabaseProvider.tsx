import { SQLiteProvider } from 'expo-sqlite';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { DATABASE_NAME, initializeDatabase } from '@/db/client';
import { useTheme } from '@/providers/ThemeProvider';

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
      {children}
    </SQLiteProvider>
  );
}

export { DatabaseLoading };
