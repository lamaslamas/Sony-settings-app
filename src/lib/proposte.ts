// Dalla lettura della luce e dalla situazione ai valori proposti; poi le regole fisse.
// Funzione pura: nessun accesso al browser, testabile.
import type { BaseFile, Diff, Regola, Situazione } from '../types';
import type { LetturaLuce } from './analisi';
import { applicaRegole, type Contesto, type Correzione, type Valori } from './regole';
import { fPiuChiuso, fPiuVicino, formattaF, formattaTempo, isoNecessario, isoPiuVicino } from './ev';

export interface Scelte {
  /** Hai un filtro ND variabile? */
  nd: boolean;
  /** Soggetto fermo / in volo / in corsa (wildlife). */
  soggetto: 'fermo' | 'volo' | 'corsa';
  /** Luci artificiali: sì/no (suggerito dalla foto di prova). */
  luciArtificiali: boolean;
  /** Diaframma più aperto dell'obiettivo montato (null = non noto). */
  diaframmaMax: number | null;
}

export const SCELTE_INIZIALI: Scelte = { nd: false, soggetto: 'fermo', luciArtificiali: false, diaframmaMax: null };

export interface PropostaDiff {
  /** Valore da mostrare (modificato dall'utente, calcolato o quello fisso della situazione). */
  valore: string;
  origine: 'utente' | 'calcolato' | 'fisso';
  /** Spiegazioni: cosa ha corretto una regola (proposta) o quale regola viola il valore dell'utente. */
  correzioni: Correzione[];
}

export interface Proposte {
  perDiff: Record<string, PropostaDiff>;
  /** Frasi di spiegazione generali (piano B, ND, sottoesposizione…). */
  note: string[];
  /** Cosa succede all'esposizione con i valori scelti. */
  previsione: string[];
  /** La foto di prova non è usabile: l'app non indovina. */
  daRifare: boolean;
}

// ---- Lettura dei valori testuali dei diff ----

/** Valori controllati dalle regole, ricavati dalle voci della base. */
export function valoriDaBase(base: BaseFile): Valori {
  const v: Valori = {};
  for (const e of base.entries) {
    switch (e.item) {
      case 'SteadyShot': v.steadyShot = e.value; break;
      case 'Picture Profile': v.pictureProfile = e.value; break;
      case 'White Balance': v.whiteBalance = e.value; break;
      case 'Shutter Type': v.shutterType = e.value; break;
      case 'Subject Recog in AF': v.subjectRecogInAF = e.value; break;
      case 'Movie Settings': if (e.sub === 'Rec Frame Rate') v.frameRate = e.value; break;
      case 'ISO':
        if (/auto/i.test(e.value)) v.isoAuto = true; else { v.isoAuto = false; v.iso = parseInt(e.value, 10) || undefined; }
        break;
      case 'ISO Range Limit': if (e.sub === 'Maximum') v.isoAutoMax = parseInt(e.value, 10); break;
    }
  }
  return v;
}

/** Interpreta il testo di un diff secondo il suo `campo`. */
export function valoreDaTesto(campo: NonNullable<Diff['campo']>, testo: string, diaframmaMax: number | null): Valori {
  const t = testo.trim();
  switch (campo) {
    case 'tempo': { const m = /^1\/(\d+)/.exec(t); return m ? { shutterDenominator: +m[1] } : {}; }
    case 'diaframma': {
      if (/tutta apertura/i.test(t)) return diaframmaMax ? { apertureF: diaframmaMax } : {};
      const m = /^F?(\d+(?:\.\d+)?)$/i.exec(t); return m ? { apertureF: +m[1] } : {};
    }
    case 'iso':
      if (/auto/i.test(t)) return { isoAuto: true };
      return /^\d+$/.test(t) ? { isoAuto: false, iso: +t } : /manuale/i.test(t) ? { isoAuto: false } : {};
    case 'isoMax': return /^\d+$/.test(t) ? { isoAutoMax: +t } : {};
    case 'wb': return { whiteBalance: t };
    case 'steadyShot': return { steadyShot: t };
    case 'afIlluminator': return { afIlluminator: t };
    case 'subjectRecog': return { subjectRecogInAF: t };
  }
}

/** Contrario di valoreDaTesto: come scrivere un valore calcolato. */
function testoDaValore(campo: NonNullable<Diff['campo']>, v: Valori): string | undefined {
  switch (campo) {
    case 'tempo': return v.shutterDenominator ? formattaTempo(v.shutterDenominator) : undefined;
    case 'diaframma': return v.apertureF ? formattaF(v.apertureF) : undefined;
    case 'iso': return v.isoAuto ? 'ISO AUTO' : v.iso ? String(v.iso) : undefined;
    case 'isoMax': return v.isoAutoMax ? String(v.isoAutoMax) : undefined;
    case 'wb': return v.whiteBalance;
    case 'steadyShot': return v.steadyShot;
    case 'afIlluminator': return v.afIlluminator;
    case 'subjectRecog': return v.subjectRecogInAF;
  }
}

