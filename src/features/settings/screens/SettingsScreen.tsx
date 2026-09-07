import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemePreference } from '@/providers/ThemeProvider';
import type { ThemePreference } from '@/theme';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';

const PREFERENCES: [ThemePreference, string][] = [
  ['system', 'Sistema'],
  ['light', 'Claro'],
  ['dark', 'Oscuro'],
];

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress: () => void;
};

function SettingsRow({ icon, title, description, onPress }: RowProps) {
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={theme.colors.textSecondary} />
      <View style={styles.rowText}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" color="textMuted">
            {description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(themedStyles);
  const { preference, setPreference } = useThemePreference();

  return (
    <Screen
      scroll
      header={<ScreenHeader title="Ajustes" onBack={() => navigation.goBack()} />}
    >
      <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
        Apariencia
      </Text>
      <View style={styles.segmented}>
        {PREFERENCES.map(([value, label]) => {
          const active = preference === value;
          return (
            <Pressable
              key={value}
              onPress={() => setPreference(value)}
              style={[styles.segment, active && styles.segmentActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text variant="label" color={active ? 'textOnAccent' : 'textSecondary'}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="caption" color="textMuted" style={styles.hint}>
        Con «Sistema», la app sigue el tema que tengas puesto en el teléfono.
      </Text>

      <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
        Desarrollo
      </Text>
      <View style={styles.card}>
        <SettingsRow
          icon="color-palette-outline"
          title="Sistema de diseño"
          description="Tipografía, colores y escalas de la app"
          onPress={() => navigation.navigate('DesignSystem')}
        />
      </View>
    </Screen>
  );
}

const themedStyles = createStyles((theme) => ({
  sectionLabel: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunken,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  segmentActive: {
    backgroundColor: theme.colors.accent,
  },
  hint: {
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: theme.layout.touchTarget,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  rowPressed: {
    backgroundColor: theme.colors.surfacePressed,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
}));
