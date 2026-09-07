import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DesignSystemPreview } from '@/features/settings/screens/DesignSystemPreview';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { TaskFormScreen } from '@/features/tasks/screens/TaskFormScreen';
import { useTheme } from '@/providers/ThemeProvider';
import { toNavigationTheme } from '@/theme';

import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navegación raíz: las pestañas como pantalla base y, por encima, lo que se
 * abre desde ellas.
 *
 * El tema se traduce al formato de React Navigation para que el fondo de las
 * transiciones use los mismos tokens que la app. Sin eso se ve un destello
 * blanco al navegar en modo oscuro, que es de esos detalles que hacen que una
 * app parezca sin terminar.
 */
export function RootNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer theme={toNavigationTheme(theme)}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="DesignSystem" component={DesignSystemPreview} />
        {/* El formulario se presenta como hoja modal: es una tarea puntual que
            se abre y se cierra, no un destino donde uno se queda. */}
        <Stack.Screen
          name="TaskForm"
          component={TaskFormScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
