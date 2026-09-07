import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { useTheme } from '@/providers/ThemeProvider';

export type ScreenProps = {
  children: ReactNode;
  /**
   * Cabecera fija, fuera del área desplazable. Se pasa por aquí en vez de como
   * primer hijo para que el botón de volver no se vaya con el scroll.
   */
  header?: ReactNode;
  /** Envuelve el contenido en un `ScrollView`. */
  scroll?: boolean;
  /** Aplica el margen lateral estándar. Desactívalo en listas a sangre. */
  padded?: boolean;
  /**
   * Bordes donde respetar el área segura. Por defecto solo arriba: la barra de
   * pestañas ya gestiona el inset inferior, y aplicarlo dos veces deja un hueco.
   */
  edges?: Edges;
  style?: StyleProp<ViewStyle>;
};

/**
 * Contenedor raíz de cada pantalla: fondo del tema y área segura resueltos en un
 * solo sitio, para que ninguna pantalla se olvide de pintar el fondo y deje ver
 * el blanco por debajo al navegar en modo oscuro.
 */
export function Screen({
  children,
  header,
  scroll = false,
  padded = true,
  edges = ['top'],
  style,
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? theme.layout.screenPadding : 0;

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            { paddingHorizontal: padding, paddingBottom: theme.spacing.xxxl },
            style,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: padding }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
