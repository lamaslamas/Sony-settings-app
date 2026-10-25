// Analisi locale della foto di prova: dai pixel e dall'EXIF a EV, temperatura colore, tinta, luce mista.
// Funzioni pure (niente browser): si testano con dati sintetici. La lettura dei file è in foto.ts.
import { FISSE, descriviEv, ev100Impostazioni, evScena } from './ev';
import { cctScena, cromaticita, differenzaMired, duvApprossimato, sRgbALineare } from './colore';

/** Dati di scatto letti dall'EXIF (tutti facoltativi). */
export interface ExifLite {
  make?: string;
  model?: string;
  iso?: number;
  tempo?: number;       // secondi
  diaframma?: number;
  /** EXIF WhiteBalance: 0 = auto, 1 = manuale. */
  bilanciamento?: number;
}

export interface FotoInput {
  /** Pixel RGBA (come ImageData), già ridimensionati. */
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  exif: ExifLite;
  origine: 'camera-arw' | 'camera-jpeg' | 'telefono';
}

export interface LetturaLuce {
  /** false = foto da rifare: l'app non indovina. */
  valida: boolean;
  problemi: string[];
  avvisi: string[];
  ev: number | null;
  evDescrizione: string | null;
  temperaturaK: number | null;
  dominante: 'calda' | 'neutra' | 'fredda' | null;
  tinta: { duv: number; etichetta: 'neutra' | 'verdastra' | 'magenta' } | null;
  /** livello: no / incerta / si. Il confronto tra zone è approssimato (superfici colorate lo falsano). */
  luceMista: { mista: boolean; livello: 'no' | 'incerta' | 'si'; scostoMired: number } | null;
  affidabilitaColore: 'alta' | 'bassa';
  origine: FotoInput['origine'];
  /** Impostazioni usate per il calcolo dell'EV e se vengono dall'EXIF. */
  impostazioni: { iso: number; tempo: number; diaframma: number; daExif: boolean };
  /** Istogramma della luminanza in 16 fasce. */
  istogramma: number[];
}

/** Funzione con la stessa forma del calcolo locale: in futuro se ne potrà aggiungere una AI. */
export type Analizzatore = (foto: FotoInput) => Promise<LetturaLuce> | LetturaLuce;

// Soglie (tarabili)
export const SOGLIE = {
  scuraP99: 55,        // luma 8 bit del 99° percentile: sotto = troppo scura
  chiaraBruciata: 0.25, // quota di pixel ≥ 250: sopra = troppo chiara
  nitidezza: 40,       // varianza del laplaciano (640 px di larghezza): sotto = mossa/fuori fuoco
  quotaChiari: 0.25,   // frazione dei punti neutri (i più chiari) usata per stimare il bianco
  mistaIncerta: 80,    // scarto tra zone (mired) da cui la luce mista è “incerta”
  mistaSi: 140,        // scarto oltre il quale la luce è “mista”. Soglie alte: legno e parquet falsano il confronto tra zone
  tintaSoglia: 0.012,
  neutroDuv: 0.02,     // un punto è “neutro” se sta entro questo Duv dal locus di Planck (esclude erba, legno, ecc.)
  neutroLumaMin: 50,   // sotto questa luma (8 bit) un punto è troppo scuro per dare un colore affidabile
  neutriMinimi: 0.1,   // quota minima dell'immagine fatta di punti neutri per stimare il colore
  neutriMinimiZona: 0.1,
  tessere: [4, 3] as const, // griglia per il confronto tra zone
};

const luma8 = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Varianza del laplaciano su una griglia di luma: misura di nitidezza. */
export function nitidezzaLaplaciano(luma: Float32Array, w: number, h: number): number {
  let n = 0, s = 0, s2 = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const l = -4 * luma[i] + luma[i - 1] + luma[i + 1] + luma[i - w] + luma[i + w];
    n++; s += l; s2 += l * l;
  }
  const m = s / n;
  return s2 / n - m * m;
}

