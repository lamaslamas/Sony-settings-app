// Stato salvato in locale (localStorage), per evento: così riprendo dove ero.
// Le funzioni sono pure (prendono lo stato e ne restituiscono uno nuovo) e quindi facili da testare.

export type ModalitaZebre = 'isoAuto' | 'isoFisso';

export interface Evento {
  id: string;
  nome: string;
  creatoIl: number;
  /** Obiettivo montato (id in obiettivi.json). */
  obiettivoId: string | null;
  /** Metodo zebre scelto per wildlife e B-roll. */
  modalitaZebre: ModalitaZebre | null;
  /** Ultima situazione aperta (per “riprendi”). */
  ultimaSituazione: string | null;
  /** Caselle spuntate: chiave → true. */
  spunte: Record<string, boolean>;
  /** Valori modificati a mano: chiave → valore. */
  valori: Record<string, string>;
}

export interface Stato {
  versione: 1;
  eventoId: string;
  eventi: Record<string, Evento>;
  /** Spunte non legate a un evento (passo A della guida: si fa una volta sola). */
  globali: { spunte: Record<string, boolean> };
}

export const STORAGE_KEY = 'sony-a7rv:stato:v1';

export function creaEventoVuoto(nome: string, id = `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`): Evento {
  return { id, nome, creatoIl: Date.now(), obiettivoId: null, modalitaZebre: null, ultimaSituazione: null, spunte: {}, valori: {} };
}

export function nuovoStato(): Stato {
  const e = creaEventoVuoto('Evento 1');
  return { versione: 1, eventoId: e.id, eventi: { [e.id]: e }, globali: { spunte: {} } };
}

export const eventoCorrente = (s: Stato): Evento => s.eventi[s.eventoId];

export function aggiungiEvento(s: Stato, nome?: string): Stato {
  const n = Object.keys(s.eventi).length + 1;
  const e = creaEventoVuoto(nome?.trim() || `Evento ${n}`);
  return { ...s, eventoId: e.id, eventi: { ...s.eventi, [e.id]: e } };
}

export function selezionaEvento(s: Stato, id: string): Stato {
  return s.eventi[id] ? { ...s, eventoId: id } : s;
}

export function rinominaEvento(s: Stato, id: string, nome: string): Stato {
  const e = s.eventi[id];
  if (!e || !nome.trim()) return s;
  return { ...s, eventi: { ...s.eventi, [id]: { ...e, nome: nome.trim() } } };
}

/** Elimina un evento; ne resta sempre almeno uno. */
export function eliminaEvento(s: Stato, id: string): Stato {
  if (!s.eventi[id]) return s;
  const { [id]: _tolto, ...resto } = s.eventi;
  if (Object.keys(resto).length === 0) return nuovoStato();
  const eventoId = s.eventoId === id ? Object.values(resto).sort((a, b) => b.creatoIl - a.creatoIl)[0].id : s.eventoId;
  return { ...s, eventoId, eventi: resto };
}

/** Modifica l'evento corrente. */
export function aggiornaEvento(s: Stato, f: (e: Evento) => Evento): Stato {
  const e = eventoCorrente(s);
  return { ...s, eventi: { ...s.eventi, [e.id]: f(e) } };
}

export function impostaSpunta(s: Stato, chiave: string, valore: boolean, globale = false): Stato {
  const set = (m: Record<string, boolean>) => {
    const out = { ...m };
    if (valore) out[chiave] = true; else delete out[chiave];
    return out;
  };
  return globale
    ? { ...s, globali: { spunte: set(s.globali.spunte) } }
    : aggiornaEvento(s, (e) => ({ ...e, spunte: set(e.spunte) }));
}

/** Toglie tutte le spunte (dell'evento) che iniziano con il prefisso. */
export function azzeraSpunte(s: Stato, prefisso: string): Stato {
  return aggiornaEvento(s, (e) => ({
    ...e,
    spunte: Object.fromEntries(Object.entries(e.spunte).filter(([k]) => !k.startsWith(prefisso))),
  }));
}

/** Imposta (o, con undefined, ripristina) un valore modificato a mano. */
export function impostaValore(s: Stato, chiave: string, valore: string | undefined): Stato {
  return aggiornaEvento(s, (e) => {
    const valori = { ...e.valori };
    if (valore === undefined || valore.trim() === '') delete valori[chiave]; else valori[chiave] = valore.trim();
    return { ...e, valori };
  });
}

export const contaSpunte = (e: Evento, prefisso: string): number =>
  Object.keys(e.spunte).filter((k) => k.startsWith(prefisso)).length;

/** Legge lo stato; se manca, è rovinato o localStorage non è disponibile, parte da zero. */
export function carica(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): Stato {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return nuovoStato();
    const s = JSON.parse(raw) as Stato;
    if (s.versione !== 1 || !s.eventi || !s.eventi[s.eventoId]) return nuovoStato();
    return { ...s, globali: s.globali ?? { spunte: {} } };
  } catch {
    return nuovoStato();
  }
}

export function salva(s: Stato, storage: Pick<Storage, 'setItem'> | undefined = safeStorage()): void {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* spazio pieno o accesso negato: l'app funziona comunque */ }
}

function safeStorage(): Storage | undefined {
  try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; }
}
