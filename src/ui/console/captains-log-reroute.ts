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
import { acceptsFor, buildDroppedGroup, parseConfig } from './matrix-groups.js';

export interface ReversalPlan { drop: number[]; add: string[] }

/** A dropped group's log label is `NAME ×k`. groupBase gives NAME back (stripping any
 *  stacked ` ×k` an older build wrote), or null for a single-source label. */
export function groupBase(label: string): string | null {
  const m = /^(.*?)(?: ×\d+)+$/.exec(label.trim());
  return m && m[1] ? m[1].trim() : null;
}

/** What undoing one routing entry means for a drop-zone holding `inZone` (labels in
 *  order): `drop` = indices to take out (one per ADDED label still present — one
 *  already gone is the intended state, not an error), `add` = REMOVED labels to put
 *  back (unless still routed). Null when a label to put back has no source to clone. */
export function reversalPlan(inZone: string[], added: string[], removed: string[], sources: string[] | ((label: string) => boolean)): ReversalPlan | null {
  const has = typeof sources === 'function' ? sources : (l: string): boolean => sources.includes(l);
  // A group matches by NAME, so a label written by an older build (`NAME ×3 ×3`) still pairs.
  const key = (l: string): string => groupBase(l) ?? l;
  const drop: number[] = [];
  for (const a of added) {
    const i = inZone.findIndex((l, j) => key(l) === key(a) && !drop.includes(j));
    if (i >= 0) drop.push(i);
  }
  const kept = inZone.filter((_, j) => !drop.includes(j)).map(key);
  const add = removed.filter((r) => r && !kept.includes(key(r)));
  if (add.some((r) => !has(r))) return null;
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
  const single = (r: string): HTMLElement | undefined => pool.find((n) => labelOf(n) === r);
  const plan = reversalPlan(nodes.map(labelOf), added, removed, (r) => !!single(r) || !!groupFeeds(twist, r, pool, labelOf));
  if (!plan) return false;
  plan.drop.forEach((i) => nodes[i]?.remove());
  for (const r of plan.add) {
    const src = single(r);
    if (src) { placeSourceInTwist(twist, src); continue; }
    const g = groupFeeds(twist, r, pool, labelOf);
    if (g) dz.appendChild(buildDroppedGroup(g.name, getComputedStyle(g.colorOf).color, g.feeds, g.parent));
  }
  refreshCrosspoints(dz);
  updateTwistVisuals(twist);
  publishCrosspoints(twist);
  return true;
}

/** Re-find the feeds a dropped group `NAME ×k` was built from, the way matrix.ts's
 *  drop built it: a gang cell (multiplex) whose header is NAME, else ≥2 plain pool
 *  sources whose origin ends in NAME. Null when the console has no such source. */
function groupFeeds(twist: HTMLElement, label: string, pool: HTMLElement[], labelOf: (n: Element) => string):
  { name: string; feeds: HTMLElement[]; parent: string; colorOf: HTMLElement } | null {
  const name = groupBase(label);
  if (!name) return null;
  const accepts = acceptsFor(parseConfig(twist));
  const lineage = (o: string): string[] => o.split(' — ').map((x) => x.trim()).filter(Boolean);
  const mux = pool.find((n) => n.classList.contains('multiplex') && labelOf(n) === name);
  if (mux) {
    const feeds = [...mux.querySelectorAll<HTMLElement>('.sub-stream')].filter((f) => accepts(f) && !f.classList.contains('control'));
    return feeds.length ? { name, feeds, parent: lineage(mux.dataset.origin || '').join(' · '), colorOf: mux } : null;
  }
  const feeds = pool.filter((n) => !n.classList.contains('multiplex') && n.dataset.origin && accepts(n)
    && lineage(n.dataset.origin).pop() === name);
  if (feeds.length < 2) return null;
  return { name, feeds, parent: lineage(feeds[0]!.dataset.origin!).slice(0, -1).join(' · '), colorOf: feeds[0]! };
}