const CAMPO_VALORE: Record<NonNullable<Diff['campo']>, (keyof Valori)[]> = {
  tempo: ['shutterDenominator'], diaframma: ['apertureF'], iso: ['isoAuto', 'iso'], isoMax: ['isoAutoMax'],
  wb: ['whiteBalance'], steadyShot: ['steadyShot'], afIlluminator: ['afIlluminator'], subjectRecog: ['subjectRecogInAF'],
};

function campoDiRegola(campo: string): NonNullable<Diff['campo']> | undefined {
  return (Object.entries(CAMPO_VALORE).find(([, ks]) => ks.includes(campo as keyof Valori))?.[0]) as NonNullable<Diff['campo']> | undefined;
}

// ---- Calcolo dell'esposizione ----

const ISO_MIN = 100;
const ISO_MAX = 12800; // limite della base

interface Esp { N: number; t: number; iso: number; note: string[]; sotto?: number }

/**
 * Video a ISO fisso (interviste): diaframma preferito (non più aperto dell'obiettivo), tempo 1/50.
 * Con troppa luce: senza ND piano B (1/100 + diaframma più chiuso, dalle regole); con ND si indica di quanto.
 */
function esposizioneIsoFisso(ev: number, s: Situazione, sc: Scelte, denom: number, chiudi: boolean): Esp {
  const note: string[] = [];
  let N = fPiuVicino(Math.max(s.strategia?.diaframmaPreferito ?? 2.8, sc.diaframmaMax ?? 0));
  const t = 1 / denom;
  let iso = isoNecessario(ev, N, t);
  if (chiudi) {
    while (iso < ISO_MIN && N < 16) { N = fPiuChiuso(N); iso = isoNecessario(ev, N, t); }
  }
  if (iso < ISO_MIN) {
    const stop = Math.log2(ISO_MIN / iso);
    note.push(sc.nd ? `Troppa luce: con il filtro ND variabile togli circa ${stop.toFixed(1)} stop e tieni 1/50.` : `Anche così c'è ancora troppa luce (circa ${stop.toFixed(1)} stop): cerca l'ombra o usa un filtro ND.`);
    return { N, t, iso: ISO_MIN, note };
  }
  if (iso > ISO_MAX) {
    const sotto = Math.log2(iso / ISO_MAX);
    note.push(`Poca luce: servirebbe ISO ${Math.round(iso)}, oltre il limite di ${ISO_MAX}. Resta sottoesposto di circa ${sotto.toFixed(1)} stop: aggiungi luce o apri il diaframma.`);
    return { N, t, iso: ISO_MAX, note, sotto };
  }
  return { N, t, iso: isoPiuVicino(iso), note };
}

/** B-roll con ISO AUTO: tempo 1/50, diaframma tale che l'ISO “di riferimento” (800) sia quello giusto. */
function esposizioneBroll(ev: number, s: Situazione, sc: Scelte, denom: number): { N: number; t: number; note: string[] } {
  const note: string[] = [];
  const t = 1 / denom;
  const target = s.strategia?.isoTarget ?? 800;
  let N = Math.sqrt((t * 2 ** ev * target) / 100);
  N = fPiuVicino(Math.min(16, Math.max(N, sc.diaframmaMax ?? 1.2)));
  if (isoNecessario(ev, N, t) < ISO_MIN) note.push(sc.nd ? 'Troppa luce anche a diaframma chiuso: usa il filtro ND variabile.' : 'Troppa luce anche a diaframma chiuso: passa a 1/100, cerca l\'ombra o usa un filtro ND.');
  return { N, t, note };
}

// ---- Funzione principale ----

