// src/platform/routes-store — the draft OVERLAY that makes the read-only Routes
// tree editable (audit: Documentation/Audit /Routes-Editor-Single-Pane-Audit.md §7).
//
// The console reads every room / production / person as static JSON through
// discovery.fetchJSON. There is no backend to write to, so an authoring edit is
// kept as a per-URL DRAFT in localStorage — persistence ladder L1. fetchJSON
// consults this store FIRST, so a drafted file re-renders from the edit and
// survives reload, with FULL PARITY when no draft exists (an un-edited file reads
// byte-for-byte as before — nothing overlays it). Export (L2) hands the drafts
// back out as plain JSON to be committed into Routes/** or fed to a File-System /
// server sink later (L3/L4) — a swap-the-sink change, not a rewrite.
//
// No filesystem, no globals, no import of discovery (keeps the dependency one-way).

const PREFIX = 'twist:routes:draft:';

type Listener = () => void;
const listeners = new Set<Listener>();

/** localStorage, but null under vitest/node or a locked-down browser. */
function ls(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}
const keyFor = (url: string): string => PREFIX + url;

/* THE LIVE LAYER. What the Discovery Engine says is on the network right now
   (ui/console/discovered.ts) is laid over Routes/** the same way a draft is —
   but in MEMORY ONLY. A draft is somebody's edit and must survive a reload; a
   discovered device is a claim about NOW, and one that died must not come back
   from localStorage. Live wins over a draft for the same URL; it never touches
   storage and never marks the console dirty. */
const live = new Map<string, unknown>();

/** Replace the whole live layer (an empty map clears it). */
export function setLive(entries: Map<string, unknown>): void {
  live.clear();
  for (const [url, data] of entries) live.set(url, data);
}

/** The stored draft only — the live layer ignored. For whoever builds that layer. */
export function getStoredDraft<T = unknown>(url: string): T | null {
  const store = ls(); if (!store) return null;
  const raw = store.getItem(keyFor(url));
  if (raw == null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

/** The draft override for a URL, or null if the file is un-edited (reads from disk). */
export function getDraft<T = unknown>(url: string): T | null {
  if (live.has(url)) return structuredClone(live.get(url)) as T;
  const store = ls(); if (!store) return null;
  const raw = store.getItem(keyFor(url));
  if (raw == null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export function hasDraft(url: string): boolean {
  const store = ls(); return !!store && store.getItem(keyFor(url)) != null;
}

/** Save (or replace) the draft for a URL and notify listeners (the dirty badge). */
export function putDraft(url: string, data: unknown): void {
  putDrafts([[url, data]]);
}

/** Save many drafts and notify ONCE. An import writes thousands, and the dirty badge
 *  recounts every stored key per notification — per-write emits made a 2,500-device
 *  import O(n²) and held the main thread ~0.3–1 s (ROAD-3474). Returns how many landed;
 *  stops at the first failed write (quota). */
export function putDrafts(entries: Iterable<[string, unknown]>): number {
  const store = ls(); if (!store) return 0;
  let n = 0;
  for (const [url, data] of entries) {
    try { store.setItem(keyFor(url), JSON.stringify(data)); n++; }
    catch (e) { console.warn('routes-store: save failed', e); break; }
  }
  if (n) emit();
  return n;
}

/** Drop one URL's draft — revert that file to what's on disk. */
export function clearDraft(url: string): void {
  const store = ls(); if (!store) return;
  store.removeItem(keyFor(url));
  emit();
}

/** Every URL that currently carries a draft. */
export function draftUrls(): string[] {
  const store = ls(); if (!store) return [];
  const out: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
  }
  return out;
}

export const draftCount = (): number => draftUrls().length;

/** Drop ALL drafts — revert the whole tree to disk. */
export function clearAllDrafts(): void {
  const store = ls(); if (!store) return;
  draftUrls().forEach((u) => store.removeItem(keyFor(u)));
  emit();
}

/** L2 export — the drafts as one { url: data } blob, for committing back to Routes/**. */
export function exportDrafts(): string {
  const out: Record<string, unknown> = {};
  draftUrls().forEach((u) => { const d = getDraft(u); if (d != null) out[u] = d; });
  return JSON.stringify(out, null, 2);
}

/** L2 import — merge an exported blob back into the store; returns how many landed. */
export function importDrafts(json: string): number {
  let obj: Record<string, unknown>;
  try { obj = JSON.parse(json) as Record<string, unknown>; } catch { return 0; }
  let n = 0;
  for (const [url, data] of Object.entries(obj)) { putDraft(url, data); n++; }
  return n;
}

/** Subscribe to draft add/change/remove (returns an unsubscribe). */
export function onDraftsChange(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function emit(): void {
  listeners.forEach((l) => { try { l(); } catch { /* a listener must not break the store */ } });
}
