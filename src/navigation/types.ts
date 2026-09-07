import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Pestañas principales.
 *
 * Son cuatro y no cinco a propósito: Ajustes no es un destino diario, así que
 * vive en el stack colgando de la cabecera de Hoy. Cada pestaña que se quita
 * ensancha las demás, y el objetivo es que se alcancen con el pulgar.
 */
export type TabParamList = {
  Home: undefined;
  Tasks: undefined;
  Goals: undefined;
  Stats: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Settings: undefined;
  DesignSystem: undefined;
  /** Sin `taskId` crea una tarea; con él, la edita. */
  TaskForm: { taskId?: string } | undefined;
};

/**
 * Registra las rutas en el espacio de nombres de React Navigation para que
 * `useNavigation()` quede tipado en toda la app sin anotarlo en cada pantalla.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
