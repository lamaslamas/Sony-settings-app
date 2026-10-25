import { usePath } from './router';
import { Nav } from './components/Nav';
import { Home } from './screens/Home';
import { Luce } from './screens/Luce';
import { Situazione } from './screens/Situazione';
import { Base } from './screens/Base';
import { Guida } from './screens/Guida';
import { PreRipresa } from './screens/PreRipresa';
import { MenuTree } from './screens/MenuTree';
import { Verifiche } from './screens/Verifiche';
import { Eventi } from './screens/Eventi';
import { EventoBar } from './components/EventoBar';

export function App() {
  const path = usePath();
  let screen;
  if (path === '/') screen = <Home />;
  else if (path === '/luce') screen = <Luce />;
  else if (path.startsWith('/situazione/')) screen = <Situazione id={path.split('/')[2]} />;
  else if (path === '/basi/foto') screen = <Base tipo="foto" />;
  else if (path.startsWith('/basi')) screen = <Base tipo="video" />;
  else if (path === '/guida') screen = <Guida />;
  else if (path === '/pre-ripresa') screen = <PreRipresa />;
  else if (path === '/menu') screen = <MenuTree />;
  else if (path === '/verifiche') screen = <Verifiche />;
  else if (path === '/eventi') screen = <Eventi />;
  else screen = <Home />;
  return (
    <div class="app">
      <EventoBar />
      <main>{screen}</main>
      <Nav path={path} />
    </div>
  );
}
