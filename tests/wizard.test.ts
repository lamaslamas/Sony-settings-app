import { describe, expect, it } from 'vitest';
import { situazioni, baseVideo, baseFoto } from '../src/lib/data';
import { chiavePasso, chiavePassoBase, costruisciPassi, ordinaDiff, passiBase } from '../src/lib/wizard';
import { impostaPasso, eventoCorrente, nuovoStato, impostaVista, vistaCorrente, impostaPassoBase, impostaSpunta, azzeraSpunteGlobali } from '../src/lib/storage';

const sit = (id: string) => situazioni.find((s) => s.id === id)!;

describe('wizard', () => {
  it('ordina: Mode dial, obiettivo, voci di menu nell’ordine del menu, poi le altre ghiere', () => {
    const tipi = ordinaDiff(sit('wildlife').diff).map((d) => (d.source === 'dial' && /mode/i.test(d.label!) ? 'mode' : d.source));
    expect(tipi[0]).toBe('mode');
    expect(tipi.slice(1, 4)).toEqual(['lens', 'lens', 'lens']);
    const primoMenu = tipi.indexOf('menu'), ultimoMenu = tipi.lastIndexOf('menu'), primaGhiera = tipi.indexOf('dial');
    expect(primoMenu).toBe(4);
    expect(primaGhiera).toBeGreaterThan(ultimoMenu);
  });

  it('le voci di menu seguono scheda › gruppo › voce', () => {
    const voci = ordinaDiff(sit('wildlife').diff).filter((d) => d.source === 'menu').map((d) => d.ref!);
    const tabs = voci.map((r) => r.tab);
    // Shooting (Drive Mode) prima di Exposure/Color (ISO, Zebra) prima di Focus
    expect(tabs.indexOf('shooting')).toBeLessThan(tabs.indexOf('exposure'));
    expect(tabs.indexOf('exposure')).toBeLessThan(tabs.indexOf('focus'));
    const iso = voci.findIndex((r) => r.item === 'ISO'), limite = voci.findIndex((r) => r.item === 'ISO Range Limit');
    expect(iso).toBeLessThan(limite);
  });

  it('i passi: inizio, differenze, esposizione, salvataggio, fine', () => {
    const s = sit('intervista-chiuso');
    const passi = costruisciPassi(s, s.diff, 1);
    expect(passi[0].tipo).toBe('intro');
    expect(passi.at(-1)!.tipo).toBe('fine');
    expect(passi.at(-2)!.tipo).toBe('salva');
    expect(passi.filter((p) => p.tipo === 'diff')).toHaveLength(s.diff.length);
    expect(passi.map((p) => chiavePasso(s.id, p)).filter(Boolean)).toHaveLength(s.diff.length + 2);
  });

  it('ricorda il passo per situazione e per evento', () => {
    let st = impostaPasso(nuovoStato(), 'wildlife', 5);
    st = impostaPasso(st, 'paesaggio', 2);
    expect(eventoCorrente(st).passi).toEqual({ wildlife: 5, paesaggio: 2 });
  });

  describe('wizard delle basi', () => {
    it('inizio, voci di menu in ordine di menu, voci di Setup, salvataggio, fine', () => {
      const passi = passiBase(baseVideo);
      expect(passi[0].tipo).toBe('intro');
      expect(passi.at(-1)!.tipo).toBe('fine');
      expect(passi.at(-2)!.tipo).toBe('salva');
      const voci = passi.filter((p) => p.tipo === 'voce') as { tipo: 'voce'; setup: boolean; entry: { tab: string } }[];
      expect(voci).toHaveLength(baseVideo.entries.length + baseVideo.setup.length);
      // le voci di Setup stanno dopo tutte le altre
      const primoSetup = voci.findIndex((v) => v.setup);
      expect(voci.slice(primoSetup).every((v) => v.setup)).toBe(true);
      // la parte salvata segue l'ordine delle schede: Shooting prima di Exposure/Color prima di Focus
      const tabs = voci.filter((v) => !v.setup).map((v) => v.entry.tab);
      expect(tabs.indexOf('shooting')).toBeLessThan(tabs.indexOf('exposure'));
      expect(tabs.lastIndexOf('exposure')).toBeLessThan(tabs.indexOf('focus'));
    });
    it('la base foto non ha voci di Setup', () => {
      expect(passiBase(baseFoto).some((p) => p.tipo === 'voce' && p.setup)).toBe(false);
    });
    it('ogni voce e il salvataggio hanno una chiave di spunta unica', () => {
      const passi = passiBase(baseVideo);
      const chiavi = passi.map((p, i) => chiavePassoBase('M1', i, p)).filter(Boolean);
      expect(new Set(chiavi).size).toBe(chiavi.length);
      expect(chiavi).toHaveLength(baseVideo.entries.length + baseVideo.setup.length + 1);
    });
  });

  describe('vista e progressi delle basi', () => {
    it('la vista parte a wizard e si può cambiare', () => {
      let st = nuovoStato();
      expect(vistaCorrente(st)).toBe('wizard');
      st = impostaVista(st, 'lista');
      expect(vistaCorrente(st)).toBe('lista');
    });
    it('passo e spunte delle basi valgono per tutti gli eventi e si possono azzerare', () => {
      let st = impostaPassoBase(nuovoStato(), 'M1', 7);
      st = impostaSpunta(st, 'base/M1/7', true, true);
      st = impostaSpunta(st, 'base/M2/3', true, true);
      expect(st.globali.passi).toEqual({ M1: 7 });
      st = azzeraSpunteGlobali(st, 'base/M1/');
      expect(st.globali.spunte).toEqual({ 'base/M2/3': true });
    });
  });
});
