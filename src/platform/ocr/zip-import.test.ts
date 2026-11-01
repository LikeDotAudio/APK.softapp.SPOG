// src/platform/ocr/zip-import.test — the .zip sandbox: images out, traversal,
// absolute paths, non-images, encryption, bombs and oversize archives refused
// by name (ROAD-3475). The zips are built here byte by byte.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { readZipImages } from './zip-import.js';
import { DEFAULT_LIMITS, unsafePath, sniffImage } from '../../domain/ocr/archive-rules.js';

const PNG = readFileSync(join(__dirname, '__fixtures__/rack-label.png'));
interface Ent { name: string; data: Uint8Array; deflate?: boolean; flags?: number; size?: number }

/** A minimal PKZIP: local headers + central directory + end record. */
function zip(entries: Ent[]): Blob {
  const locals: Buffer[] = [], cens: Buffer[] = [];
  let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const body = e.deflate ? deflateRawSync(e.data) : Buffer.from(e.data);
    const method = e.deflate ? 8 : 0, size = e.size ?? e.data.length;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(e.flags ?? 0, 6); lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(size, 22); lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(e.flags ?? 0, 8); ch.writeUInt16LE(method, 10);
    ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(size, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, name, body); cens.push(ch, name);
    off += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(cens);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return new Blob([Buffer.concat([...locals, cd, end])]);
}

describe('readZipImages', () => {
  it('hands on the images (stored and deflated), named by their path, typed by their bytes', async () => {
    const r = await readZipImages(zip([
      { name: 'rack/B/u12.png', data: PNG, deflate: true },
      { name: 'rack/B/', data: new Uint8Array() },
      { name: 'flat.jpg', data: PNG },                         // a PNG that claims to be a JPEG
    ]));
    expect(r.rejected).toEqual([]);
    expect(r.images.map((f) => [f.name, f.type, f.size])).toEqual([['rack/B/u12.png', 'image/png', PNG.length], ['flat.jpg', 'image/png', PNG.length]]);
    expect(Buffer.from(await r.images[0]!.arrayBuffer()).equals(PNG)).toBe(true);
  });
  it('refuses path traversal, absolute paths and non-images by name, and takes the rest', async () => {
    const r = await readZipImages(zip([
      { name: '../../etc/evil.png', data: PNG },
      { name: 'ok/../../up.png', data: PNG },
      { name: '/abs.png', data: PNG },
      { name: 'C:\\win.png', data: PNG },
      { name: 'notes.png', data: Buffer.from('not an image at all'), deflate: true },
      { name: 'good.png', data: PNG },
      { name: '__MACOSX/._good.png', data: Buffer.from('x') },
    ]));
    expect(r.images.map((f) => f.name)).toEqual(['good.png']);
    expect(r.rejected).toEqual([
      { name: '../../etc/evil.png', reason: 'path climbs out of the archive (..)' },
      { name: 'ok/../../up.png', reason: 'path climbs out of the archive (..)' },
      { name: '/abs.png', reason: 'absolute path' },
      { name: 'C:\\win.png', reason: 'absolute path' },
      { name: 'notes.png', reason: expect.stringMatching(/not an image/) },
    ]);
  });
  it('refuses encrypted entries, bomb ratios and entries that inflate past their declared size', async () => {
    const zeros = new Uint8Array(4 * 1024 * 1024);
    const r = await readZipImages(zip([
      { name: 'locked.png', data: PNG, flags: 1 },
      { name: 'bomb.png', data: zeros, deflate: true },
      { name: 'liar.png', data: PNG, deflate: true, size: 100 },
    ]));
    expect(r.images).toEqual([]);
    expect(r.rejected.map((x) => x.reason)).toEqual(['encrypted entry', expect.stringMatching(/ratio above 200:1/), expect.stringMatching(/inflates past 100 bytes/)]);
  });
  it('refuses a whole archive that is too big, has too many entries, or is not a zip', async () => {
    const two = zip([{ name: 'a.png', data: PNG }, { name: 'b.png', data: PNG }]);
    await expect(readZipImages(two, { ...DEFAULT_LIMITS, maxArchiveBytes: 1000 })).rejects.toThrow(/larger than 1000/);
    await expect(readZipImages(two, { ...DEFAULT_LIMITS, maxEntries: 1 })).rejects.toThrow(/2 entries/);
    await expect(readZipImages(new Blob([PNG]))).rejects.toThrow(/not a zip/);
    const capped = await readZipImages(two, { ...DEFAULT_LIMITS, maxImages: 1 });
    expect([capped.images.length, capped.rejected[0]?.reason]).toEqual([1, expect.stringMatching(/more than 1 images/)]);
  });
  it('the rules on their own', () => {
    expect(unsafePath('a/b/c.png')).toBeNull();
    expect(unsafePath('a\\..\\b.png')).toMatch(/climbs/);
    expect(unsafePath('a\0.png')).toMatch(/NUL/);
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffImage(new TextEncoder().encode('<svg'))).toBeNull();
  });
});
