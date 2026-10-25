import { describe, expect, it } from 'vitest';
import { situazioni } from '../src/lib/data';
import { chiavePasso, costruisciPassi, ordinaDiff } from '../src/lib/wizard';
import { impostaPasso, eventoCorrente, nuovoStato } from '../src/lib/storage';

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
});
