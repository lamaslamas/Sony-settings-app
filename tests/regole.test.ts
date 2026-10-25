import { describe, expect, it } from 'vitest';
import { situazioniFile } from '../src/lib/data';
import { applicaRegole } from '../src/lib/regole';

const R = situazioniFile.regole;
const t = (tags: string[], v: object, ctx = {}) => applicaRegole(R, tags, v, ctx);
const campi = (e: ReturnType<typeof t>) => e.correzioni.map((c) => c.campo);

describe('regole fisse', () => {
  describe('interviste', () => {
    it('tempo: solo 1/50 o 1/100 (corregge al più vicino)', () => {
      expect(t(['video', 'intervista'], { shutterDenominator: 60 }).valori.shutterDenominator).toBe(50);
      expect(t(['video', 'intervista'], { shutterDenominator: 80 }).valori.shutterDenominator).toBe(100);
      expect(t(['video', 'intervista'], { shutterDenominator: 100 }).correzioni).toHaveLength(0);
    });
    it('mai ISO AUTO', () => {
      const e = t(['video', 'intervista'], { isoAuto: true });
      expect(e.valori.isoAuto).toBe(false);
      expect(e.correzioni[0].messaggio).toMatch(/mai ISO AUTO/);
    });
    it('White Balance mai Auto → Custom 1', () => {
      expect(t(['video', 'intervista'], { whiteBalance: 'Auto' }).valori.whiteBalance).toBe('Custom 1');
      expect(t(['video', 'intervista'], { whiteBalance: '5600K' }).correzioni).toHaveLength(0);
    });
    it('SteadyShot Off', () => expect(t(['video', 'intervista'], { steadyShot: 'On' }).valori.steadyShot).toBe('Off'));
    it('piano B senza ND con troppa luce: 1/100 e diaframma più chiuso', () => {
      const e = t(['video', 'intervista'], { shutterDenominator: 50 }, { senzaND: true, troppaLuce: true });
      expect(e.valori.shutterDenominator).toBe(100);
      expect(e.imposizioni.apertura).toBe('piuChiusa');
      const con = t(['video', 'intervista'], { shutterDenominator: 50 }, { senzaND: false, troppaLuce: true });
      expect(con.valori.shutterDenominator).toBe(50);
      expect(con.imposizioni.apertura).toBeUndefined();
    });
  });

  describe('tutto il video', () => {
    it('25p, PP11, White Balance mai Auto', () => {
      const e = t(['video', 'broll'], { frameRate: '30p', pictureProfile: 'Off', whiteBalance: 'Auto' });
      expect(e.valori).toMatchObject({ frameRate: '25p', pictureProfile: 'PP11 (S-Cinetone)', whiteBalance: 'Custom 1' });
    });
  });

  describe('B-roll', () => {
    it('ISO AUTO consentito, tempo 1/50 o 1/100, SteadyShot On', () => {
      expect(t(['video', 'broll'], { isoAuto: true, shutterDenominator: 50, steadyShot: 'On' }).correzioni).toHaveLength(0);
      expect(t(['video', 'broll'], { shutterDenominator: 125 }).valori.shutterDenominator).toBe(100);
      expect(t(['video', 'broll'], { steadyShot: 'Off' }).valori.steadyShot).toBe('On');
    });
  });

  describe('foto in generale', () => {
    it('ISO AUTO mai oltre 12800, SteadyShot On', () => {
      expect(t(['foto'], { isoAutoMax: 25600 }).valori.isoAutoMax).toBe(12800);
      expect(t(['foto'], { steadyShot: 'Off' }).valori.steadyShot).toBe('On');
    });
    it('luci artificiali → Mechanical Shutter; senza luci artificiali non interviene', () => {
      expect(t(['foto'], { shutterType: 'Electronic Shutter' }, { luciArtificiali: true }).valori.shutterType).toBe('Mechanical Shutter');
      expect(t(['foto'], { shutterType: 'Electronic Shutter' }, { luciArtificiali: false }).correzioni).toHaveLength(0);
    });
  });

  describe('wildlife', () => {
    it('tempo mai sotto 1/1000', () => expect(t(['foto', 'wildlife'], { shutterDenominator: 500 }).valori.shutterDenominator).toBe(1000));
    it('in volo o in corsa almeno 1/2000', () => {
      expect(t(['foto', 'wildlife'], { shutterDenominator: 1000 }, { soggetto: 'volo' }).valori.shutterDenominator).toBe(2000);
      expect(t(['foto', 'wildlife'], { shutterDenominator: 1000 }, { soggetto: 'corsa' }).valori.shutterDenominator).toBe(2000);
      expect(t(['foto', 'wildlife'], { shutterDenominator: 1000 }, { soggetto: 'fermo' }).correzioni).toHaveLength(0);
      expect(t(['foto', 'wildlife'], { shutterDenominator: 3200 }, { soggetto: 'volo' }).correzioni).toHaveLength(0);
    });
    it('ISO AUTO massimo 6400, AF Illuminator Off', () => {
      expect(t(['foto', 'wildlife'], { isoAutoMax: 12800 }).valori.isoAutoMax).toBe(6400);
      expect(t(['foto', 'wildlife'], { afIlluminator: 'Auto' }).valori.afIlluminator).toBe('Off');
    });
  });

  describe('paesaggio', () => {
    it('diaframma tra F5.6 e F8', () => {
      expect(t(['foto', 'paesaggio'], { apertureF: 2.8 }).valori.apertureF).toBe(5.6);
      expect(t(['foto', 'paesaggio'], { apertureF: 16 }).valori.apertureF).toBe(8);
      expect(t(['foto', 'paesaggio'], { apertureF: 7.1 }).correzioni).toHaveLength(0);
    });
    it('Subject Recog in AF Off', () => expect(t(['foto', 'paesaggio'], { subjectRecogInAF: 'On' }).valori.subjectRecogInAF).toBe('Off'));
  });

  it('le regole di una situazione non si applicano alle altre', () => {
    expect(t(['foto', 'conferenza'], { shutterDenominator: 200, afIlluminator: 'Auto', apertureF: 2.8 }).correzioni).toHaveLength(0);
  });

  it('non modifica i valori in ingresso e spiega ogni correzione', () => {
    const v = { shutterDenominator: 60, whiteBalance: 'Auto' };
    const e = t(['video', 'intervista'], v);
    expect(v).toEqual({ shutterDenominator: 60, whiteBalance: 'Auto' });
    expect(e.correzioni.every((c) => c.messaggio.length > 10 && c.da !== c.a)).toBe(true);
    expect(campi(e).sort()).toEqual(['shutterDenominator', 'whiteBalance']);
  });
});
