// src/ui/ocr/ocr-attach — "+ ATTACH" and "ADD ALL" carried out (ROAD-3475).
//
// No writer of its own: each value is decided by domain/ocr/attach-plan
// (scan-route's FILL decision) and written by the SCAN panel's act() — the
// authoring commit, a draft plus a reversible Captain's Log entry, BUILD right.
// The netlist is re-read before every write, so a value ADD ALL wrote a moment
// ago counts in the next one's duplicate check.

import { attachOutcome, planAddAll } from '../../domain/ocr/attach-plan.js';
import type { Candidate } from '../../domain/ocr/candidates.js';
import type { NetEntry } from '../../domain/scan/netlist.js';
import { loadNetlist } from '../../platform/scan/netlist-load.js';
import { act, type Acted } from '../scan/scan-act.js';

export const VIA = 'read by OCR';

export interface Attached { candidate: Candidate; acted: Acted }

/** The target as the netlist holds it NOW (null when it is gone). */
async function fresh(targetKey: string): Promise<{ entries: NetEntry[]; target: NetEntry | null }> {
  const entries = await loadNetlist();
  return { entries, target: entries.find((e) => e.key === targetKey) ?? null };
}

export async function attachOne(c: Candidate, targetKey: string | null): Promise<Attached> {
  const { entries, target } = targetKey ? await fresh(targetKey) : { entries: [], target: null };
  return { candidate: c, acted: await act(attachOutcome(c, target, entries), VIA) };
}

/** Every value ADD ALL may take, one after another; then each one it left, and why. */
export async function attachAll(cands: readonly Candidate[], targetKey: string | null): Promise<Attached[]> {
  const plan = planAddAll(cands);
  const out: Attached[] = [];
  for (const c of plan.take) out.push(await attachOne(c, targetKey));
  for (const s of plan.skipped) out.push({ candidate: s.candidate, acted: { line: `LEFT — ${s.reason}`, tone: 'warn' } });
  return out;
}
