// Regole fisse (src/data/situazioni.json → "regole"): rete di sicurezza applicata DOPO il calcolo.
// Un valore che le viola viene corretto o scartato, e si registra perché.
import type { Regola } from '../types';

/** Valori controllati dalle regole (tutti facoltativi: si controlla solo ciò che c'è). */
export interface Valori {
  shutterDenominator?: number;
  isoAuto?: boolean;
  iso?: number;
  isoAutoMax?: number;
  whiteBalance?: string;
  steadyShot?: string;
  frameRate?: string;
  pictureProfile?: string;
  apertureF?: number;
  shutterType?: string;
  afIlluminator?: string;
  subjectRecogInAF?: string;
}

/** Condizioni che le regole possono richiedere (“quando”). */
export interface Contesto {
  senzaND?: boolean;
  troppaLuce?: boolean;
  luciArtificiali?: boolean;
  soggetto?: 'fermo' | 'volo' | 'corsa';
}

export interface Correzione {
  regolaId: string;
  campo: string;
  da: unknown;
  /** Nuovo valore; null = scartato. */
  a: unknown | null;
  tipo: 'corretto' | 'scartato';
  messaggio: string;
}

export interface EsitoRegole {
  valori: Valori;
  correzioni: Correzione[];
  /** Indicazioni da regole “imponi” che il calcolo deve completare (es. diaframma più chiuso). */
  imposizioni: { apertura?: 'piuChiusa' };
}

/** Valore sostitutivo quando un valore “vietato” (notEquals) va cambiato. */
const ALTERNATIVE: Partial<Record<keyof Valori, unknown>> = { whiteBalance: 'Custom 1' };

const piuVicino = (valori: number[], x: number) =>
  valori.reduce((b, v) => (Math.abs(Math.log(v / x)) < Math.abs(Math.log(b / x)) ? v : b));

function soddisfatto(quando: Record<string, unknown> | undefined, ctx: Contesto): boolean {
  if (!quando) return true;
  return Object.entries(quando).every(([k, atteso]) => {
    const v = (ctx as Record<string, unknown>)[k];
    return Array.isArray(atteso) ? atteso.includes(v) : v === atteso;
  });
}

const CAMPI_DI_SISTEMA = new Set(['soloVociDelMenu', 'fotoDiProvaIllegibile', 'valoriModificabili', 'allowed']);

/** Applica le regole che valgono per i `tags` della situazione. Non modifica `valori` in ingresso. */
export function applicaRegole(regole: Regola[], tags: string[], valori: Valori, ctx: Contesto = {}): EsitoRegole {
  const v: Valori = { ...valori };
  const correzioni: Correzione[] = [];
  const imposizioni: EsitoRegole['imposizioni'] = {};
  const segna = (r: Regola, campo: keyof Valori, da: unknown, a: unknown | null) => {
    correzioni.push({ regolaId: r.id, campo, da, a, tipo: a === null ? 'scartato' : 'corretto', messaggio: r.messaggio });
  };

  for (const r of regole) {
    if (!r.tags.includes('*') && !r.tags.some((t) => tags.includes(t))) continue;
    if (!soddisfatto(r.quando, ctx)) continue;

    // Regola “imponi”: piano B (es. senza ND con troppa luce → 1/100 + diaframma più chiuso)
    if (r.imponi) {
      for (const [k, val] of Object.entries(r.imponi)) {
        if (k === 'apertura') { imposizioni.apertura = 'piuChiusa'; continue; }
        const campo = k as keyof Valori;
        if (v[campo] !== val) { segna(r, campo, v[campo], val); (v as Record<string, unknown>)[campo] = val; }
      }
      if (imposizioni.apertura && !correzioni.some((c) => c.regolaId === r.id)) segna(r, 'apertureF', v.apertureF, 'più chiuso');
      continue;
    }

    if (!r.campo || !r.op || CAMPI_DI_SISTEMA.has(r.op)) continue;
    const campo = r.campo as keyof Valori;
    const x = v[campo];
    if (x === undefined) continue; // niente da controllare
    const set = (nuovo: unknown | null) => {
      segna(r, campo, x, nuovo);
      if (nuovo === null) delete v[campo]; else (v as Record<string, unknown>)[campo] = nuovo;
    };

    switch (r.op) {
      case 'oneOf': {
        const ammessi = (r.valori ?? []) as number[];
        if (typeof x === 'number' && !ammessi.includes(x)) set(piuVicino(ammessi, x));
        break;
      }
      case 'equals':
        if (x !== r.valore) set(r.valore);
        break;
      case 'notEquals':
        if (x === r.valore) set(ALTERNATIVE[campo] ?? null);
        break;
      case 'min':
        if (typeof x === 'number' && x < (r.valore as number)) set(r.valore);
        break;
      case 'max':
        if (typeof x === 'number' && x > (r.valore as number)) set(r.valore);
        break;
      case 'between': {
        const [lo, hi] = r.valori as number[];
        if (typeof x === 'number' && (x < lo || x > hi)) set(Math.min(hi, Math.max(lo, x)));
        break;
      }
    }
  }
  return { valori: v, correzioni, imposizioni };
}
