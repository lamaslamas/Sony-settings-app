// Calcolo dell'EV (esposizione) della scena.

/** Impostazioni fisse della foto di prova (vedi Home). */
export const FISSE = { iso: 800, tempo: 1 / 50, diaframma: 4, kelvin: 5500 } as const;

/** Riflettanza media assunta per la scena: una scena “media” viene resa a ~18% di grigio. È la taratura dell'EV. */
export const RIFLESSIONE_MEDIA = 0.18;

/** EV a ISO 100 delle impostazioni usate: log2(N²/t) − log2(ISO/100). */
export function ev100Impostazioni(diaframma: number, tempo: number, iso: number): number {
  return Math.log2((diaframma * diaframma) / tempo) - Math.log2(iso / 100);
}

/**
 * EV a ISO 100 della scena. Se l'immagine (luminanza lineare media, 0–1) è più chiara del
 * grigio medio, la scena è più luminosa di quanto le impostazioni “vedono”, e viceversa.
 */
export function evScena(ev100Imp: number, luminanzaLineareMedia: number): number {
  return ev100Imp + Math.log2(Math.max(luminanzaLineareMedia, 1e-4) / RIFLESSIONE_MEDIA);
}

export type LivelloEv = { max: number; testo: string };
const LIVELLI: LivelloEv[] = [
  { max: 4, testo: 'Molto scura' },
  { max: 7, testo: 'Interno poco illuminato' },
  { max: 10, testo: 'Interno illuminato / ombra' },
  { max: 13, testo: 'Esterno luminoso' },
  { max: Infinity, testo: 'Pieno sole' },
];
export const descriviEv = (ev: number): string => LIVELLI.find((l) => ev < l.max)!.testo;

// ---- Serie standard di ISO e diaframmi (terzi di stop) e legge di esposizione ----

export const SERIE_ISO = [100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800, 16000, 20000, 25600, 32000];
export const SERIE_F = [1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22];

/** ISO necessario per esporre una scena di EV100 `ev` con diaframma N e tempo t (secondi). */
export const isoNecessario = (ev: number, N: number, t: number): number => (100 * N * N) / (t * 2 ** ev);

const piuVicino = (serie: number[], x: number): number =>
  serie.reduce((best, v) => (Math.abs(Math.log(v / x)) < Math.abs(Math.log(best / x)) ? v : best));
export const isoPiuVicino = (iso: number): number => piuVicino(SERIE_ISO, iso);
export const fPiuVicino = (f: number): number => piuVicino(SERIE_F, f);
/** Diaframma successivo, più chiuso, di un terzo di stop. */
export const fPiuChiuso = (f: number): number => SERIE_F.find((v) => v > fPiuVicino(f) + 0.01) ?? SERIE_F[SERIE_F.length - 1];

export const formattaF = (f: number): string => `F${Number.isInteger(f) ? f : f}`;
export const formattaTempo = (denominatore: number): string => `1/${denominatore}`;
