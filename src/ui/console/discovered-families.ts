// src/ui/console/discovered-families — what TYPE each discovered instrument is:
// its family in the instrument library (DMM, Generator, Oscilloscope, Power …),
// looked up by model. The Network-and-Control tree lays a typed device
// TYPE → MODEL → MAKE (discovered-groups networkPaths).
//
// Read from WEB.OsApi's GET /api/instruments ({devices: [{model, family}]}) —
// the library's own answer, no list of models kept here. A host without it
// simply lays devices by make, as before.
//
// Each line also carries its family's ROLES, from the family repo's thing.json
// (WEB.OsApi osapi/instruments.py family_things): `inputs` (its jacks are a
// destination), `metering` (readings on <box>/Reading/#), `monitoring` (a trace
// to watch), `source`. discovered-meters lays a box by them (ROAD-3516).

import type { DeviceSetup } from './discovered-types.js';

export const INSTRUMENTS_URL = '/api/instruments';

let families = new Map<string, string>();
let roles = new Map<string, readonly string[]>();

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

/** model (case-free) → its family's thing.json roles, from the same list. Pure. */
export function roleIndex(devices: { model?: string; roles?: unknown }[]): Map<string, readonly string[]> {
  const out = new Map<string, readonly string[]>();
  for (const d of devices) {
    const model = String(d.model ?? '').trim().toLowerCase();
    const r = Array.isArray(d.roles) ? d.roles.map(String) : [];
    if (model && r.length && !out.has(model)) out.set(model, r);
  }
  return out;
}

/** What the device's family says it IS on the bench — [] when the library does not say. */
export const rolesOf = (d: Pick<DeviceSetup, 'model'>): readonly string[] =>
  roles.get(String(d.model ?? '').trim().toLowerCase()) ?? [];

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
    const body = (await res.json()) as { devices?: { model?: string; family?: string; roles?: unknown }[] };
    const next = familyIndex(body.devices ?? []);
    const nextRoles = roleIndex(body.devices ?? []);
    const changed = JSON.stringify([...next]) !== JSON.stringify([...families])
      || JSON.stringify([...nextRoles]) !== JSON.stringify([...roles]);
    families = next;
    roles = nextRoles;
    return changed;
  } catch { return false; /* no instrument library behind this host */ }
}
