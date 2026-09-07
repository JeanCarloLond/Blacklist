import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export function TasksScreen() {
  return (
    <Screen header={<ScreenHeader title="Tareas" subtitle="Todo lo que tienes pendiente" />}>
      <EmptyState
        icon="checkmark-circle-outline"
        title="Sin tareas todavía"
        message="Apunta lo que tengas que hacer: una entrega, una llamada, o algo que se repita cada semana."
      />
    </Screen>
  );
}
