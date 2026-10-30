// src/ui/console/captains-log-narrate — turns drop-zone DOM mutations into
// narrated log entries and reverses them ("Reverse Course" — live refs here,
// label-only entries re-derived by captains-log-reroute). Owns the
// MutationObserver + its `paused` flag; reads/writes the shared state through
// the state module and fans entries out via persist's emitLog.
import { updateTwistVisuals } from './helix.js';
import { refreshCrosspoints } from './matrix-crosspoints.js';
import { publishCrosspoints } from './matrix-place.js';
import { operator, role } from '../../platform/auth.js';
import { emitLog } from './captains-log-persist.js';
import { render } from './captains-log-view.js';
import { narratives, selected, ensureNarrative, nextEid, entKey, reversible, selfOrigin, type Entry, type Removed } from './captains-log-state.js';
import { findTwist, groupBase, reroute } from './captains-log-reroute.js';

let observer: MutationObserver | null = null, paused = false;

export function pauseNarrator(): void { paused = true; }
export function resumeNarrator(): void { paused = false; observer?.takeRecords(); }

const utc = (ts: number): string => new Date(ts).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '') + ' UTC';

/** Sign a log line with the operator's name (asked at login) when one is set. */
export const signed = (text: string): string => {
  const who = operator();
  return who ? `${text} · by ${who}` : text;
};

function nodeLabel(n: Element | null): string {
  if (!n || n.nodeType !== 1) return '';
  const el = n as HTMLElement;
  if (el.classList.contains('dropped-group')) {
    // The header is [parent caption span] + "NAME ×k" text: label from the text only,
    // so it reads `NAME ×k` once and Reverse Course can re-find NAME (captains-log-reroute).
    const h = el.querySelector<HTMLElement>('.dropped-group-header');
    const k = el.querySelectorAll('.dropped-group-children .signal-node').length;
    const text = h ? [...h.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent ?? '').join('') : '';
    const raw = (text || el.dataset.origin || 'group').trim().split('\n')[0] || 'group';
    const base = groupBase(raw) ?? raw;
    return k ? `${base} ×${k}` : base;
  }
  return (el.innerText || '').trim().split('\n')[0] ?? '';
}
const labelsOf = (nodes: Element[]): string => nodes.map(nodeLabel).filter(Boolean).join(', ') || 'nothing';

function destInfo(twist: HTMLElement): { dest: string; prod: string } {
  const name = twist.querySelector<HTMLElement>('.twist-title')?.innerText.trim() ?? 'destination';
  const row = twist.closest('.program-row');
  const prod = twist.dataset.prodName || (row?.querySelector<HTMLElement>('.program-title')?.innerText.trim() ?? '');
  return { dest: name, prod };
}

/** Build the narration sentence from LABEL strings (audit F3): the log wire format
 *  no longer ships this English text — each console rebuilds it from the structured
 *  {dest, prod, added[], removed[]} fields it already receives. Kept deterministic so
 *  every seat renders an identical line. */
export function narrationFromLabels(dest: string, prod: string, removed: string[], added: string[], ts: number): string {
  const head = `The destination of ${dest}${prod ? ` (${prod})` : ''}`;
  const t = utc(ts);
  const rl = removed.filter(Boolean).join(', ') || 'nothing';
  const al = added.filter(Boolean).join(', ') || 'nothing';
  if (removed.length && added.length) return `${head} that previously contained the ${rl} was replaced with the ${al} by the user at ${t}.`;
  if (added.length) return `${head}, previously empty, received the ${al} by the user at ${t}.`;
  return `${head} that previously contained the ${rl} was cleared by the user at ${t}.`;
}

const narrate = (dest: string, prod: string, removed: Element[], added: Element[], ts: number): string =>
  narrationFromLabels(dest, prod, removed.map(nodeLabel), added.map(nodeLabel), ts);

