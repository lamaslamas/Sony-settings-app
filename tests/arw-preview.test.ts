import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import exifr from 'exifr';
import { estraiAnteprimaArw } from '../src/lib/arwPreview';

// Node non ha FileReader (il browser sì): exifr lo usa per leggere i Blob/File. Qui lo simuliamo.
if (typeof FileReader === 'undefined') {
  class FileReaderNode {
    result: ArrayBuffer | null = null;
    onloadend: (() => void) | null = null;
    onload: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    readAsArrayBuffer(b: Blob) {
      b.arrayBuffer().then((r) => { this.result = r; this.onload?.(); this.onloadend?.(); }, (e) => this.onerror?.(e));
    }
  }
  (globalThis as Record<string, unknown>).FileReader = FileReaderNode;
}

// Campione reale A7R V (solo l'inizio del file): vedi tests/fixtures/README.md
const arw = readFileSync(new URL('./fixtures/a7rv-head.arw', import.meta.url));
const blob = new Blob([arw]);

function dimensioniJpeg(u8: Uint8Array): [number, number] | null {
  let i = 2;
  while (i < u8.length - 9) {
    if (u8[i] !== 0xff) { i++; continue; }
    const m = u8[i + 1];
    if (m >= 0xc0 && m <= 0xc2) return [(u8[i + 7] << 8) | u8[i + 8], (u8[i + 5] << 8) | u8[i + 6]];
    i += 2 + ((u8[i + 2] << 8) | u8[i + 3]);
  }
  return null;
}

describe('ARW della A7R V', () => {
  it('exifr legge i dati di scatto', async () => {
    const t = (await exifr.parse(blob, { exif: true, mergeOutput: true })) as Record<string, unknown>;
    expect(t.Model).toBe('ILCE-7RM5');
    expect(t.ISO).toBe(100);
    expect(t.ExposureTime).toBeCloseTo(0.0005);
    expect(t.FNumber).toBe(1.2);
  });

  it('exifr.thumbnail() da solo dà solo la miniatura 160×120', async () => {
    const mini = new Uint8Array((await exifr.thumbnail(blob))!);
    expect(dimensioniJpeg(mini)).toEqual([160, 120]);
  });

  it('estraiAnteprimaArw dà l’anteprima grande 1616×1080', async () => {
    const a = await estraiAnteprimaArw(blob);
    expect(a.origine).toBe('anteprima-ifd1');
    const u8 = new Uint8Array(await a.jpeg.arrayBuffer());
    expect([u8[0], u8[1]]).toEqual([0xff, 0xd8]);
    expect([u8.at(-2), u8.at(-1)]).toEqual([0xff, 0xd9]);
    expect(dimensioniJpeg(u8)).toEqual([1616, 1080]);
  });
});
