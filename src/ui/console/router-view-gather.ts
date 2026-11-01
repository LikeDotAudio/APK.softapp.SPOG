// src/ui/console/router-view-gather — pure DOM readers for the 1990s router-view.
// Split out of router-view.ts (200-line rule). These functions read the live
// console DOM to gather senders (rows), receivers (columns) and the existing
// crosspoint links; they hold no state and are unit-testable in isolation.
// Also the shared type home: RVState + the SEP key delimiter (grouping now lives in
// router-view-tree; the axis plans are built in router-view-grid).
import { loadAllDestinations } from './footer.js';
import { loadsSettled } from '../pending-loads.js';
import { touches } from '../../domain/router-doc/scope.js';

export const SEP = '␟';

import type { AxisPlan } from './router-view-tree.js';

// The shared, mutable grid state. router-view.ts constructs one of these and
// threads it (by reference) through the gather/grid parts so every part reads
// and writes the same live state — collapse Sets (per-level node keys), DOM refs
// and the current axis plans.
export interface RVState {
  overlay: HTMLElement | null;
  fs: HTMLInputElement;
  fr: HTMLInputElement;
  body: HTMLElement;
  tgSrc: HTMLElement;
  tgDst: HTMLElement;
  showAllSrc: boolean;
  showAllDst: boolean;
  prevHash: string | null;
  syncing: boolean;
  /** Collapsed node keys per axis ("r:"/"c:" prefixed segment paths). */
  rowCollapsed: Set<string>;
  colCollapsed: Set<string>;
  rowPlan: AxisPlan<HTMLElement | null> | null;
  colPlan: AxisPlan<HTMLElement | null> | null;
  crossSet: Set<string>;
  hlNodes: HTMLElement[];
}

export const firstLine = (n: Element): string => ((n as HTMLElement).innerText || '').trim().split('\n')[0] ?? '';

export function gatherSenderNodes(): Map<string, Map<string, HTMLElement | null>> {
  const m = new Map<string, Map<string, HTMLElement | null>>();
  const push = (origin: string, label: string, node: HTMLElement | null): void => {
    if (!label) return;
    if (!m.has(origin)) m.set(origin, new Map());
    const inner = m.get(origin)!;
    if (!inner.has(label)) inner.set(label, node);
  };
  document.querySelectorAll<HTMLElement>('.ingress-panel .signal-node').forEach((n) => {
    if (n.classList.contains('multiplex')) {
      const head = n.querySelector<HTMLElement>('.multiplex-header');
      const bo = n.dataset.origin || (head ? head.innerText.trim() : '');
      n.querySelectorAll<HTMLElement>('.multiplex-children .signal-node').forEach((sub) =>
        push(sub.dataset.origin || bo, firstLine(sub), sub));
    } else if (!n.classList.contains('sub-stream') && !n.classList.contains('dropped-group')) {
      const label = firstLine(n);
      push(n.dataset.origin || label, label, n);
    }
  });
  // Also harvest sources that are ALREADY ROUTED (placed as crosspoints) even when
  // their panel pool is collapsed / lazy-unrendered — otherwise a live route has no
  // sender row to land in and drops off the grid ("states being lost"). Panel nodes
  // scanned above win the label; this only fills gaps. Keys match gatherLinks() exactly.
  document.querySelectorAll<HTMLElement>('.twist-container .drop-zone > .signal-node').forEach((node) => {
    const feeds = node.classList.contains('dropped-group')
      ? [...node.querySelectorAll<HTMLElement>('.dropped-group-children .signal-node')] : [node];
    feeds.forEach((f) => {
      const label = firstLine(f); if (!label) return;
      push(f.dataset.origin || node.dataset.origin || label, label, f);
    });
  });
  return m;
}

export function typeDot(node: HTMLElement | null | undefined, label: string): string {
  let cls = '';
  if (node && node.classList) {
    if (node.classList.contains('video')) cls = 'v';
    else if (node.classList.contains('control')) cls = 's';
    else if (node.classList.contains('audio')) cls = 'a';
  }
  if (!cls) cls = /tally|on.?air|\bpgm\b|\bpvw\b|signal|control|gpi/i.test(label) ? 's'
    : /\bcam\b|v\d|video|-v\b/i.test(label) ? 'v' : 'a';
  const g = cls === 'v' ? '■' : cls === 's' ? '⬢' : '♪';
  return `<span class="rv-dot ${cls}">${g}</span>`;
}

