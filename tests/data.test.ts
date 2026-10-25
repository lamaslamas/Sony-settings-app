import { describe, expect, it } from 'vitest';
import { baseVideo, baseFoto, situazioni, obiettivi, guida, findMenuItem, situazioniFile, menu } from '../src/lib/data';
import type { MenuRef } from '../src/types';

// Regola “niente di inventato”: ogni riferimento al menu deve esistere in menu-fw400.json.
describe('integrità dei dati', () => {
  const refs: [string, MenuRef][] = [];
  for (const b of [baseVideo, baseFoto]) {
    for (const e of [...b.entries, ...b.setup]) refs.push([`${b.id} ${e.item}`, e]);
    refs.push([`${b.id} salvataggio`, b.salvataggio.menu]);
  }
  for (const s of situazioni) for (const d of s.diff) if (d.source === 'menu') refs.push([`${s.id} ${d.id}`, d.ref!]);
  for (const k of Object.values(situazioniFile.salvataggioEvento)) for (const p of k.passi) refs.push([`salva ${p.testo}`, p.menu]);
  for (const g of guida.passi) for (const p of g.passi) if (p.menu) refs.push([`guida ${p.testo}`, p.menu]);

  it.each(refs)('%s esiste nel menu', (_n, ref) => {
    expect(findMenuItem(ref), JSON.stringify(ref)).toBeDefined();
  });

  it('le voci di base con valore in options usano un valore noto', () => {
    for (const e of [...baseVideo.entries, ...baseFoto.entries]) {
      const item = findMenuItem(e);
      const opts = item?.options;
      if (opts && !item?.open && !e.verify) expect(opts, `${e.item}: ${e.value}`).toContain(e.value);
    }
  });

  it('le situazioni puntano a base e controlli esistenti', () => {
    for (const s of situazioni) {
      expect(['M1', 'M2']).toContain(s.base);
      for (const d of s.diff) if (d.source === 'lens') expect(obiettivi.controlli[d.control!]).toBeDefined();
    }
  });

  it('ogni scheda ha icona e token colore', () => {
    for (const t of menu.tabs) { expect(t.icon).toBeTruthy(); expect(t.colorToken).toMatch(/^--tab-/); }
  });
});
