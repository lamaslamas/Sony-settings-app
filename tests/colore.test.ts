import { describe, expect, it } from 'vitest';
import { cctScena, cromaticita, lineareASrgb, planckUV, sRgbALineare, xyz } from '../src/lib/colore';

/** Colore (sRGB lineare, normalizzato) di un corpo nero a temperatura T, con Duv aggiunto in v. */
function rgbDaPlanck(T: number, dv = 0): [number, number, number] {
  const [u, v0] = planckUV(T);
  const v = v0 + dv, Y = 1;
  // CIE 1960 (u, v) → XYZ con Y = 1, poi XYZ → sRGB lineare
  const X = (1.5 * u * Y) / v, Z = (Y * (4 - u - 10 * v)) / (2 * v);
  const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z;
  const b = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
  const m = Math.max(r, g, b);
  return [r / m, g / m, b / m];
}

describe('stima temperatura colore', () => {
  it('conversione sRGB ⇄ lineare', () => {
    expect(sRgbALineare(255)).toBeCloseTo(1);
    expect(sRgbALineare(0)).toBe(0);
    expect(lineareASrgb(sRgbALineare(128))).toBeCloseTo(128, 0);
  });

  it('bianco sRGB → ~6500 K, Duv ≈ 0', () => {
    const c = cromaticita(1, 1, 1);
    expect(c.cctApparente).toBeGreaterThan(6400);
    expect(c.cctApparente).toBeLessThan(6600);
    expect(Math.abs(c.duv)).toBeLessThan(0.004);
  });

  it('ritrova la CCT di un corpo nero (2800–9000 K)', () => {
    for (const T of [2800, 3200, 4000, 5000, 6500, 9000]) {
      const [r, g, b] = rgbDaPlanck(T);
      expect(Math.abs(cromaticita(r, g, b).cctApparente - T) / T).toBeLessThan(0.03);
    }
  });

  it('grigio neutro con bilanciamento 5500 K → luce a 5500 K', () => {
    const c = cromaticita(1, 1, 1);
    expect(Math.abs(cctScena(c.cctApparente, 5500) - 5500)).toBeLessThan(150);
  });

  it('dominante calda con WB 5500 K → luce più calda di 5500 K (tungsteno ≈ 3000 K)', () => {
    // sotto una luce a 3000 K, con WB 5500 K il grigio appare come un corpo nero a ~3300 K
    const [r, g, b] = rgbDaPlanck(3300);
    const k = cctScena(cromaticita(r, g, b).cctApparente, 5500);
    expect(k).toBeGreaterThan(2800);
    expect(k).toBeLessThan(3300);
  });

  it('dominante fredda → luce più fredda di 5500 K', () => {
    const [r, g, b] = rgbDaPlanck(9000);
    expect(cctScena(cromaticita(r, g, b).cctApparente, 5500)).toBeGreaterThan(6500);
  });

  it('tinta: verde → Duv positivo, magenta → negativo', () => {
    const [r, g, b] = rgbDaPlanck(4500, 0.02);
    expect(cromaticita(r, g, b).duv).toBeGreaterThan(0.012);
    const [r2, g2, b2] = rgbDaPlanck(4500, -0.02);
    expect(cromaticita(r2, g2, b2).duv).toBeLessThan(-0.012);
  });

  it('xyz del bianco ha Y = 1', () => expect(xyz(1, 1, 1)[1]).toBeCloseTo(1, 3));
});
