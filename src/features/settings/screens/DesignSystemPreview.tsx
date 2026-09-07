import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { createStyles, useThemedStyles } from '@/theme/useThemedStyles';
import type { TypographyVariant } from '@/theme';

/**
 * Guía viva del sistema de diseño.
 *
 * No es una pantalla de producto: sirve para ver de un vistazo que los tokens se
 * comportan igual en claro y en oscuro. Cuelga de Ajustes porque comprobar un
 * contraste aquí es mucho más rápido que ir a buscar la pantalla real donde se
 * usa ese color.
 */

const TYPE_SAMPLES: [TypographyVariant, string][] = [
  ['display', '21 días'],
  ['title', 'Metas de hoy'],
  ['heading', 'Esta semana'],
  ['subheading', 'Tocar guitarra 30 min'],
  ['body', 'Texto corrido para descripciones.'],
  ['label', 'Marcar como hecha'],
  ['caption', 'Vence mañana · Universidad'],
  ['overline', 'Constancia'],
];

const STATUS_TOKENS = ['accent', 'success', 'warning', 'danger', 'info'] as const;

export function DesignSystemPreview() {
  const navigation = useNavigation();
  const styles = useThemedStyles(themedStyles);

  return (
    <Screen
      scroll
      header={
        <ScreenHeader
          title="Sistema de diseño"
          subtitle="Referencia de tokens"
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
        Tipografía
      </Text>
      <View style={styles.card}>
        {TYPE_SAMPLES.map(([variant, sample]) => (
          <View key={variant} style={styles.typeRow}>
            <Text variant={variant}>{sample}</Text>
            <Text variant="caption" color="textMuted">
              {variant}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
        Estado
      </Text>
      <View style={styles.row}>
        {STATUS_TOKENS.map((token) => (
          <View key={token} style={styles.swatchGroup}>
            <View style={[styles.swatch, styles[`swatch_${token}`]]} />
            <Text variant="caption" color="textMuted">
              {token}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
        Escala del heatmap
      </Text>
      <View style={styles.heatmapRow}>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <View key={level} style={[styles.heatCell, styles[`heat_${level}`]]} />
        ))}
      </View>

      <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
        Elevación
      </Text>
      <View style={styles.row}>
        {([1, 2, 3] as const).map((level) => (
          <View key={level} style={[styles.elevationBox, styles[`elevation_${level}`]]}>
            <Text variant="caption" color="textSecondary">
              {level}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const themedStyles = createStyles((theme) => ({
  sectionLabel: {
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  typeRow: {
    gap: 2,
  },
  swatchGroup: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
  },
  swatch_accent: { backgroundColor: theme.colors.accent },
  swatch_success: { backgroundColor: theme.colors.success },
  swatch_warning: { backgroundColor: theme.colors.warning },
  swatch_danger: { backgroundColor: theme.colors.danger },
  swatch_info: { backgroundColor: theme.colors.info },
  heatmapRow: {
    flexDirection: 'row',
    gap: theme.layout.heatmapGap,
  },
  heatCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  heat_0: { backgroundColor: theme.colors.heatmap[0] },
  heat_1: { backgroundColor: theme.colors.heatmap[1] },
  heat_2: { backgroundColor: theme.colors.heatmap[2] },
  heat_3: { backgroundColor: theme.colors.heatmap[3] },
  heat_4: { backgroundColor: theme.colors.heatmap[4] },
  elevationBox: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elevation_1: theme.elevation(1),
  elevation_2: theme.elevation(2),
  elevation_3: theme.elevation(3),
}));
