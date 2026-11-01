// src/domain/ocr/archive-rules — what a .zip of photos may hand the OCR
// importer (ROAD-3475). Pure: the rules; platform/ocr/zip-import applies them.
//
// A zip is untrusted input from a technician's phone or a client's share. It is
// never written to disk, but it is still held to a sandbox: bounded in size and
// count before anything is inflated, entries with a path that climbs out
// (`../`), starts at a root (`/`, `C:`), or carries a NUL are refused by name,
// encrypted / zip64 / exotic compression are refused, an entry inflating past
// its declared size or a bomb ratio is cut off, and only bytes that ARE an
// image (by magic number — not by the name it claims) come out.

export interface ArchiveLimits {
  /** The .zip file itself. */
  maxArchiveBytes: number;
  /** Central-directory entries looked at (directories included). */
  maxEntries: number;
  /** Images handed on. */
  maxImages: number;
  /** One image, inflated. */
  maxEntryBytes: number;
  /** All images, inflated. */
  maxTotalBytes: number;
  /** Inflated / compressed, per entry. */
  maxRatio: number;
}

export const DEFAULT_LIMITS: ArchiveLimits = {
  maxArchiveBytes: 256 * 1024 * 1024,
  maxEntries: 2000,
  maxImages: 300,
  maxEntryBytes: 40 * 1024 * 1024,
  maxTotalBytes: 512 * 1024 * 1024,
  maxRatio: 200,
};

export interface EntryHeader {
  name: string;
  method: number;
  flags: number;
  compressedSize: number;
  size: number;
}

export type Verdict = { ok: true } | { ok: false; reason: string } | { ok: 'skip' };

const STORED = 0, DEFLATE = 8;

/** Why a path may not come out of an archive, or null when it may. */
export function unsafePath(name: string): string | null {
  if (!name) return 'empty name';
  if (name.includes('\0')) return 'NUL in name';
  const n = name.replace(/\\/g, '/');
  if (n.startsWith('/') || /^[a-z]:/i.test(n)) return 'absolute path';
  if (n.split('/').some((seg) => seg === '..')) return 'path climbs out of the archive (..)';
  return null;
}

/** The header-level verdict on one entry — before a byte of it is inflated. */
export function entryVerdict(h: EntryHeader, limits: ArchiveLimits = DEFAULT_LIMITS): Verdict {
  const bad = unsafePath(h.name);
  if (bad) return { ok: false, reason: bad };
  if (h.name.endsWith('/')) return { ok: 'skip' };                       // a directory
  const base = h.name.split('/').pop()!;
  if (base.startsWith('.') || h.name.startsWith('__MACOSX/')) return { ok: 'skip' };   // OS litter
  if (h.flags & 0x1) return { ok: false, reason: 'encrypted entry' };
  if (h.method !== STORED && h.method !== DEFLATE) return { ok: false, reason: `compression method ${h.method} is not read` };
  if (h.size === 0xffffffff || h.compressedSize === 0xffffffff) return { ok: false, reason: 'zip64 entry is not read' };
  if (h.size > limits.maxEntryBytes) return { ok: false, reason: `larger than ${limits.maxEntryBytes} bytes` };
  if (h.compressedSize > 0 && h.size / h.compressedSize > limits.maxRatio) return { ok: false, reason: `compression ratio above ${limits.maxRatio}:1` };
  return { ok: true };
}

/** The image type the BYTES are, or null. A name ending .png proves nothing. */
export function sniffImage(b: Uint8Array): string | null {
  const at = (i: number, ...v: number[]): boolean => v.every((x, k) => b[i + k] === x);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return 'image/gif';
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp';
  if (at(0, 0x42, 0x4d)) return 'image/bmp';
  return null;
}