/**
 * Stima del bianco della scena: punti “neutri” (vicini al locus di Planck, non bruciati), di cui si tiene
 * il quarto più chiaro (pareti, carta, cartoncino: i materiali scuri come parquet o legno sono arancioni di
 * per sé e ingannerebbero la stima). I colori saturi (erba, vestiti) sono scartati dal filtro sul Duv.
 * `n` = quanti punti neutri ci sono nella zona: serve a decidere se la stima è affidabile.
 */
function biancoStimato(px: Uint8ClampedArray, idx: number[]) {
  const cand: { l: number; r: number; g: number; b: number }[] = [];
  for (const i of idx) {
    const R = px[4 * i], G = px[4 * i + 1], B = px[4 * i + 2];
    const l = luma8(R, G, B);
    if (l < SOGLIE.neutroLumaMin || l > 235 || Math.max(R, G, B) > 245) continue;
    const r = sRgbALineare(R), g = sRgbALineare(G), b = sRgbALineare(B);
    if (Math.abs(duvApprossimato(r, g, b)) > SOGLIE.neutroDuv) continue;
    cand.push({ l, r, g, b });
  }
  if (!cand.length) return null;
  // Si tiene il quarto più chiaro dei punti neutri (stile “white patch”).
  cand.sort((p, q) => q.l - p.l);
  const top = cand.slice(0, Math.max(1, Math.floor(cand.length * SOGLIE.quotaChiari)));
  let r = 0, g = 0, b = 0;
  for (const c of top) { r += c.r; g += c.g; b += c.b; }
  return { r: r / top.length, g: g / top.length, b: b / top.length, n: cand.length };
}

