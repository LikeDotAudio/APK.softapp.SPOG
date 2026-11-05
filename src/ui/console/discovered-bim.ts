// src/ui/console/discovered-bim — the BIM library half of the Meters group:
// fetch the bench's devices and parts from DATABASE.server.BIM, keep which
// discovered devices are meters (matchMeters). Split from discovered.ts.

import { matchMeters, BIM_INSTANCES_URL, BIM_PARTS_URL, type MeterInfo, type BimInstance, type BimPart } from './discovered-meters.js';
import type { DeviceSetup } from './discovered-types.js';

/* BIM: which discovered devices the BIM library knows, their jacks in and out,
   and the role that gives them — meter, source, both (discovered-meters matchMeters). Read beside the engine's list;
   a host without the library simply has no Meters group. */
let meters = new Map<string, MeterInfo>();
export const meterMap = (): Map<string, MeterInfo> => meters;
let bimInstances: BimInstance[] = [];
let bimParts: BimPart[] = [];
export async function fetchMeters(devices: DeviceSetup[], timeoutMs: number): Promise<boolean> {
  try {
    const get = async <T,>(url: string): Promise<T | null> => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(t);
      return res.ok ? (await res.json()) as T : null;
    };
    const inst = await get<{ items: BimInstance[] }>(BIM_INSTANCES_URL);
    if (!inst) return false;
    bimInstances = inst.items ?? [];
    const ids = [...new Set(bimInstances.map((i) => i.part?.id).filter(Boolean))] as string[];
    if (ids.length) bimParts = (await get<{ items: BimPart[] }>(BIM_PARTS_URL + ids.map(encodeURIComponent).join(',')))?.items ?? bimParts;
  } catch { return false; /* no library behind this host */ }
  return rematch(devices);
}
export function rematch(devices: DeviceSetup[]): boolean {
  const next = matchMeters(devices, bimInstances, bimParts);
  const changed = JSON.stringify([...next]) !== JSON.stringify([...meters]);
  meters = next;
  return changed;
}
