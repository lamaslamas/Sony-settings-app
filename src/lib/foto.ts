// Lettura della foto di prova nel browser: EXIF, anteprima (per gli ARW), pixel ridimensionati.
// Niente viene caricato su un server: il file resta nel telefono.
import exifr from 'exifr';
import { estraiAnteprimaArw } from './arwPreview';
import { analizzaLocale, type ExifLite, type FotoInput, type LetturaLuce } from './analisi';

const LARGHEZZA_ANALISI = 640;

const èArw = (f: File) => /\.arw$/i.test(f.name);

async function leggiExif(file: Blob): Promise<ExifLite> {
  try {
    const t = (await exifr.parse(file, { tiff: true, exif: true, mergeOutput: true })) as Record<string, unknown> | undefined;
    if (!t) return {};
    const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : undefined);
    return {
      make: typeof t.Make === 'string' ? t.Make : undefined,
      model: typeof t.Model === 'string' ? t.Model : undefined,
      iso: num(t.ISO) ?? num(t.ISOSpeedRatings),
      tempo: num(t.ExposureTime),
      diaframma: num(t.FNumber),
      bilanciamento: num(t.WhiteBalance),
    };
  } catch {
    return {};
  }
}

/** Legge il file e lo prepara per l'analisi. Errore leggibile se il formato non si decodifica. */
export async function leggiFoto(file: File): Promise<FotoInput> {
  const exif = await leggiExif(file);
  let immagine: Blob = file;
  if (èArw(file)) immagine = (await estraiAnteprimaArw(file)).jpeg;

  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(immagine, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Non riesco a leggere questa foto. Usa un JPEG, un HEIF supportato dal telefono oppure un ARW.');
  }
  const scala = Math.min(1, LARGHEZZA_ANALISI / bmp.width);
  const width = Math.max(1, Math.round(bmp.width * scala)), height = Math.max(1, Math.round(bmp.height * scala));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const { data } = ctx.getImageData(0, 0, width, height);

  const èSony = /sony/i.test(exif.make ?? '');
  const origine: FotoInput['origine'] = èArw(file) ? 'camera-arw' : èSony ? 'camera-jpeg' : exif.make || exif.iso ? 'telefono' : 'camera-jpeg';
  return { pixels: data, width, height, exif, origine };
}

export async function analizzaFile(file: File): Promise<LetturaLuce> {
  return analizzaLocale(await leggiFoto(file));
}
