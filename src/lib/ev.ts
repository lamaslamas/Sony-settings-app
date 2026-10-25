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
