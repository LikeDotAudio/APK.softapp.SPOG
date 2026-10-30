// src/ui/console/captains-log-reroute — Reverse Course for entries whose live DOM
// refs died with the session (restored after a reload, or received from another
// seat). Such an entry still carries its routing as LABELS ({dest, prod, added[],
// removed[]}), so the reversal is RE-DERIVED from that persisted state: find the
// twist by name, take the added sources back out, put the removed ones back in
// from the sources panel. reversalPlan is the pure core (unit-tested); reroute
// applies it to the DOM and refuses — touching nothing — when it can't be done.
import { placeSourceInTwist, publishCrosspoints } from './matrix-place.js';
import { refreshCrosspoints } from './matrix-crosspoints.js';
import { updateTwistVisuals } from './helix.js';

export interface ReversalPlan { drop: number[]; add: string[] }

/** What undoing one routing entry means for a drop-zone holding `inZone` (labels in
 *  order): `drop` = indices to take out (one per ADDED label still present — one
 *  already gone is the intended state, not an error), `add` = REMOVED labels to put
 *  back (unless still routed). Null when a label to put back has no source to clone. */
export function reversalPlan(inZone: string[], added: string[], removed: string[], sources: string[]): ReversalPlan | null {
  const drop: number[] = [];
  for (const a of added) {
    const i = inZone.findIndex((l, j) => l === a && !drop.includes(j));
    if (i >= 0) drop.push(i);
  }
  const kept = inZone.filter((_, j) => !drop.includes(j));
  const add = removed.filter((r) => r && !kept.includes(r));
  if (add.some((r) => !sources.includes(r))) return null;
  return { drop, add };
}

/** Find a twist by the {dest, prod} its log entry was narrated with. */
export function findTwist(dest: string, prod: string, infoOf: (t: HTMLElement) => { dest: string; prod: string }): HTMLElement | null {
  for (const t of document.querySelectorAll<HTMLElement>('.twist-container')) {
    const i = infoOf(t);
    if (i.dest === dest && (!prod || i.prod === prod)) return t;
  }
  return null;
}

/** Re-derive and apply the reversal of a label-only routing entry. Returns false
 *  (nothing changed) when the twist is gone or a source to restore isn't on the
 *  console — the entry then stays un-reversed rather than lying about it. */
export function reroute(twist: HTMLElement, added: string[], removed: string[], labelOf: (n: Element) => string): boolean {
  const dz = twist.querySelector<HTMLElement>('.drop-zone');
  if (!dz) return false;
  const nodes = [...dz.querySelectorAll<HTMLElement>('.signal-node')].filter((n) => !n.parentElement?.closest('.signal-node'));
  const pool = [...document.querySelectorAll<HTMLElement>('.signal-node')].filter((n) => !n.closest('.twist-container'));
  const plan = reversalPlan(nodes.map(labelOf), added, removed, pool.map(labelOf));
  if (!plan) return false;
  plan.drop.forEach((i) => nodes[i]?.remove());
  for (const r of plan.add) {
    const src = pool.find((n) => labelOf(n) === r);
    if (src) placeSourceInTwist(twist, src);
  }
  refreshCrosspoints(dz);
  updateTwistVisuals(twist);
  publishCrosspoints(twist);
  return true;
}
