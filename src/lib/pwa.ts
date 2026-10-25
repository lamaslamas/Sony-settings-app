// Stato della PWA: pronta offline, aggiornamento disponibile, installabile, rete.
// Il service worker (generato da vite-plugin-pwa) mette in cache app e dati: tutto funziona senza rete.
import { useEffect, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';

interface StatoPwa { offlinePronta: boolean; aggiornamento: boolean; installabile: boolean; installata: boolean; online: boolean }

let stato: StatoPwa = {
  offlinePronta: false, aggiornamento: false, installabile: false,
  installata: typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
};
const ascoltatori = new Set<() => void>();
const cambia = (parte: Partial<StatoPwa>) => { stato = { ...stato, ...parte }; ascoltatori.forEach((l) => l()); };

let invitoInstallazione: (Event & { prompt: () => Promise<void> }) | null = null;
let aggiorna: ((ricarica?: boolean) => Promise<void>) | null = null;

/** Da chiamare una volta all'avvio. */
export function avviaPwa(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => cambia({ online: true }));
  window.addEventListener('offline', () => cambia({ online: false }));
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitoInstallazione = e as never; cambia({ installabile: true }); });
  window.addEventListener('appinstalled', () => { invitoInstallazione = null; cambia({ installabile: false, installata: true }); });
  try {
    aggiorna = registerSW({
      immediate: true,
      onOfflineReady: () => cambia({ offlinePronta: true }),
      onNeedRefresh: () => cambia({ aggiornamento: true }),
    });
  } catch { /* senza service worker (es. anteprima o browser vecchio) l'app funziona comunque online */ }
  // Se il service worker è già attivo da una visita precedente, l'offline è già pronto.
  navigator.serviceWorker?.ready.then(() => cambia({ offlinePronta: true })).catch(() => {});
}

export const installa = async () => { await invitoInstallazione?.prompt(); };
export const applicaAggiornamento = () => aggiorna?.(true);

export function usePwa(): StatoPwa {
  const [, forza] = useState(0);
  useEffect(() => {
    const l = () => forza((n) => n + 1);
    ascoltatori.add(l);
    return () => { ascoltatori.delete(l); };
  }, []);
  return stato;
}
