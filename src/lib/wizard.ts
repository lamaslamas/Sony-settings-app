// Passi del wizard di una situazione. Funzione pura: facile da testare e da modificare.
import type { Diff, Situazione } from '../types';
import { findMenuItem } from './data';
import { menu } from './data';

export type Passo =
  | { tipo: 'intro' }
  | { tipo: 'diff'; diff: Diff }
  | { tipo: 'esposizione' }
  | { tipo: 'salva'; indice: number }
  | { tipo: 'fine' };

/** Posizione nel menu della camera: serve a ordinare i passi come ci si muove nel menu. */
function posizioneMenu(d: Diff): number {
  if (d.source !== 'menu' || !d.ref) return 1e9;
  const t = menu.tabs.findIndex((x) => x.id === d.ref!.tab);
  const g = t >= 0 ? menu.tabs[t].groups.findIndex((x) => x.name === d.ref!.group) : 99;
  const i = t >= 0 && g >= 0 ? menu.tabs[t].groups[g].items.findIndex((x) => x.name === d.ref!.item) : 99;
  return t * 1e6 + g * 1e3 + i;
}

/**
 * Ordine dei passi, pensato per ridurre i giri sulla camera:
 *  1. Mode dial (cambia cosa si può impostare dopo)
 *  2. controlli dell'obiettivo (si fanno una volta, sull'obiettivo)
 *  3. voci di menu, nell'ordine del menu della camera (scheda › gruppo › voce)
 *  4. le altre ghiere (diaframma, tempo, compensazione) per ultime, col menu già a posto
 */
export function ordinaDiff(diff: Diff[]): Diff[] {
  const rango = (d: Diff) =>
    d.source === 'dial' && /mode dial/i.test(d.label ?? '') ? 0 : d.source === 'lens' ? 1 : d.source === 'menu' ? 2 : 3;
  return diff
    .map((d, i) => ({ d, i }))
    .sort((a, b) => rango(a.d) - rango(b.d) || (rango(a.d) === 2 ? posizioneMenu(a.d) - posizioneMenu(b.d) : 0) || a.i - b.i)
    .map((x) => x.d);
}

export function costruisciPassi(s: Situazione, diffVisibili: Diff[], nSalvataggio: number): Passo[] {
  return [
    { tipo: 'intro' },
    ...ordinaDiff(diffVisibili).map((diff): Passo => ({ tipo: 'diff', diff })),
    { tipo: 'esposizione' },
    ...Array.from({ length: nSalvataggio }, (_, indice): Passo => ({ tipo: 'salva', indice })),
    { tipo: 'fine' },
  ];
}

/** Chiave della spunta di un passo (stessa usata dall'elenco e da “Riprendi”). */
export function chiavePasso(sid: string, p: Passo): string | null {
  if (p.tipo === 'diff') return `sit/${sid}/${p.diff.id}`;
  if (p.tipo === 'salva') return `sit/${sid}/salva/${p.indice}`;
  if (p.tipo === 'esposizione') return `sit/${sid}/esposizione`;
  return null;
}

/** Vero se la voce di menu del passo esiste davvero in menu-fw400.json. */
export const vocePresente = (d: Diff) => d.source !== 'menu' || (!!d.ref && !!findMenuItem(d.ref));
