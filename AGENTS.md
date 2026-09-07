# BlackList

App de tareas y hábitos con seguimiento de constancia (heatmap estilo GitHub,
rachas y gamificación). React Native + Expo, TypeScript, SQLite local.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code. Verificar la API real en `node_modules/<pkg>/build/*.d.ts`
antes de asumir firmas de funciones.

## Convenciones del proyecto

- **Alias de imports:** `@/` apunta a `src/`. No usar rutas relativas largas.
- **Sin `babel.config.js`:** `babel-preset-expo` inyecta el plugin de
  `react-native-worklets` automáticamente cuando Reanimated está instalado.
- **No usar `src/app/`:** Expo lo interpreta como raíz de Expo Router. La app
  raíz vive en `src/App.tsx`.
- **Días:** un día es siempre un `DayKey` (`'YYYY-MM-DD'` en hora **local**),
  nunca UTC. Ver `src/lib/date.ts` y el porqué documentado ahí.
- **Acceso a datos:** solo `src/db/repositories/` escribe SQL. Las pantallas
  hablan con repositorios, nunca con la base directamente. Esto permite meter
  sincronización en la nube más adelante sin tocar la UI.
- **`src/domain/`** es lógica pura: sin React, sin SQLite. Es lo que se puede
  testear aislado (recurrencia, rachas, XP).

## Commits

Conventional Commits en español (`feat:`, `fix:`, `refactor:`, `chore:`).
**Nunca** añadir líneas de coautoría ni atribución de IA en los mensajes.