export function onMutations(records: MutationRecord[]): void {
  if (paused) return;
  const byTwist = new Map<HTMLElement, { added: HTMLElement[]; removed: Removed[] }>();
  records.forEach((rec) => {
    const target = rec.target;
    if (!(target instanceof Element)) return;
    const inDrop = target.classList.contains('drop-zone') || target.classList.contains('dropped-group-children') || target.closest('.drop-zone');
    if (!inDrop) return;
    const twist = target.closest<HTMLElement>('.twist-container'); if (!twist) return;
    if (!byTwist.has(twist)) byTwist.set(twist, { added: [], removed: [] });
    const ch = byTwist.get(twist)!;
    rec.addedNodes.forEach((n) => { if (n.nodeType === 1 && (n as HTMLElement).classList.contains('signal-node')) ch.added.push(n as HTMLElement); });
    rec.removedNodes.forEach((n) => { if (n.nodeType === 1 && (n as HTMLElement).classList.contains('signal-node')) ch.removed.push({ node: n as HTMLElement, parent: target, next: rec.nextSibling }); });
  });
  if (!byTwist.size) return;
  const ts = Date.now();
  const nar = ensureNarrative();
  let changed = false;
  byTwist.forEach((ch, twist) => {
    if (!ch.added.length && !ch.removed.length) return;
    const { dest, prod } = destInfo(twist);
    const entry: Entry = { id: nextEid(), ts, twist, dest, prod, added: ch.added.slice(), removed: ch.removed.slice(), text: signed(narrate(dest, prod, ch.removed.map((r) => r.node), ch.added, ts)), reversed: false, role: role().name };
    nar.entries.push(entry);
    emitLog({ voyage: nar.id, entry: entry.id, ts, dest, prod, added: ch.added.map(nodeLabel).filter(Boolean), removed: ch.removed.map((r) => nodeLabel(r.node)).filter(Boolean), text: entry.text, reversed: false, by: operator() || undefined, role: role().name });
    changed = true;
  });
  if (changed) render();
}

/** Reverse one entry; false when it couldn't be (left un-reversed, untouched). */
function reverseEntry(entry: Entry): boolean {
  if (!reversible(entry)) return false;
  const who = operator();
  const when = Date.now();
  // A foreign seat's entry keeps ITS origin, so the reversal flags the right record.
  const origin = entry.origin && entry.origin !== selfOrigin() ? entry.origin : undefined;
  const voyage = narratives.find((n) => n.entries.includes(entry))?.id ?? 0;
  const done = (added: string[], removed: string[]): true => {
    entry.reversed = true; entry.reversedBy = who || undefined; entry.reversedTs = when;
    emitLog({ voyage, entry: entry.id, ts: when, dest: entry.dest, prod: entry.prod, added, removed, text: `Course reversed: ${entry.text}`, reversed: true, reversedBy: who || undefined, reversedTs: when, origin });
    return true;
  };
  // Semantic (layout) entry: run its undo callback instead of restoring nodes.
  if (entry.undo) {
    try { entry.undo(); } catch { /* a failed undo must not wedge the log */ }
    return done([], []);
  }
  // Restored / networked routing entry: no live nodes — re-derive from its labels.
  if (!entry.twist && entry.labels) {
    const twist = findTwist(entry.dest, entry.prod, destInfo);
    if (!twist || !reroute(twist, entry.labels.added, entry.labels.removed, nodeLabel)) return false;
    return done(entry.labels.added, entry.labels.removed);
  }
  entry.added.forEach((n) => { if (n.parentNode) n.parentNode.removeChild(n); });
  entry.removed.forEach(({ node, parent, next }) => {
    if (parent && (parent as Node).isConnected) {
      if (next && next.parentNode === parent) parent.insertBefore(node, next);
      else parent.appendChild(node);
    } else {
      entry.twist?.querySelector<HTMLElement>('.drop-zone')?.appendChild(node);
    }
  });
  if (entry.twist) { 
    try { 
      updateTwistVisuals(entry.twist); 
      const dropZone = entry.twist.querySelector<HTMLElement>('.drop-zone');
      if (dropZone) refreshCrosspoints(dropZone);
      publishCrosspoints(entry.twist);
    } catch { /* ignore */ } 
  }
  return done(entry.added.map(nodeLabel).filter(Boolean), entry.removed.map((r) => nodeLabel(r.node)).filter(Boolean));
}

/** Reverse every selected entry, newest first. One that fails (or throws) is
 *  skipped and left selected so the rest still reverse; returns those skipped. */
export function reverseSelected(): Entry[] {
  const all: Entry[] = [];
  narratives.forEach((n) => n.entries.forEach((e) => { if (selected.has(entKey(e)) && !e.reversed) all.push(e); }));
  if (!all.length) return [];
  all.sort((a, b) => b.ts - a.ts || b.id - a.id);
  const failed: Entry[] = [];
  paused = true;
  try {
    for (const e of all) {
      let ok = false;
      try { ok = reverseEntry(e); } catch { /* one bad entry must not stop the rest */ }
      if (ok) selected.delete(entKey(e)); else failed.push(e);
    }
  } finally {
    observer?.takeRecords();
    paused = false;
  }
  render();
  return failed;
}

/** Wire the MutationObserver onto the destinations root (called once at init). */
export function observeRoot(root: Node): void {
  observer = new MutationObserver(onMutations);
  observer.observe(root, { childList: true, subtree: true });
}
