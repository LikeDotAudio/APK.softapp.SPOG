// src/ui/scan/scan-act — carry out what scan-route decided (ROAD-3476).
//
//   located   reveal the hit: open the destination's footer tab (and flash the
//             twist), or flash every placement of a source device — the box in
//             the rail AND each route of it on a twist (the wire ends)
//   fill      write through the authoring path every layout edit uses
//             (authoring-commit `commit`: draft in routes-store + a reversible
//             Captain's Log entry), gated on the BUILD right
//   mismatch  an OBSERVATION in the Captain's Log — SPOG keeps no separate
//   unrecorded notes store; the log is persisted (IDB), published on the bus
//             and visible to every seat
//
// Returns the line the panel's own log shows, and a tone.

import { fetchJSON } from '../../platform/discovery.js';
import { applyIdentity, destTabId, normCode, type NetEntry } from '../../domain/scan/netlist.js';
import type { Outcome } from '../../domain/scan/scan-route.js';
import { commit, canBuild } from '../console/authoring-commit.js';
import { logAction } from '../console/captains-log.js';
import { footerGroups, openGroupPath } from '../console/footer.js';
import { expandProductionGroups } from '../console/footer-deeplink.js';
import { refreshIdentity } from '../identity-line.js';

export type Tone = 'ok' | 'warn' | 'bad';
export interface Acted { line: string; tone: Tone }

const label = (e: NetEntry): string => (e.parent ? `${e.parent} · ${e.name}` : e.name);
const FLASH_MS = 2600;

function flash(nodes: HTMLElement[]): void {
  nodes.forEach((n) => { n.classList.add('scan-flash'); setTimeout(() => n.classList.remove('scan-flash'), FLASH_MS); });
  nodes[0]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

/** Retry until `find` yields nodes (destination panes render on demand). */
function whenRendered(find: () => HTMLElement[], tries = 16): void {
  const nodes = find();
  if (nodes.length) { flash(nodes); return; }
  if (tries > 0) setTimeout(() => whenRendered(find, tries - 1), 125);
}

/** Bring an entry into view. Returns false when nothing on screen carries it. */
export function reveal(entry: NetEntry): boolean {
  if (entry.kind === 'source') {
    const want = normCode(entry.name);
    const nodes = [...document.querySelectorAll<HTMLElement>('.signal-node[data-origin]')]
      .filter((n) => { const o = normCode(n.dataset['origin'] ?? ''); return o === want || o.endsWith(want) && want.length >= 4; });
    if (nodes.length) flash(nodes);
    return nodes.length > 0;
  }
  const tabId = destTabId(entry.url);
  const tab = document.querySelector<HTMLElement>(`.lcars-tab[data-tab-id="${CSS.escape(tabId)}"]`);
  if (!tab) return false;
  const group = footerGroups().find((g) => g.tabsEl.contains(tab));
  if (group) openGroupPath(group.path);
  if (!tab.classList.contains('active')) tab.click();
  expandProductionGroups(tabId);
  tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  const pane = (): HTMLElement | null => document.getElementById('tab-' + tabId);
  whenRendered(() => {
    const p = pane(); if (!p) return [];
    if (entry.kind !== 'twist') return [p.querySelector<HTMLElement>('.program-title') ?? p].filter(Boolean) as HTMLElement[];
    return [...p.querySelectorAll<HTMLElement>(`.twist-container[data-twist-index="${entry.twistIndex}"]`)];
  });
  return true;
}


/** Carry out one outcome. `via` says in the Captain's Log how a Fill's value was
 *  read: the SCAN panel ('scanned') and the OCR importer ('read by OCR', ROAD-3475)
 *  both write identity through this one function. */
export async function act(o: Outcome, via = 'scanned'): Promise<Acted> {
  switch (o.kind) {
    case 'located': {
      // Reveal the best hit only — opening every match's tab would leave the last one showing.
      const shown = reveal(o.hits[0]!.entry);
      const names = o.hits.slice(0, 4).map((h) => `${label(h.entry)} (${h.field})`).join(', ');
      return { line: `LOCATE → ${names}${o.hits.length > 4 ? ` +${o.hits.length - 4}` : ''}${shown ? '' : ' — not on screen'}`, tone: 'ok' };
    }
    case 'not-found': return { line: 'LOCATE → nothing in the netlist carries this code', tone: 'warn' };
    case 'refused': return { line: `REFUSED — ${o.reason}`, tone: 'warn' };
    case 'fill': {
      if (!canBuild()) return { line: 'REFUSED — Fill needs the BUILD right', tone: 'warn' };
      const doc = await fetchJSON<Record<string, unknown>>(o.entry.url);
      if (!doc) return { line: `REFUSED — ${o.entry.url} could not be read`, tone: 'bad' };
      const who = label(o.entry);
      // The card's identity line redraws in place (and again on the log's undo).
      commit(doc, o.entry.url, () => refreshIdentity(o.entry.url, doc),
        // commit() prefixes the document's name; a twist adds its own.
        () => `${o.entry.kind === 'twist' ? `${o.entry.name} ` : ''}${o.field} ← ${o.value}${o.previous ? ` (was ${o.previous})` : ''} · ${via}`,
        () => { applyIdentity(doc, o.entry, o.field, o.value); });
      return { line: `FILL → ${who}.${o.field} = ${o.value}${o.previous ? ` (was ${o.previous})` : ''}`, tone: 'ok' };
    }
    case 'verified': return { line: `VERIFY ✓ ${label(o.entry)} — ${o.field} matches`, tone: 'ok' };
    case 'mismatch': {
      const rec = Object.entries(o.recorded).map(([k, v]) => `${k} ${v}`).join(', ');
      logAction(`Scan · VERIFY MISMATCH — ${label(o.entry)}: label reads "${o.code}", card records ${rec}`);
      return { line: `VERIFY ✗ ${label(o.entry)} — card records ${rec} · logged`, tone: 'bad' };
    }
    case 'unrecorded': {
      logAction(`Scan · VERIFY — ${label(o.entry)}: label reads "${o.code}", card records no serial/asset tag`);
      return { line: `VERIFY ? ${label(o.entry)} records no identity · logged`, tone: 'warn' };
    }
  }
}
