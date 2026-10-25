// Anteprima JPEG incorporata nei RAW Sony (ARW) e nelle foto JPEG/HEIF: tutto in locale nel browser.
// Verificato su un ARW reale della A7R V (86 MB): exifr legge solo l'inizio del file, senza caricarlo tutto.
import exifr from 'exifr';

export interface Anteprima {
  /** JPEG pronto per createImageBitmap / <img>. */
  jpeg: Blob;
  /** Quale parte del file è stata usata. */
  origine: 'anteprima-ifd1' | 'miniatura';
}

/**
 * Estrae l'anteprima grande di un ARW.
 * Nella A7R V l'IFD1 punta a un JPEG 1616×1080 (~500 KB); `exifr.thumbnail()` da solo darebbe
 * invece la miniatura 160×120, troppo piccola per misurare luce e colore.
 */
export async function estraiAnteprimaArw(file: Blob): Promise<Anteprima> {
  const tag = (await exifr.parse(file, { ifd1: true, mergeOutput: true })) as
    | { ThumbnailOffset?: number; ThumbnailLength?: number }
    | undefined;
  const off = tag?.ThumbnailOffset, len = tag?.ThumbnailLength;
  if (off && len && off + len <= file.size) {
    return { jpeg: file.slice(off, off + len, 'image/jpeg'), origine: 'anteprima-ifd1' };
  }
  const mini = await exifr.thumbnail(file);
  if (!mini) throw new Error('Nessuna anteprima JPEG trovata nel file.');
  return { jpeg: new Blob([mini as BlobPart], { type: 'image/jpeg' }), origine: 'miniatura' };
}
