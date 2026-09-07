import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

export type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  /** Una frase que diga qué hacer, no solo que no hay nada. */
  message: string;
};

/**
 * Estado vacío.
 *
 * El mensaje siempre indica la acción siguiente en vez de limitarse a informar
 * de que la lista está vacía: la primera vez que se abre la app, todas las
 * pantallas están vacías, y es justo el momento en que el usuario más necesita
 * saber por dónde empezar.
 */
export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={30} color={theme.colors.accent} />
      </View>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color="textSecondary" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const themedStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.huge,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
}));
