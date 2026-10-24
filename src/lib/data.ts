// Punto unico di accesso ai JSON + piccole funzioni di ricerca.
import menuJson from '../data/menu-fw400.json';
import baseVideoJson from '../data/base-video-m1.json';
import baseFotoJson from '../data/base-foto-m2.json';
import situazioniJson from '../data/situazioni.json';
import obiettiviJson from '../data/obiettivi.json';
import guidaJson from '../data/guida.json';
import type {
  BaseEntry, BaseFile, GuidaFile, MenuItem, MenuRef, MenuTab, MenuTree,
  ObiettiviFile, Situazione, SituazioniFile,
} from '../types';

export const menu = menuJson as MenuTree;
export const baseVideo = baseVideoJson as BaseFile;
export const baseFoto = baseFotoJson as BaseFile;
export const situazioniFile = situazioniJson as unknown as SituazioniFile;
export const situazioni: Situazione[] = situazioniFile.situazioni;
export const obiettivi = obiettiviJson as ObiettiviFile;
export const guida = guidaJson as GuidaFile;

export const tabById = (id: string): MenuTab | undefined => menu.tabs.find((t) => t.id === id);
export const situazioneById = (id: string) => situazioni.find((s) => s.id === id);

/** Cerca la voce nel menu; restituisce undefined se non esiste (niente di inventato). */
export function findMenuItem(ref: MenuRef): MenuItem | undefined {
  const group = tabById(ref.tab)?.groups.find((g) => g.name === ref.group);
  const item = group?.items.find((i) => i.name === ref.item);
  if (!item || !ref.sub) return item;
  return item.subItems?.find((s) => s.name === ref.sub);
}

/** Percorso come si legge sulla fotocamera: MENU › Scheda › Gruppo › Voce. */
export function menuPath(ref: MenuRef): string {
  const tab = tabById(ref.tab)?.name ?? ref.tab;
  return ['MENU', tab, ref.group, ref.item, ref.sub].filter(Boolean).join(' › ');
}

/** Posizione di una voce nell'ordine del menu (per ordinare le basi come sulla fotocamera). */
function menuOrder(ref: MenuRef): number[] {
  const ti = menu.tabs.findIndex((t) => t.id === ref.tab);
  const tab = menu.tabs[ti];
  const gi = tab ? tab.groups.findIndex((g) => g.name === ref.group) : -1;
  const ii = tab && gi >= 0 ? tab.groups[gi].items.findIndex((i) => i.name === ref.item) : -1;
  return [ti, gi, ii];
}

export interface GroupedEntries {
  tab: MenuTab;
  groups: { name: string; entries: BaseEntry[] }[];
}

/** Raggruppa le voci per scheda e gruppo, in ordine di menu. */
export function groupEntries(entries: BaseEntry[]): GroupedEntries[] {
  const sorted = [...entries].sort((a, b) => {
    const x = menuOrder(a), y = menuOrder(b);
    for (let k = 0; k < 3; k++) if (x[k] !== y[k]) return x[k] - y[k];
    return 0;
  });
  const out: GroupedEntries[] = [];
  for (const e of sorted) {
    const tab = tabById(e.tab);
    if (!tab) continue;
    let t = out.find((o) => o.tab.id === tab.id);
    if (!t) out.push((t = { tab, groups: [] }));
    let g = t.groups.find((x) => x.name === e.group);
    if (!g) t.groups.push((g = { name: e.group, entries: [] }));
    g.entries.push(e);
  }
  return out;
}

/** Elenco di tutte le voci con verify:true, raggruppate per scheda (fase 1: da controllare sulla camera). */
export interface VerifyRow { where: string; label: string; value?: string; note?: string }
export function collectVerify(): { tab: MenuTab | null; title: string; rows: VerifyRow[] }[] {
  const byTab = new Map<string, VerifyRow[]>();
  const add = (tabId: string | null, row: VerifyRow) => {
    const k = tabId ?? '_altro';
    byTab.set(k, [...(byTab.get(k) ?? []), row]);
  };
  const lbl = (r: MenuRef) => [r.group, r.item, r.sub].filter(Boolean).join(' › ');

  for (const base of [baseVideo, baseFoto]) {
    for (const e of [...base.entries, ...base.setup]) {
      if (e.verify) add(e.tab, { where: base.titolo, label: lbl(e), value: e.value, note: e.note });
    }
  }
  for (const s of situazioni) {
    for (const d of s.diff) {
      if (!d.verify) continue;
      if (d.source === 'menu' && d.ref) add(d.ref.tab, { where: s.nome, label: lbl(d.ref), value: d.value, note: d.note });
      else add(null, { where: s.nome, label: d.label ?? obiettivi.controlli[d.control ?? ''] ?? d.id, value: d.value, note: d.note });
    }
    if (s.zebre?.verify) add('exposure', { where: s.nome, label: 'Zebra › Zebra Level', value: s.zebre.livello, note: s.zebre.nota ?? 'Livello per le alte luci da verificare.' });
  }
  for (const m of menu.tabs) for (const g of m.groups) for (const i of g.items) {
    if (i.verify) add(m.id, { where: 'Menu', label: `${g.name} › ${i.name}`, note: i.note });
    for (const s of i.subItems ?? []) if (s.verify) add(m.id, { where: 'Menu', label: `${g.name} › ${i.name} › ${s.name}`, note: s.note });
  }
  for (const [kind, passi] of Object.entries(situazioniFile.salvataggioEvento)) {
    for (const p of passi.passi) if (p.verify) add('shooting', { where: `Salva per l'evento (${kind})`, label: lbl(p.menu), value: p.valore, note: p.note });
  }
  for (const c of guida.concetti) if (c.verify) add('shooting', { where: 'Guida', label: c.titolo, note: c.nota });
  for (const c of guida.preRipresa.comune) if (c.verify) add(null, { where: 'Pre-ripresa', label: c.testo, note: c.verifyNota });
  for (const o of obiettivi.obiettivi) for (const c of o.controlli) if (c.verify) {
    add(null, { where: 'Obiettivi', label: `${o.nome} › ${obiettivi.controlli[c.id]}` });
  }

  const result = menu.tabs.filter((t) => byTab.has(t.id)).map((t) => ({ tab: t, title: t.name, rows: byTab.get(t.id)! }));
  if (byTab.has('_altro')) result.push({ tab: null as never, title: 'Comandi e obiettivi (senza scheda)', rows: byTab.get('_altro')! });
  return result as { tab: MenuTab | null; title: string; rows: VerifyRow[] }[];
}
