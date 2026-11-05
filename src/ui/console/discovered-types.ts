// src/ui/console/discovered-types — the engine's device setup shapes and the
// pure helpers every discovered-* module shares (split from discovered-layer).

export interface DeviceIO {
  id: string;
  name: string;
  kind: string;            // 'audio' | 'video' | 'data'
  wire: string;            // 'dante' | 'aes67' | 'chromecast' | 'visa' | …
  channel?: number;
  format?: string | null;
  address?: string | null;
  port?: number | null;
  from?: { device: string; channel: string; status: string } | null;
}

export interface DeviceSetup {
  id: string;
  key: string;
  name: string;
  make: string;
  model: string;
  serial: string;
  mac: string | null;
  address: string;
  wires: string[];
  online: boolean;
  outputs: DeviceIO[];
  inputs: DeviceIO[];
  control: string | null;
}

export const isSetup = (v: unknown): v is DeviceSetup =>
  !!v && typeof v === 'object' && typeof (v as DeviceSetup).key === 'string'
  && Array.isArray((v as DeviceSetup).outputs) && Array.isArray((v as DeviceSetup).inputs);

/** The root manifests a layer is built on. */
export interface Roots { src: string[]; dest: string[] }

/** The roots the layer must be rebuilt on when the stored drafts change, or null
 *  when the layer built on `last` still holds. A drafted root wins (an import or an
 *  edit wrote it); without one the root is disk's — null in `disk` when disk was
 *  never read, so the caller must fetch (ROAD-3483: the layer used to keep the root
 *  it was first built on, hiding the folder a later workbook import registered). */
export function movedRoots(
  last: Roots,
  drafted: { src: string[] | null; dest: string[] | null },
  disk: { src: string[] | null; dest: string[] | null },
): Roots | 'fetch' | null {
  const src = Array.isArray(drafted.src) ? drafted.src : disk.src;
  const dest = Array.isArray(drafted.dest) ? drafted.dest : disk.dest;
  if (!src || !dest) return 'fetch';
  const same = (a: string[], b: string[]): boolean => a.length === b.length && a.every((e, i) => e === b[i]);
  return same(src, last.src) && same(dest, last.dest) ? null : { src, dest };
}

/** A stream's channel names from its format ("8 ch" → CH 1…CH 8), else its own name. */
export function streamChannels(format?: string | null, name?: string): string[] {
  if (format) {
    const m = format.match(/(\d+)\s*ch\b/i);
    if (m && m[1]) {
      const count = parseInt(m[1], 10);
      if (count > 0 && count <= 64) {
        return Array.from({ length: count }, (_, idx) => `CH ${idx + 1}`);
      }
    }
  }
  return [name || 'CH 1'];
}