const prodOf = (tw: HTMLElement): string => {
  const row = tw.closest('.program-row');
  return tw.dataset.prodName || (row?.querySelector<HTMLElement>('.program-title')?.innerText.trim() ?? 'UNKNOWN');
};
const twistNameOf = (tw: HTMLElement): string => tw.querySelector<HTMLElement>('.twist-title')?.innerText.trim() ?? 'TWIST';

export function gatherReceivers(): Map<string, Map<string, HTMLElement>> {
  const m = new Map<string, Map<string, HTMLElement>>();
  document.querySelectorAll<HTMLElement>('.twist-container').forEach((tw) => {
    const prod = prodOf(tw), tname = twistNameOf(tw);
    if (!m.has(prod)) m.set(prod, new Map());
    m.get(prod)!.set(tname, tw);
  });
  return m;
}

export function gatherLinks(): { cross: Set<string>; cS: Set<string>; cR: Set<string> } {
  const cross = new Set<string>(), cS = new Set<string>(), cR = new Set<string>();
  document.querySelectorAll<HTMLElement>('.twist-container').forEach((tw) => {
    const dz = tw.querySelector<HTMLElement>('.drop-zone'); if (!dz) return;
    const prod = prodOf(tw), tname = twistNameOf(tw);
    dz.querySelectorAll<HTMLElement>(':scope > .signal-node').forEach((node) => {
      const feeds = node.classList.contains('dropped-group')
        ? [...node.querySelectorAll<HTMLElement>('.dropped-group-children .signal-node')] : [node];
      feeds.forEach((f) => {
        const label = firstLine(f); if (!label) return;
        const origin = f.dataset.origin || node.dataset.origin || label;
        cross.add([origin, label, prod, tname].join(SEP));
        cS.add(origin + SEP + label); cR.add(prod + SEP + tname);
      });
    });
  });
  return { cross, cS, cR };
}

/** Open every source folder not yet loaded, wait for its leaves, repeat for the
 *  subfolders that revealed — until none is left (ROAD-3481: no fixed sleeps). */
export async function loadAllSources(): Promise<void> {
  for (let depth = 0; depth < 32; depth++) {
    const lazy = document.querySelectorAll<HTMLElement>('.media-group-content[data-lazy="pending"]');
    lazy.forEach((c) => (c.previousElementSibling as HTMLElement | null)?.click());
    await loadsSettled('sources');
    if (!lazy.length) break;
  }
}
/** Activate every destination tab and wait for each pane to render. */
export async function loadAllDest(): Promise<void> {
  loadAllDestinations();
  await loadsSettled('destinations');
}

/** Open only the source folders whose origin chain is in `keys` (ancestorKeys of
 *  the origins an import names), depth by depth (ROAD-3483). */
export async function loadSourcesFor(keys: Set<string>): Promise<void> {
  for (let depth = 0; depth < 32; depth++) {
    const lazy = [...document.querySelectorAll<HTMLElement>('.media-group-content[data-lazy="pending"]')]
      .filter((c) => touches(keys, c.dataset['chain'] ?? ''));
    lazy.forEach((c) => (c.previousElementSibling as HTMLElement | null)?.click());
    await loadsSettled('sources');
    if (!lazy.length) break;
  }
}
/** Activate only the destination tabs under a parent in `keys` (ancestorKeys of the
 *  rooms an import names); a tab with no parent (Talent) titles itself, so it opens. */
export async function loadDestFor(keys: Set<string>): Promise<void> {
  document.querySelectorAll<HTMLElement>('.lcars-tab').forEach((t) => {
    const parent = t.dataset['parentName'];
    if (parent && !touches(keys, parent)) return;
    try { t.click(); } catch { /* ignore */ }
  });
  await loadsSettled('destinations');
}

export const splitParent = (s: string): [string, string] => {
  const i = s.lastIndexOf(' — ');
  return i >= 0 ? [s.slice(0, i), s.slice(i + 3)] : ['', s];
};
