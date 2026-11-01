// src/domain/router-doc/scope — which lazy console groups an import's routes touch
// (ROAD-3483). The console names a fed thing by its folder chain joined with ' — '
// (a source's origin "STUDIO — WALL 1 — SB 3", a room's title "FLOOR 2 — ROOM 9"),
// so a folder can hold a named thing only when its own label is an ancestor of that
// name. Pure: the 1990s import opens exactly the folders these keys name.

import { norm } from './sheet.js';

const SEP = ' — ';

/** Every proper ancestor of each name, as match keys: "A — B — C" gives "A" and
 *  "A — B". A folder whose `norm(label)` is in the set may hold one of the names. */
export function ancestorKeys(names: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const name of names) {
    const parts = norm(name).split(SEP);
    for (let i = 1; i < parts.length; i++) out.add(parts.slice(0, i).join(SEP));
  }
  return out;
}

/** True when a group labelled `label` may hold one of the names behind `keys`. */
export const touches = (keys: Set<string>, label: string): boolean => keys.has(norm(label));