export function proponi(input: {
  s: Situazione;
  base: BaseFile;
  regole: Regola[];
  lettura: LetturaLuce | null;
  scelte: Scelte;
  /** Valori modificati a mano: diffId → testo. */
  modificati: Record<string, string>;
}): Proposte {
  const { s, base, regole, lettura, scelte: sc, modificati } = input;
  const note: string[] = [];
  const previsione: string[] = [];
  const daRifare = !!lettura && !lettura.valida;
  const usaLettura = !!lettura && lettura.valida && lettura.ev !== null;

  const ctx: Contesto = { senzaND: !sc.nd, luciArtificiali: sc.luciArtificiali, soggetto: sc.soggetto };

  // 1) Valori fissi: base + diff della situazione (senza le modifiche dell'utente)
  const valori: Valori = { ...valoriDaBase(base) };
  const testo: Record<string, string> = {};
  const calcolati = new Set<string>();
  for (const d of s.diff) {
    testo[d.id] = d.value;
    if (d.campo) Object.assign(valori, valoreDaTesto(d.campo, d.value, sc.diaframmaMax));
  }
  const diffDi = (campo: NonNullable<Diff['campo']>) => s.diff.find((d) => d.campo === campo);

  // 2) Valori calcolati dalla foto di prova
  let sottoesposizione: number | undefined;
  const correzioniPianoB: Correzione[] = [];
  if (usaLettura && s.strategia) {
    const ev = lettura!.ev!;
    if (s.strategia.modo === 'isoFisso') {
      // Prima proposta a 1/50; se c'è troppa luce le regole decidono il piano B (1/100 + diaframma più chiuso)
      let e = esposizioneIsoFisso(ev, s, sc, valori.shutterDenominator ?? 50, false);
      const troppaLuce = isoNecessario(ev, e.N, e.t) < ISO_MIN;
      const dopo = applicaRegole(regole, s.tags, { ...valori, shutterDenominator: valori.shutterDenominator ?? 50 }, { ...ctx, troppaLuce });
      if (dopo.imposizioni.apertura) {
        correzioniPianoB.push(...dopo.correzioni.filter((c) => c.regolaId === 'int-piano-b-nd'));
        e = esposizioneIsoFisso(ev, s, sc, dopo.valori.shutterDenominator ?? 100, true);
        valori.shutterDenominator = dopo.valori.shutterDenominator ?? 100;
      }
      valori.apertureF = e.N; valori.isoAuto = false; valori.iso = e.iso;
      note.push(...e.note);
      sottoesposizione = e.sotto;
      ['iso', 'diaframma', 'tempo'].forEach((c) => { const d = diffDi(c as never); if (d?.dynamic) calcolati.add(d.id); });
    } else if (s.strategia.modo === 'isoAuto' && s.strategia.isoTarget) {
      const e = esposizioneBroll(ev, s, sc, valori.shutterDenominator ?? 50);
      valori.apertureF = e.N;
      note.push(...e.note);
      ['diaframma', 'tempo'].forEach((c) => { const d = diffDi(c as never); if (d?.dynamic) calcolati.add(d.id); });
    }
  }

  // 3) Regole fisse sulle proposte: corregge o scarta, e spiega
  const esito = applicaRegole(regole, s.tags, valori, { ...ctx, troppaLuce: ctx.troppaLuce });
  const correzioniPerDiff: Record<string, Correzione[]> = {};
  for (const c of [...correzioniPianoB, ...esito.correzioni]) {
    const campo = campoDiRegola(c.campo);
    const d = campo && diffDi(campo);
    if (d) (correzioniPerDiff[d.id] ??= []).push(c);
    else if (!note.includes(c.messaggio)) note.push(c.messaggio);
  }
  const finale = esito.valori;

  // 4) Testo finale dei diff: calcolato/corretto → riscritto; altrimenti valore fisso
  const perDiff: Record<string, PropostaDiff> = {};
  for (const d of s.diff) {
    let valore = d.value, origine: PropostaDiff['origine'] = 'fisso';
    if (d.campo) {
      const nuovo = testoDaValore(d.campo, finale);
      const corretto = !!correzioniPerDiff[d.id];
      if (nuovo && (calcolati.has(d.id) || corretto)) { valore = nuovo; origine = 'calcolato'; }
      else if (!nuovo && corretto) { valore = '—'; }
    }
    perDiff[d.id] = { valore, origine, correzioni: correzioniPerDiff[d.id] ?? [] };
  }

  // 5) Valori modificati a mano: restano, ma si segnala se violano una regola
  const effettivi: Valori = { ...finale };
  for (const [id, t] of Object.entries(modificati)) {
    const d = s.diff.find((x) => x.id === id);
    if (!d?.campo) { if (d) perDiff[id] = { valore: t, origine: 'utente', correzioni: [] }; continue; }
    Object.assign(effettivi, valoreDaTesto(d.campo, t, sc.diaframmaMax));
  }
  const violazioni = applicaRegole(regole, s.tags, effettivi, { ...ctx }).correzioni;
  for (const [id, t] of Object.entries(modificati)) {
    const d = s.diff.find((x) => x.id === id);
    if (!d) continue;
    const mie = d.campo ? violazioni.filter((c) => campoDiRegola(c.campo) === d.campo) : [];
    perDiff[id] = { valore: t, origine: 'utente', correzioni: mie };
  }

  // 6) Previsione dell'esposizione con i valori effettivi (utile soprattutto per le foto in M con ISO AUTO)
  if (usaLettura && effettivi.shutterDenominator && effettivi.apertureF && effettivi.isoAuto) {
    const iso = isoNecessario(lettura!.ev!, effettivi.apertureF, 1 / effettivi.shutterDenominator);
    const max = effettivi.isoAutoMax ?? ISO_MAX;
    if (iso < ISO_MIN) previsione.push(`Con questa luce c'è troppa luce: anche a ISO 100 sovraespone di circa ${Math.log2(ISO_MIN / iso).toFixed(1)} stop. Chiudi il diaframma o usa un tempo più veloce.`);
    else if (iso > max) previsione.push(`ISO atteso circa ${Math.round(iso)}, oltre il limite ${max}: sottoesposizione di circa ${Math.log2(iso / max).toFixed(1)} stop. Si recupera in post, oppure apri il diaframma/aggiungi luce.`);
    else previsione.push(`ISO atteso circa ${isoPiuVicino(iso)} (limite ${max}).`);
  }
  if (sottoesposizione) previsione.push(`Sottoesposizione prevista: ${sottoesposizione.toFixed(1)} stop.`);

  return { perDiff, note, previsione, daRifare };
}
