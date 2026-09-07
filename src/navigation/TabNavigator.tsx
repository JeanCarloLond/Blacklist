import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { GoalsScreen } from '@/features/goals/screens/GoalsScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { StatsScreen } from '@/features/stats/screens/StatsScreen';
import { TasksScreen } from '@/features/tasks/screens/TasksScreen';
import { useTheme } from '@/providers/ThemeProvider';

import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Icono de cada pestaña, relleno cuando está activa y contorneado cuando no.
 *
 * El relleno comunica el estado activo sin depender solo del color, que es lo
 * que se pierde con daltonismo o a plena luz del sol.
 */
const ICONS: Record<keyof TabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ['today-outline', 'today'],
  Tasks: ['checkmark-circle-outline', 'checkmark-circle'],
  Goals: ['flame-outline', 'flame'],
  Stats: ['grid-outline', 'grid'],
};

const LABELS: Record<keyof TabParamList, string> = {
  Home: 'Hoy',
  Tasks: 'Tareas',
  Goals: 'Metas',
  Stats: 'Progreso',
};

export function TabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Cada pantalla dibuja su propia cabecera con la tipografía del sistema
        // de diseño, así que la nativa sobra.
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabel: LABELS[route.name],
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: theme.layout.borderWidth,
          // Sin altura fija: la barra suma sola el hueco de los gestos del
          // sistema, y fijarla aquí la rompería en los móviles sin botones.
          paddingTop: theme.spacing.sm,
        },
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [inactive, active] = ICONS[route.name];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}