export function analizzaPixel(foto: FotoInput): LetturaLuce {
  const { pixels, width: w, height: h, exif, origine } = foto;
  const N = w * h;
  const problemi: string[] = [];
  const avvisi: string[] = [];

  // Luma, istogramma, luminanza lineare (media geometrica), quota bruciata
  const luma = new Float32Array(N);
  const istogramma = new Array<number>(16).fill(0);
  let logSum = 0, bruciati = 0;
  for (let i = 0; i < N; i++) {
    const R = pixels[4 * i], G = pixels[4 * i + 1], B = pixels[4 * i + 2];
    const l = luma8(R, G, B);
    luma[i] = l;
    istogramma[Math.min(15, l >> 4)]++;
    if (Math.max(R, G, B) >= 250) bruciati++;
    const yLin = 0.2126 * sRgbALineare(R) + 0.7152 * sRgbALineare(G) + 0.0722 * sRgbALineare(B);
    logSum += Math.log(Math.max(yLin, 0.002));
  }
  const yGeo = Math.exp(logSum / N);
  const ordinata = Float32Array.from(luma).sort();
  const p99 = ordinata[Math.floor(0.99 * (N - 1))];

  if (p99 < SOGLIE.scuraP99) problemi.push('Foto troppo scura: rifalla con più luce o controlla le impostazioni.');
  if (bruciati / N > SOGLIE.chiaraBruciata) problemi.push('Foto troppo chiara (alte luci bruciate): rifalla.');
  if (nitidezzaLaplaciano(luma, w, h) < SOGLIE.nitidezza) problemi.push('Foto mossa o fuori fuoco: rifalla tenendo ferma la fotocamera.');

  // Impostazioni usate per l'EV: dall'EXIF se complete, altrimenti le fisse
  const completo = !!(exif.iso && exif.tempo && exif.diaframma);
  const imp = completo
    ? { iso: exif.iso!, tempo: exif.tempo!, diaframma: exif.diaframma!, daExif: true }
    : { iso: FISSE.iso, tempo: FISSE.tempo, diaframma: FISSE.diaframma, daExif: false };
  if (!completo) avvisi.push('EXIF assente o incompleto: assumo le impostazioni fisse (ISO 800, 1/50, F4).');
  else if (origine !== 'telefono' && (imp.iso !== FISSE.iso || Math.abs(imp.tempo - FISSE.tempo) > 0.004 || imp.diaframma !== FISSE.diaframma)) {
    avvisi.push(`La foto non è stata scattata con le impostazioni fisse (ISO ${imp.iso}, 1/${Math.round(1 / imp.tempo)}, F${imp.diaframma}): l'EV usa i valori reali.`);
  }

  const affidabilitaColore: 'alta' | 'bassa' = origine === 'telefono' ? 'bassa' : 'alta';
  if (origine === 'telefono') avvisi.push('Foto del telefono: il colore è meno affidabile (bilanciamento automatico). L\'EV usa l\'esposizione automatica dell\'EXIF.');
  else if (exif.bilanciamento === 0) avvisi.push('Il bilanciamento del bianco risulta Auto: per la stima del colore va fissato a 5500K.');

  // Bianco stimato → temperatura colore e tinta
  const tutti = Array.from({ length: N }, (_, i) => i);
  const bianco = biancoStimato(pixels, tutti);
  let temperaturaK: number | null = null, dominante: LetturaLuce['dominante'] = null, tinta: LetturaLuce['tinta'] = null;
  if (bianco && bianco.n > N * SOGLIE.neutriMinimi) {
    const c = cromaticita(bianco.r, bianco.g, bianco.b);
    temperaturaK = cctScena(c.cctApparente, FISSE.kelvin);
    dominante = temperaturaK < 4200 ? 'calda' : temperaturaK > 6000 ? 'fredda' : 'neutra';
    tinta = { duv: c.duv, etichetta: c.duv > SOGLIE.tintaSoglia ? 'verdastra' : c.duv < -SOGLIE.tintaSoglia ? 'magenta' : 'neutra' };
  } else {
    avvisi.push('Pochi punti neutri nell\'immagine (pareti chiare, cartoncino grigio): temperatura colore non stimabile. Rifai la foto inquadrando una superficie neutra.');
  }

  // Luce mista: confronto tra le zone dell'immagine
  let luceMista: LetturaLuce['luceMista'] = null;
  const [cols, righe] = SOGLIE.tessere;
  const kZone: number[] = []; // temperatura apparente di ogni zona con abbastanza punti neutri
  for (let ty = 0; ty < righe; ty++) for (let tx = 0; tx < cols; tx++) {
    const idx: number[] = [];
    for (let y = Math.floor((ty * h) / righe); y < Math.floor(((ty + 1) * h) / righe); y++)
      for (let x = Math.floor((tx * w) / cols); x < Math.floor(((tx + 1) * w) / cols); x++) idx.push(y * w + x);
    const b = biancoStimato(pixels, idx);
    if (b && b.n > idx.length * SOGLIE.neutriMinimiZona) kZone.push(cromaticita(b.r, b.g, b.b).cctApparente);
  }
  if (temperaturaK !== null && kZone.length >= 3) {
    const scosto = differenzaMired(Math.min(...kZone), Math.max(...kZone));
    const livello = scosto > SOGLIE.mistaSi ? 'si' : scosto > SOGLIE.mistaIncerta ? 'incerta' : 'no';
    luceMista = { mista: livello === 'si', livello, scostoMired: Math.round(scosto) };
  }

  const ev = evScena(ev100Impostazioni(imp.diaframma, imp.tempo, imp.iso), yGeo);
  const valida = problemi.length === 0;
  const base = { problemi, avvisi, affidabilitaColore, origine, impostazioni: imp, istogramma: istogramma.map((n) => n / N) };
  // Foto da rifare: nessun valore, l'app non indovina.
  if (!valida) {
    return { ...base, valida, ev: null, evDescrizione: null, temperaturaK: null, dominante: null, tinta: null, luceMista: null };
  }
  return {
    ...base, valida,
    ev: Math.round(ev * 10) / 10,
    evDescrizione: descriviEv(ev),
    temperaturaK, dominante, tinta, luceMista,
  };
}

/** Analizzatore locale (offline e gratuito). */
export const analizzaLocale: Analizzatore = (foto) => analizzaPixel(foto);
