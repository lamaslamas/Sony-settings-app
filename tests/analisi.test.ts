import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { analizzaPixel, nitidezzaLaplaciano, type ExifLite, type FotoInput } from '../src/lib/analisi';
import { lineareASrgb } from '../src/lib/colore';

/** Immagine sintetica con texture (per superare il controllo di nitidezza). */
function immagine(w: number, h: number, colore: (x: number, y: number) => [number, number, number], exif: ExifLite = {}, origine: FotoInput['origine'] = 'camera-jpeg'): FotoInput {
  const pixels = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b] = colore(x, y);
    const t = ((x * 7 + y * 13) % 11) / 11; // texture ±
    const i = 4 * (y * w + x);
    pixels[i] = r * (0.8 + 0.4 * t); pixels[i + 1] = g * (0.8 + 0.4 * t); pixels[i + 2] = b * (0.8 + 0.4 * t); pixels[i + 3] = 255;
  }
  return { pixels, width: w, height: h, exif, origine };
}
/** Colore sRGB di un grigio con una data luminanza lineare e dominante (r,g,b moltiplicatori). */
const grigio = (lin: number, d: [number, number, number] = [1, 1, 1]): [number, number, number] =>
  [lineareASrgb(lin * d[0]), lineareASrgb(lin * d[1]), lineareASrgb(lin * d[2])];
const FISSO: ExifLite = { make: 'SONY', iso: 800, tempo: 1 / 50, diaframma: 4, bilanciamento: 1 };

