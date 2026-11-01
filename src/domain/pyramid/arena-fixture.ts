// src/domain/pyramid/arena-fixture — an arena-scale facility in SPOG's own import
// shape (a `spog.router/1` document, what the 1990s view exports and imports), for
// measuring the import path and the loading pyramid (ROAD-3474). Deterministic: the
// same arguments always give byte-identical JSON. Real Routes/** today is ~200 leaves
// (~320 KB); the default here is 5,000 devices and 20,000 connections:
//
//   sources       10 studios × 10 walls × 25 boxes  = 2,500 boxes × 8 feeds
//   destinations  10 facilities × 10 rooms × 25 twists = 2,500 twists × 8 routed
//
// Only tests and benches import it, so it never reaches the bundle.
import type { RouterDoc } from '../router-doc/json.js';

export interface ArenaSize { areas: number; groups: number; perGroup: number; ports: number }
export const ARENA: ArenaSize = { areas: 10, groups: 10, perGroup: 25, ports: 8 };

const pad = (n: number): string => String(n + 1).padStart(2, '0');

export function arenaDoc(size: ArenaSize = ARENA): RouterDoc {
  const { areas, groups, perGroup, ports } = size;
  const origin = (a: number, g: number, b: number): string => `STUDIO ${pad(a)} — WALL ${pad(g)} — SB ${pad(b)}`;
  const sources = Array.from({ length: areas }, (_a, a) => ({
    name: `STUDIO ${pad(a)}`,
    children: Array.from({ length: groups }, (_g, g) => ({
      name: `WALL ${pad(g)}`,
      children: Array.from({ length: perGroup }, (_b, b) => ({
        name: `SB ${pad(b)}`, type: b % 2 ? 'audio' : 'video', status: 'OK',
        feeds: Array.from({ length: ports }, (_f, f) => `${a}.${g}.${b}-${f + 1}`),
      })),
    })),
  }));
  const total = areas * groups * perGroup;
  const destinations = Array.from({ length: areas }, (_a, a) => ({
    name: `FACILITY ${pad(a)}`,
    rooms: Array.from({ length: groups }, (_r, r) => ({
      name: `ROOM ${pad(r)}`,
      twists: Array.from({ length: perGroup }, (_t, t) => ({
        name: `TWIST ${pad(t)}`, accepts: 'both', row: 'main',
        routed: Array.from({ length: ports }, (_f, f) => {
          // Spread each twist's feeds across the facility — most wires cross groups.
          const i = (((a * groups + r) * perGroup + t) * 7 + f * 131) % total;
          const sa = Math.floor(i / (groups * perGroup)), sg = Math.floor(i / perGroup) % groups, sb = i % perGroup;
          return { origin: origin(sa, sg, sb), feed: `${sa}.${sg}.${sb}-${f + 1}`, type: sb % 2 ? 'audio' : 'video' };
        }),
      })),
    })),
  }));
  return { schema: 'spog.router/1', stamp: '20261101.0000', sources, destinations };
}

export const arenaText = (size: ArenaSize = ARENA): string => JSON.stringify(arenaDoc(size));
