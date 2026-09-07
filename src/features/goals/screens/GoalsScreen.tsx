import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export function GoalsScreen() {
  return (
    <Screen header={<ScreenHeader title="Metas" subtitle="Lo que quieres sostener en el tiempo" />}>
      <EmptyState
        icon="flame-outline"
        title="Aún no hay metas"
        message="Una meta no se tacha y se olvida: se mide por constancia. Tocar guitarra, entrenar, estudiar."
      />
    </Screen>
  );
}
