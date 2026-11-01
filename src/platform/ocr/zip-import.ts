// src/platform/ocr/zip-import — the photos inside a .zip, read in memory under
// the sandbox rules of domain/ocr/archive-rules (ROAD-3475).
//
// No zip library: the central directory is read with a DataView and each entry
// is inflated with the runtime's own DecompressionStream('deflate-raw') — in the
// browser and in node alike. Nothing is written anywhere; an image comes out as
// a File, everything else comes out as a line saying why it did not.

import { DEFAULT_LIMITS, entryVerdict, sniffImage, type ArchiveLimits, type EntryHeader } from '../../domain/ocr/archive-rules.js';

export interface ZipImages {
  images: File[];
  rejected: Array<{ name: string; reason: string }>;
}

const EOCD = 0x06054b50, CEN = 0x02014b50, LOC = 0x04034b50;

/** Read up to `cap` bytes out of a raw-deflate stream; throws past the cap. */
async function inflateCapped(data: Uint8Array, cap: number): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const reader = stream.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > cap) { await reader.cancel(); throw new Error(`inflates past ${cap} bytes`); }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.byteLength; }
  return out;
}

const bytesOf = async (b: Blob, start: number, end: number): Promise<Uint8Array> => new Uint8Array(await b.slice(start, end).arrayBuffer());

/** The images in `zip`. Throws only when the archive as a whole is refused
 *  (too big, not a zip, too many entries, zip64). */
export async function readZipImages(zip: Blob, limits: ArchiveLimits = DEFAULT_LIMITS): Promise<ZipImages> {
  if (zip.size > limits.maxArchiveBytes) throw new Error(`archive is larger than ${limits.maxArchiveBytes} bytes`);
  const tailStart = Math.max(0, zip.size - (0xffff + 22));
  const tail = await bytesOf(zip, tailStart, zip.size);
  const tv = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  let e = -1;
  for (let i = tail.length - 22; i >= 0; i--) if (tv.getUint32(i, true) === EOCD) { e = i; break; }
  if (e < 0) throw new Error('not a zip archive (no end-of-directory record)');
  const count = tv.getUint16(e + 10, true), cdSize = tv.getUint32(e + 12, true), cdOff = tv.getUint32(e + 16, true);
  if (count === 0xffff || cdOff === 0xffffffff) throw new Error('zip64 archives are not read');
  if (count > limits.maxEntries) throw new Error(`archive holds ${count} entries — more than ${limits.maxEntries}`);
  if (cdOff + cdSize > zip.size) throw new Error('central directory lies outside the file');

  const cd = await bytesOf(zip, cdOff, cdOff + cdSize);
  const v = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
  const utf8 = new TextDecoder('utf-8', { fatal: false });
  const out: ZipImages = { images: [], rejected: [] };
  let total = 0;
  for (let p = 0, n = 0; n < count; n++) {
    if (p + 46 > cd.length || v.getUint32(p, true) !== CEN) { out.rejected.push({ name: `entry ${n + 1}`, reason: 'damaged central directory' }); break; }
    const nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), commentLen = v.getUint16(p + 32, true);
    const h: EntryHeader = {
      flags: v.getUint16(p + 8, true), method: v.getUint16(p + 10, true),
      compressedSize: v.getUint32(p + 20, true), size: v.getUint32(p + 24, true),
      name: utf8.decode(cd.subarray(p + 46, p + 46 + nameLen)),
    };
    const local = v.getUint32(p + 42, true);
    p += 46 + nameLen + extraLen + commentLen;

    const verdict = entryVerdict(h, limits);
    if (verdict.ok === 'skip') continue;
    if (!verdict.ok) { out.rejected.push({ name: h.name, reason: verdict.reason }); continue; }
    if (out.images.length >= limits.maxImages) { out.rejected.push({ name: h.name, reason: `more than ${limits.maxImages} images — the rest are left` }); continue; }
    try {
      const lh = await bytesOf(zip, local, local + 30);
      const lv = new DataView(lh.buffer, lh.byteOffset, lh.byteLength);
      if (lh.length < 30 || lv.getUint32(0, true) !== LOC) throw new Error('damaged local header');
      const start = local + 30 + lv.getUint16(26, true) + lv.getUint16(28, true);
      if (total + h.size > limits.maxTotalBytes) throw new Error(`the images together pass ${limits.maxTotalBytes} bytes`);
      const raw = await bytesOf(zip, start, start + h.compressedSize);
      const cap = h.size;   // the declared size; a stream that inflates past it is cut off
      const body = h.method === 0 ? raw : await inflateCapped(raw, cap);
      if (body.length !== h.size) throw new Error(`inflated to ${body.length} bytes, header says ${h.size}`);
      const type = sniffImage(body);
      if (!type) { out.rejected.push({ name: h.name, reason: 'not an image (the bytes are not PNG, JPEG, GIF, WebP or BMP)' }); continue; }
      total += body.length;
      out.images.push(new File([body as BlobPart], h.name, { type }));
    } catch (err) {
      out.rejected.push({ name: h.name, reason: (err as Error).message });
    }
  }
  return out;
}
