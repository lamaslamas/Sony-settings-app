import { describe, expect, it } from 'vitest';
import { baseFoto, baseVideo, situazioneById, situazioniFile } from '../src/lib/data';
import { proponi, SCELTE_INIZIALI, type Scelte } from '../src/lib/proposte';
import type { LetturaLuce } from '../src/lib/analisi';
import { isoNecessario } from '../src/lib/ev';

const lettura = (ev: number, valida = true): LetturaLuce => ({
  valida, problemi: valida ? [] : ['Foto troppo scura'], avvisi: [], ev: valida ? ev : null, evDescrizione: '',
  temperaturaK: 4000, dominante: 'neutra', tinta: null, luceMista: null, affidabilitaColore: 'alta', origine: 'camera-jpeg',
  impostazioni: { iso: 800, tempo: 1 / 50, diaframma: 4, daExif: true }, istogramma: [],
});
const prop = (id: string, ev: number | null, sc: Partial<Scelte> = {}, modificati: Record<string, string> = {}) => {
  const s = situazioneById(id)!;
  return proponi({ s, base: s.base === 'M1' ? baseVideo : baseFoto, regole: situazioniFile.regole, lettura: ev === null ? null : lettura(ev), scelte: { ...SCELTE_INIZIALI, ...sc }, modificati });
};

describe('proposte dalla lettura della luce', () => {
  describe('intervista', () => {
    it('sala poco luminosa (EV 5): 1/50, ISO fisso calcolato, mai ISO AUTO', () => {
      const p = prop('intervista-chiuso', 5);
      expect(p.perDiff.shutter.valore).toBe('1/50');
      expect(p.perDiff.aperture.valore).toBe('F2.8');
      const iso = Number(p.perDiff.iso.valore);
      expect(iso).toBeGreaterThan(1000);
      expect(iso).toBeLessThan(1600);
      expect(iso).toBeLessThanOrEqual(12800);
      expect(p.perDiff.iso.origine).toBe('calcolato');
      // l'esposizione torna: ISO·t·2^EV ≈ N²·100
      expect(Math.abs(Math.log2(isoNecessario(5, 2.8, 1 / 50) / iso))).toBeLessThan(0.4);
    });

    it('il diaframma non va oltre l’apertura massima dell’obiettivo', () => {
      expect(prop('intervista-chiuso', 6, { diaframmaMax: 4 }).perDiff.aperture.valore).toBe('F4');
    });

    it('troppa luce, senza ND: piano B 1/100 e diaframma più chiuso', () => {
      const p = prop('intervista-aperto', 11);
      expect(p.perDiff.shutter.valore).toBe('1/100');
      expect(p.perDiff.shutter.correzioni.some((c) => c.regolaId === 'int-piano-b-nd')).toBe(true);
      expect(parseFloat(p.perDiff.aperture.valore.slice(1))).toBeGreaterThan(2.8);
      expect(Number(p.perDiff.iso.valore)).toBeGreaterThanOrEqual(100);
    });

    it('troppa luce, con ND: resta 1/50 e dice quanti stop togliere', () => {
      const p = prop('intervista-aperto', 11, { nd: true });
      expect(p.perDiff.shutter.valore).toBe('1/50');
      expect(p.note.join(' ')).toMatch(/ND/);
    });

    it('troppo buio: ISO al limite e avviso di sottoesposizione', () => {
      const p = prop('intervista-chiuso', 1);
      expect(p.perDiff.iso.valore).toBe('12800');
      expect(p.previsione.join(' ')).toMatch(/sottoesposizione/i);
      expect(p.note.join(' ')).toMatch(/sottoesposto/);
    });

    it('foto di prova da rifare: nessun valore calcolato', () => {
      const p = prop('intervista-chiuso', 5, {}, {});
      const r = proponi({ s: situazioneById('intervista-chiuso')!, base: baseVideo, regole: situazioniFile.regole, lettura: lettura(5, false), scelte: SCELTE_INIZIALI, modificati: {} });
      expect(p.daRifare).toBe(false);
      expect(r.daRifare).toBe(true);
      expect(r.perDiff.iso.origine).toBe('fisso');
    });

    it('senza foto di prova resta il valore fisso della situazione', () => {
      const p = prop('intervista-chiuso', null);
      expect(p.perDiff.shutter.valore).toBe('1/50');
      expect(p.perDiff.iso.origine).toBe('fisso');
    });

    it('un valore modificato a mano resta, ma se viola una regola lo dice', () => {
      const p = prop('intervista-chiuso', 5, {}, { shutter: '1/60' });
      expect(p.perDiff.shutter.valore).toBe('1/60');
      expect(p.perDiff.shutter.origine).toBe('utente');
      expect(p.perDiff.shutter.correzioni[0].regolaId).toBe('int-tempo');
      expect(prop('intervista-chiuso', 5, {}, { shutter: '1/100' }).perDiff.shutter.correzioni).toHaveLength(0);
    });
  });

  describe('B-roll', () => {
    it('ISO AUTO, tempo 1/50, diaframma dalla luce', () => {
      const scura = prop('broll-chiuso', 5), chiara = prop('broll-aperto', 12);
      expect(scura.perDiff.iso.valore).toBe('ISO AUTO');
      expect(scura.perDiff.shutter.valore).toBe('1/50');
      const f = (p: typeof scura) => parseFloat(p.perDiff.aperture.valore.slice(1));
      expect(f(chiara)).toBeGreaterThan(f(scura));
    });
  });

  describe('foto', () => {
    it('wildlife: 1/1000 fermo, 1/2000 in volo (corretto dalla regola, con spiegazione)', () => {
      expect(prop('wildlife', 11).perDiff.shutter.valore).toBe('1/1000');
      const volo = prop('wildlife', 11, { soggetto: 'volo' });
      expect(volo.perDiff.shutter.valore).toBe('1/2000');
      expect(volo.perDiff.shutter.correzioni[0].regolaId).toBe('wild-tempo-volo');
    });

    it('wildlife: con poca luce avvisa che l’ISO 6400 non basta', () => {
      const p = prop('wildlife', 6, { diaframmaMax: 5.6 });
      expect(p.previsione.join(' ')).toMatch(/oltre il limite 6400/);
    });

    it('conferenza: dice quale ISO ci si aspetta', () => {
      expect(prop('conferenza', 5).previsione.join(' ')).toMatch(/ISO atteso/);
    });

    it('paesaggio: se l’utente mette F2.8 la regola F5.6–F8 lo segnala', () => {
      expect(prop('paesaggio', 10, {}, { aperture: 'F2.8' }).perDiff.aperture.correzioni[0].regolaId).toBe('paes-diaframma');
    });
  });
});