describe('analisi della foto di prova', () => {
  it('scena a grigio medio: EV ≈ EV delle impostazioni fisse (6,6) e luce ≈ 5500 K', () => {
    const r = analizzaPixel(immagine(120, 80, () => grigio(0.18), FISSO));
    expect(r.valida).toBe(true);
    expect(r.ev!).toBeGreaterThan(6.2);
    expect(r.ev!).toBeLessThan(7.0);
    expect(r.temperaturaK!).toBeGreaterThan(5200);
    expect(r.temperaturaK!).toBeLessThan(5800);
    expect(r.dominante).toBe('neutra');
    expect(r.luceMista?.livello).toBe('no');
    expect(r.impostazioni.daExif).toBe(true);
  });

  it('scena più chiara di due stop → EV più alto di circa 2', () => {
    const scura = analizzaPixel(immagine(120, 80, () => grigio(0.1), FISSO)).ev!;
    const chiara = analizzaPixel(immagine(120, 80, () => grigio(0.4), FISSO)).ev!;
    expect(chiara - scura).toBeGreaterThan(1.8);
    expect(chiara - scura).toBeLessThan(2.2);
  });

  it('dominante calda (tungsteno) → luce < 4200 K, “calda”', () => {
    const r = analizzaPixel(immagine(120, 80, () => grigio(0.18, [1.45, 1, 0.45]), FISSO));
    expect(r.valida).toBe(true);
    expect(r.dominante).toBe('calda');
    expect(r.temperaturaK!).toBeLessThan(4200);
  });

  it('dominante verde → tinta verdastra (neon/LED)', () => {
    const r = analizzaPixel(immagine(120, 80, () => grigio(0.18, [0.92, 1.16, 0.92]), FISSO));
    expect(r.tinta?.etichetta).toBe('verdastra');
  });

  it('scena senza superfici neutre (solo erba) → colore non stimabile, nessun verdetto inventato', () => {
    const r = analizzaPixel(immagine(120, 80, () => grigio(0.18, [0.45, 1, 0.25]), FISSO));
    expect(r.valida).toBe(true);
    expect(r.temperaturaK).toBeNull();
    expect(r.tinta).toBeNull();
    expect(r.avvisi.join(' ')).toMatch(/punti neutri/);
    expect(r.ev).not.toBeNull(); // l'EV resta valido
  });

  it('luce mista: metà immagine calda, metà fredda', () => {
    const r = analizzaPixel(immagine(120, 80, (x) => (x < 60 ? grigio(0.18, [1.45, 1, 0.45]) : grigio(0.18, [0.7, 0.95, 1.3])), FISSO));
    expect(r.luceMista?.livello).toBe('si');
    expect(r.luceMista?.mista).toBe(true);
  });

  it('foto troppo scura → da rifare, nessun valore inventato', () => {
    const r = analizzaPixel(immagine(120, 80, () => grigio(0.002), FISSO));
    expect(r.valida).toBe(false);
    expect(r.problemi.join(' ')).toMatch(/scura/);
    expect(r.ev).toBeNull();
    expect(r.temperaturaK).toBeNull();
  });

  it('foto bruciata → da rifare', () => {
    const r = analizzaPixel(immagine(120, 80, () => [255, 255, 255], FISSO));
    expect(r.valida).toBe(false);
    expect(r.problemi.join(' ')).toMatch(/chiara/);
  });

  it('foto mossa (nessun dettaglio) → da rifare', () => {
    const w = 120, h = 80, pixels = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) { const v = 80 + Math.round(60 * (i % w) / w); pixels.set([v, v, v, 255], 4 * i); }
    const r = analizzaPixel({ pixels, width: w, height: h, exif: FISSO, origine: 'camera-jpeg' });
    expect(r.valida).toBe(false);
    expect(r.problemi.join(' ')).toMatch(/mossa/);
  });

  it('senza EXIF assume le impostazioni fisse e lo dice', () => {
    const r = analizzaPixel(immagine(120, 80, () => grigio(0.18), {}));
    expect(r.impostazioni.daExif).toBe(false);
    expect(r.avvisi.join(' ')).toMatch(/EXIF assente/);
  });

  it('foto del telefono: colore poco affidabile, EV dall’EXIF', () => {
    const r = analizzaPixel(immagine(120, 80, () => grigio(0.18), { make: 'Apple', iso: 100, tempo: 1 / 60, diaframma: 1.8 }, 'telefono'));
    expect(r.affidabilitaColore).toBe('bassa');
    expect(r.impostazioni).toMatchObject({ iso: 100, diaframma: 1.8, daExif: true });
    expect(r.ev!).toBeGreaterThan(5);
    expect(r.avvisi.join(' ')).toMatch(/telefono/);
  });

  it('avvisa se la foto non ha le impostazioni fisse', () => {
    const r = analizzaPixel(immagine(120, 80, () => grigio(0.18), { ...FISSO, iso: 3200 }));
    expect(r.avvisi.join(' ')).toMatch(/impostazioni fisse/);
  });

  it('misura la nitidezza: più dettaglio = valore più alto', () => {
    const a = new Float32Array(40 * 40).map((_, i) => (i % 2) * 100);
    const b = new Float32Array(40 * 40).fill(50);
    expect(nitidezzaLaplaciano(a, 40, 40)).toBeGreaterThan(nitidezzaLaplaciano(b, 40, 40));
  });

  it('campione reale (prato, ARW A7R V): valida, EV di giornata luminosa, luce non mista', () => {
    const f = JSON.parse(readFileSync(new URL('./fixtures/prato-64.json', import.meta.url), 'utf8')) as { width: number; height: number; rgb: number[] };
    const px = new Uint8ClampedArray(f.width * f.height * 4);
    for (let i = 0; i < f.width * f.height; i++) px.set([f.rgb[3 * i], f.rgb[3 * i + 1], f.rgb[3 * i + 2], 255], 4 * i);
    const r = analizzaPixel({ pixels: px, width: f.width, height: f.height, exif: { make: 'SONY', iso: 100, tempo: 0.0005, diaframma: 1.2, bilanciamento: 0 }, origine: 'camera-arw' });
    expect(r.valida, r.problemi.join(' ')).toBe(true);
    expect(r.ev!).toBeGreaterThan(9);
    expect(r.ev!).toBeLessThan(14);
    expect(r.avvisi.join(' ')).toMatch(/Auto/); // il campione ha il bilanciamento in Auto
    // L'erba non è una superficie neutra: niente verdetto sul colore (prima dava “verdastra, 4230 K”).
    expect(r.tinta?.etichetta ?? 'neutra').not.toBe('verdastra');
  });
});
