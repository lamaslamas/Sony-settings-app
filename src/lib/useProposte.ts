// Collega lo stato dell'evento (lettura, scelte, obiettivo, valori modificati) alle proposte.
import type { Situazione } from '../types';
import type { Evento } from './storage';
import { baseFoto, baseVideo, obiettivi, situazioniFile } from './data';
import { proponi, SCELTE_INIZIALI, type Proposte, type Scelte } from './proposte';

/** Luci artificiali: suggerimento dalla lettura (luce calda, tinta non neutra o interno poco illuminato). */
export function suggerisciLuciArtificiali(e: Evento): boolean {
  const l = e.lettura;
  if (!l || !l.valida) return false;
  return l.dominante === 'calda' || (l.tinta?.etichetta ?? 'neutra') !== 'neutra' || (l.ev ?? 99) < 9;
}

export function scelteDi(e: Evento): Scelte {
  const lens = obiettivi.obiettivi.find((o) => o.id === e.obiettivoId);
  return {
    ...SCELTE_INIZIALI,
    nd: e.scelte?.nd ?? false,
    soggetto: e.scelte?.soggetto ?? 'fermo',
    luciArtificiali: e.scelte?.luciArtificiali ?? suggerisciLuciArtificiali(e),
    diaframmaMax: lens?.diaframmaMax ?? null,
  };
}

export function proposteDi(s: Situazione, e: Evento): Proposte {
  const prefisso = `sit/${s.id}/`;
  const modificati: Record<string, string> = {};
  for (const [k, v] of Object.entries(e.valori)) if (k.startsWith(prefisso)) modificati[k.slice(prefisso.length)] = v;
  return proponi({
    s, base: s.base === 'M1' ? baseVideo : baseFoto, regole: situazioniFile.regole,
    lettura: e.lettura ?? null, scelte: scelteDi(e), modificati,
  });
}
