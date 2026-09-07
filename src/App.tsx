import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseProvider } from '@/providers/DatabaseProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { DesignSystemPreview } from '@/features/settings/screens/DesignSystemPreview';

/**
 * Pinta la barra de estado acorde al tema. Vive en un componente aparte porque
 * necesita estar dentro del `ThemeProvider` para leer los tokens.
 */
function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar style={theme.isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <DatabaseProvider>
            {/* Provisional: se sustituye por el navegador de pestañas en el paso 4. */}
            <DesignSystemPreview />
          </DatabaseProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
