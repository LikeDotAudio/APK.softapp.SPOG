// src/ui/console/captains-log-persist — IndexedDB persistence + the external
// listener bus for the Captain's Log. persistEntry writes the audit trail (§8
// W2); hydrateLog restores it (routing rows keep their source labels, so Reverse
// Course can re-derive them); emitLog fans every entry out to subscribers (the
// MQTT bridge) after persisting it.
import { idbPut, idbGetAll } from '../../platform/store-idb.js';
import { narratives, setCurrent, raiseNid, raiseEid, selfOrigin, narByOriginVoyage, type StoredEntry, type LogEntryEvent } from './captains-log-state.js';
import { render } from './captains-log-view.js';

let hydrating = false;
export function persistEntry(e: LogEntryEvent, origin?: string): void {
  if (hydrating) return;
  const org = origin ?? e.origin ?? selfOrigin();
  const key = `${org}:${e.voyage}:${e.entry}`;
  const voyTitle = narByOriginVoyage(org, e.voyage)?.title ?? `Voyage ${e.voyage}`;
  if (e.reversed) {
    // A reversal updates the ORIGINAL record's flag; the "Course reversed" text
    // is session commentary, not a new history row.
    void idbGetAll<StoredEntry>('log').then((all) => {
      const rec = all.find((r) => r.k === key);
      if (rec) void idbPut('log', { ...rec, reversed: true, reversedBy: e.reversedBy, reversedTs: e.reversedTs });
    });
    return;
  }
  void idbPut('log', { k: key, origin: org, voyage: e.voyage, voyTitle, entry: e.entry, ts: e.ts, dest: e.dest, prod: e.prod, text: e.text, reversed: e.reversed, by: e.by, role: e.role, added: e.added, removed: e.removed });
}

/** Restore one IndexedDB row into its narrative. Throws on a malformed row. */
function restoreRow(r: StoredEntry): void {
  const org = r.origin ?? selfOrigin();   // legacy rows predate origins → treat as ours
  let nar = narByOriginVoyage(org, r.voyage);
  if (!nar) {
    const mine = org === selfOrigin();
    nar = { id: r.voyage, origin: org, title: mine ? r.voyTitle : `${r.voyTitle} · ${org.slice(0, 4)}`, entries: [] };
    narratives.push(nar);
  }
  const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  nar.entries.push({ id: r.entry, ts: r.ts, twist: null, dest: r.dest, prod: r.prod, added: [], removed: [], text: r.text, reversed: r.reversed, reversedBy: r.reversedBy, reversedTs: r.reversedTs, restored: true, origin: org, role: r.role, labels: r.added || r.removed ? { added: list(r.added), removed: list(r.removed) } : undefined });
  if (org === selfOrigin()) { raiseNid(r.voyage); raiseEid(r.entry); }
}

/** Restore the persisted log. Each row is guarded on its own: a malformed row is
 *  skipped (and counted in one warning), never the end of the restore. Returns the
 *  number of rows restored. */
export async function hydrateLog(): Promise<number> {
  const all = await idbGetAll<StoredEntry>('log');
  if (!all.length) return 0;
  const rows = all.filter((r): r is StoredEntry => !!r && typeof r === 'object'
    && Number.isFinite(r.ts) && Number.isFinite(r.entry) && Number.isFinite(r.voyage));
  let skipped = all.length - rows.length;
  let restored = 0;
  hydrating = true;
  try {
    rows.sort((a, b) => a.ts - b.ts || a.entry - b.entry);
    for (const r of rows) {
      try { restoreRow(r); restored++; } catch { skipped++; }
    }
    if (skipped) console.warn(`[captains-log] skipped ${skipped} malformed log row(s) on restore`);
    // Chronological across the merged log.
    narratives.sort((a, b) => (a.entries[0]?.ts ?? 0) - (b.entries[0]?.ts ?? 0) || a.id - b.id);
    // New work lands in a NEW voyage, not appended to a dead session's narrative.
    setCurrent(null);
    render();
  } finally { hydrating = false; }
  return restored;
}

const logListeners = new Set<(e: LogEntryEvent) => void>();
/** Subscribe to every Captain's Log entry (and course reversals). Returns an unsubscribe. */
export function onLogEntry(cb: (e: LogEntryEvent) => void): () => void { logListeners.add(cb); return () => logListeners.delete(cb); }
export function emitLog(e: LogEntryEvent): void {
  persistEntry(e);
  for (const l of logListeners) { try { l(e); } catch { /* a bad listener must not break logging */ } }
}
