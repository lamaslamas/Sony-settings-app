import { applicaAggiornamento, installa, usePwa } from '../lib/pwa';
import { Callout } from './Callout';

const èIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Stato dell'app sul telefono: offline pronto, rete, installazione. */
export function StatoApp() {
  const p = usePwa();
  return (
    <div class="card stack">
      <h2 style={{ margin: 0 }}>Uso sul set</h2>
      <div><span class="name">Offline</span> → <span class="value">{p.offlinePronta ? 'pronta ✓' : 'in preparazione…'}</span></div>
      {!p.offlinePronta && <p class="small dim" style={{ margin: 0 }}>Apri l'app una volta con la rete: poi funziona anche senza.</p>}
      <div><span class="name">Rete</span> → <span class="value">{p.online ? 'online' : 'assente (va tutto lo stesso)'}</span></div>
      {p.installabile && !p.installata && <button class="btn primary block" onClick={installa}>Installa l'app</button>}
      {!p.installata && !p.installabile && èIos() && <Callout>Per installarla: tocca Condividi, poi “Aggiungi alla schermata Home”.</Callout>}
      {p.aggiornamento && <button class="btn block" onClick={applicaAggiornamento}>Nuova versione pronta: aggiorna</button>}
    </div>
  );
}
