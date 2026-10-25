// Hook che condivide lo stato (src/lib/storage.ts) tra tutte le schermate e lo salva a ogni modifica.
import { useEffect, useState } from 'preact/hooks';
import { carica, salva, eventoCorrente, type Evento, type Stato } from './storage';

let stato: Stato = carica();
const ascoltatori = new Set<() => void>();

export function aggiorna(f: (s: Stato) => Stato): void {
  stato = f(stato);
  salva(stato);
  ascoltatori.forEach((l) => l());
}

export function useStato(): { stato: Stato; evento: Evento; aggiorna: typeof aggiorna } {
  const [, forza] = useState(0);
  useEffect(() => {
    const l = () => forza((n) => n + 1);
    ascoltatori.add(l);
    return () => { ascoltatori.delete(l); };
  }, []);
  return { stato, evento: eventoCorrente(stato), aggiorna };
}
