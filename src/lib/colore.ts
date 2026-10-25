// Colore: da RGB (sRGB, 8 bit) a temperatura colore e tinta.
// Con il bilanciamento del bianco fisso a 5500K, un grigio sotto una luce di temperatura T
// appare con una dominante che dipende da T: la si misura e si risale alla luce della scena.

export const sRgbALineare = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
export const lineareASrgb = (v: number): number => {
  const x = Math.min(1, Math.max(0, v));
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
};

/** XYZ (D65) da sRGB lineare. */
export function xyz(r: number, g: number, b: number): [number, number, number] {
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    0.0193339 * r + 0.119192 * g + 0.9503041 * b,
  ];
}

/** Coordinate CIE 1960 (u, v) da XYZ. */
export function uv([X, Y, Z]: [number, number, number]): [number, number] {
  const d = X + 15 * Y + 3 * Z;
  return [(4 * X) / d, (6 * Y) / d];
}

/** Locus di Planck in (u, v), approssimazione di Krystek (1000–15000 K). */
export function planckUV(T: number): [number, number] {
  const u = (0.860117757 + 1.54118254e-4 * T + 1.28641212e-7 * T * T) / (1 + 8.42420235e-4 * T + 7.08145163e-7 * T * T);
  const v = (0.317398726 + 4.22806245e-5 * T + 4.20481691e-8 * T * T) / (1 - 2.89741816e-5 * T + 1.61456053e-7 * T * T);
  return [u, v];
}

export interface Cromaticita {
  /** Temperatura colore correlata apparente (K), come appare nell'immagine. */
  cctApparente: number;
  /** Distanza dal locus di Planck: + = verdastro, − = magenta. */
  duv: number;
}

/** CCT apparente e Duv di un colore (RGB lineare). */
export function cromaticita(r: number, g: number, b: number): Cromaticita {
  const [u, v] = uv(xyz(r, g, b));
  let best = 1000, bestD = Infinity;
  for (let T = 1000; T <= 15000; T += T < 4000 ? 10 : 25) {
    const [pu, pv] = planckUV(T);
    const d = (u - pu) ** 2 + (v - pv) ** 2;
    if (d < bestD) { bestD = d; best = T; }
  }
  const [pu, pv] = planckUV(best);
  const duv = Math.sign(v - pv) * Math.sqrt((u - pu) ** 2 + (v - pv) ** 2);
  return { cctApparente: best, duv };
}

/**
 * Duv approssimato di un pixel (RGB lineare): CCT con la formula di McCamy, poi distanza dal locus.
 * Veloce, serve solo a scegliere i punti “neutri”; la stima finale usa `cromaticita`.
 */
export function duvApprossimato(r: number, g: number, b: number): number {
  const [X, Y, Z] = xyz(r, g, b);
  const s = X + Y + Z;
  if (s <= 0) return Infinity;
  const x = X / s, y = Y / s;
  const n = (x - 0.332) / (0.1858 - y);
  const T = Math.min(15000, Math.max(1500, 449 * n ** 3 + 3525 * n ** 2 + 6823.3 * n + 5520.33));
  const [u, v] = uv([X, Y, Z]);
  const [pu, pv] = planckUV(T);
  return Math.sign(v - pv) * Math.hypot(u - pu, v - pv);
}

export const mired = (k: number): number => 1e6 / k;
const MIRED_D65 = mired(6504); // il “neutro” di sRGB

/**
 * Temperatura colore della luce della scena a partire dall'apparente.
 * Con bilanciamento a `kelvinWb` il grigio sotto una luce a kelvinWb appare neutro (D65 in sRGB);
 * gli scostamenti si sommano in mired.
 */
export function cctScena(cctApparente: number, kelvinWb = 5500): number {
  const m = mired(kelvinWb) + (mired(cctApparente) - MIRED_D65);
  return Math.round(1e6 / Math.max(m, 40));
}

/** Differenza in mired tra due temperature colore apparenti (per la luce mista). */
export const differenzaMired = (kA: number, kB: number): number => Math.abs(mired(kA) - mired(kB));
