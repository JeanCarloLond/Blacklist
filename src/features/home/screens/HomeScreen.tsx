import { useNavigation } from '@react-navigation/native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatLongDay, todayKey } from '@/lib/date';

/**
 * Pantalla de inicio: lo que toca hoy.
 *
 * De momento solo el armazón; las tareas y metas del día llegan con su paso
 * correspondiente.
 */
export function HomeScreen() {
  const navigation = useNavigation();

  return (
    <Screen
      header={
        <ScreenHeader
          title="Hoy"
          subtitle={formatLongDay(todayKey())}
          action={{
            icon: 'settings-outline',
            label: 'Ajustes',
            onPress: () => navigation.navigate('Settings'),
          }}
        />
      }
    >
      <EmptyState
        icon="sunny-outline"
        title="Nada pendiente por ahora"
        message="Cuando crees tareas y metas, aquí verás lo que toca cada día y podrás completarlo de un toque."
      />
    </Screen>
  );
}
