// src/domain/ocr/attach-plan — what "+ ATTACH" and "ADD ALL" mean (ROAD-3475).
// Pure: it decides, ui/ocr carries it out.
//
// Attaching is the SCAN panel's FILL, not a second writer: every value goes
// through scan-route's routeRead('fill', …), so the OCR importer refuses exactly
// what SCAN refuses — no target card, a discovered device (its identity is what
// it reports), a value the card already holds, a serial / asset tag / MAC that
// another unit already carries.
//
// ADD ALL takes only what a printed label named (a MAC counts: its form names
// it), at most one value per field. Two different serials on one photo is a
// question for the operator, not a pick: that field is skipped and says why.

import { routeRead, type Outcome } from '../scan/scan-route.js';
import { normCode, type IdentityField, type NetEntry } from '../scan/netlist.js';
import type { Candidate } from './candidates.js';

/** The FILL decision for one candidate on the target card. */
export function attachOutcome(c: Candidate, target: NetEntry | null, entries: readonly NetEntry[]): Outcome {
  return routeRead('fill', c.value, { entries, active: target, fillField: c.kind });
}

export interface AddAllPlan {
  take: Candidate[];
  skipped: Array<{ candidate: Candidate; reason: string }>;
}

const FIELD_NAME: Record<IdentityField, string> = { serial: 'serials', asset_tag: 'asset tags', mac: 'MACs' };

/** Which candidates ADD ALL writes, and why each other one is left. */
export function planAddAll(cands: readonly Candidate[]): AddAllPlan {
  const take: Candidate[] = [];
  const skipped: AddAllPlan['skipped'] = [];
  const byKind = new Map<IdentityField, Candidate[]>();
  for (const c of cands) {
    if (!c.labelled && c.kind !== 'mac') { skipped.push({ candidate: c, reason: 'no printed label names it — attach it by hand if it is right' }); continue; }
    byKind.set(c.kind, [...(byKind.get(c.kind) ?? []), c]);
  }
  for (const [kind, list] of byKind) {
    const distinct = new Set(list.map((c) => normCode(c.value)));
    if (distinct.size === 1) { take.push(list[0]!); continue; }
    for (const c of list) skipped.push({ candidate: c, reason: `${distinct.size} different ${FIELD_NAME[kind]} on this photo — attach the right one by hand` });
  }
  return { take, skipped };
}
