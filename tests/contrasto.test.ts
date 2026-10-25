import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Legge i colori da src/theme/tokens.css e controlla il contrasto (WCAG) delle coppie importanti.
const css = readFileSync(new URL('../src/theme/tokens.css', import.meta.url), 'utf8');
const colore = (nome: string): string => {
  const m = new RegExp(`${nome.replace(/[-]/g, '\\-')}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!m) throw new Error(`token ${nome} non trovato`);
  return m[1];
};
const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const contrasto = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe('contrasto dei colori (testo ≥ 4.5:1, icone e bordi ≥ 3:1)', () => {
  const testo: [string, string, string][] = [
    ['testo su sfondo', '--text', '--bg'],
    ['testo su card', '--text', '--surface'],
    ['testo su card chiara', '--text', '--surface-2'],
    ['testo attenuato su sfondo', '--text-dim', '--bg'],
    ['testo attenuato su card', '--text-dim', '--surface'],
    ['testo attenuato su card chiara', '--text-dim', '--surface-2'],
    ['accento su sfondo', '--accent', '--bg'],
    ['accento su card', '--accent', '--surface'],
    ['accento su card chiara', '--accent', '--surface-2'],
    ['testo su accento', '--on-accent', '--accent'],
    ['testo su riga selezionata (camera)', '--cam-sel-text', '--cam-sel'],
    ['testo su schermo camera', '--cam-text', '--cam-bg'],
    ['testo voci su pannello (camera)', '--cam-text', '--cam-panel'],
    ['testo attenuato su lista (camera)', '--cam-dim', '--cam-list'],
    ['testo attenuato su nero (camera)', '--cam-dim', '--cam-bg'],
  ];
  it.each(testo)('%s', (_n, fg, bg) => expect(contrasto(colore(fg), colore(bg))).toBeGreaterThanOrEqual(4.5));

  const schede = ['main', 'shooting', 'exposure', 'focus', 'playback', 'network', 'setup', 'mymenu'];
  it.each(schede)('etichetta scheda %s: testo bianco leggibile', (t) => {
    expect(contrasto(colore('--on-tab'), colore(`--tab-${t}`))).toBeGreaterThanOrEqual(4.5);
  });
  it.each(['shooting', 'exposure', 'focus', 'playback', 'network', 'setup'])('scheda attiva della camera %s: icona e numero bianchi ≥ 3:1', (t) => {
    expect(contrasto('#ffffff', colore(`--cam-tab-${t}`))).toBeGreaterThanOrEqual(3);
  });
  it('bordi visibili sullo sfondo (≥ 3:1)', () => expect(contrasto(colore('--border'), colore('--bg'))).toBeGreaterThanOrEqual(3));
});
