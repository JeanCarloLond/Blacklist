import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export function StatsScreen() {
  return (
    <Screen header={<ScreenHeader title="Progreso" subtitle="Tu constancia, día a día" />}>
      <EmptyState
        icon="grid-outline"
        title="Todavía no hay nada que medir"
        message="En cuanto empieces a completar metas, aquí aparecerá tu mapa de constancia y tus rachas."
      />
    </Screen>
  );
}
