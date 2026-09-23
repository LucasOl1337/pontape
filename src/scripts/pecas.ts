// /construir/pecas: the list opens each ficha; a shared #m3 link opens that one.
import { routeModule } from './modules';

routeModule(location.hash);
addEventListener('hashchange', () => routeModule(location.hash));
