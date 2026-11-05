// src/ui/console/discovered-families — what TYPE each discovered instrument is:
// its family in the instrument library (DMM, Generator, Oscilloscope, Power …),
// looked up by model. The Network-and-Control tree lays a typed device
// TYPE → MODEL → MAKE (discovered-groups networkPaths).
//
// Read from WEB.OsApi's GET /api/instruments ({devices: [{model, family}]}) —
// the library's own answer, no list of models kept here. A host without it
// simply lays devices by make, as before.

import type { DeviceSetup } from './discovered-types.js';

export const INSTRUMENTS_URL = '/api/instruments';

let families = new Map<string, string>();

/** model (case-free) → family, from the library's device list. Pure. */
export function familyIndex(devices: { model?: string; family?: string }[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const d of devices) {
    const model = String(d.model ?? '').trim().toLowerCase();
    const family = String(d.family ?? '').trim();
    if (model && family && !out.has(model)) out.set(model, family);
  }
  return out;
}

/** The type a device is, or '' when the library does not know its model. */
export const typeOf = (d: Pick<DeviceSetup, 'model'>): string =>
  families.get(String(d.model ?? '').trim().toLowerCase()) ?? '';

/** Fetch the library once per call; true when the index changed. Never throws. */
export async function fetchFamilies(timeoutMs: number): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(INSTRUMENTS_URL, { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const body = (await res.json()) as { devices?: { model?: string; family?: string }[] };
    const next = familyIndex(body.devices ?? []);
    const changed = JSON.stringify([...next]) !== JSON.stringify([...families]);
    families = next;
    return changed;
  } catch { return false; /* no instrument library behind this host */ }
}
