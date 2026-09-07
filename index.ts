// `react-native-gesture-handler` debe importarse antes que cualquier otra cosa
// para que registre su manejador nativo de toques al arrancar la app.
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from '@/App';

registerRootComponent(App);
