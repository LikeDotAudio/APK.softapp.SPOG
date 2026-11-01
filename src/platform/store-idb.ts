// src/platform/store-idb — a tiny promise wrapper over IndexedDB for the
// GROWING stores (audit §3.1/§8 W2): append-only production memory (Captain's
// Log, chat) that doesn't belong in the 5 MB synchronous localStorage. Every
// call degrades to a no-op/empty when IndexedDB is unavailable — persistence
// is memory, never a dependency. v2 adds the import pyramid's content-addressed
// layout chunks and per-project skeletons (ROAD-3474, platform/pyramid/chunk-cache).

const DB = 'spog';
const VERSION = 2;
export type StoreName = 'log' | 'chat' | 'chunks' | 'skeletons';
const STORES: StoreName[] = ['log', 'chat', 'chunks', 'skeletons'];

let dbPromise: Promise<IDBDatabase | null> | null = null;

function db(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        for (const s of STORES) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'k' });
      };
      req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbPromise;
}

/** Put one record (must carry its own `k` key). Fire-and-forget safe. */
export async function idbPut(store: StoreName, value: { k: string } & Record<string, unknown>): Promise<void> {
  const d = await db();
  if (!d) return;
  try { d.transaction(store, 'readwrite').objectStore(store).put(value); } catch { /* quota / closing */ }
}

/** Is IndexedDB really there (opened)? False under node, in a locked-down browser, or blocked. */
export async function idbAvailable(): Promise<boolean> {
  return (await db()) != null;
}

/** One record by key, or undefined (also when IndexedDB is unavailable). */
export async function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const d = await db();
  if (!d) return undefined;
  return new Promise((resolve) => {
    try {
      const req = d.transaction(store, 'readonly').objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => resolve(undefined);
    } catch { resolve(undefined); }
  });
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const d = await db();
  if (!d) return [];
  return new Promise((resolve) => {
    try {
      const req = d.transaction(store, 'readonly').objectStore(store).getAll();
      req.onsuccess = () => resolve((req.result ?? []) as T[]);
      req.onerror = () => resolve([]);
    } catch { resolve([]); }
  });
}

export async function idbDelete(store: StoreName, key: string): Promise<void> {
  const d = await db();
  if (!d) return;
  try { d.transaction(store, 'readwrite').objectStore(store).delete(key); } catch { /* ignore */ }
}

export async function idbClear(store: StoreName): Promise<void> {
  const d = await db();
  if (!d) return;
  try { d.transaction(store, 'readwrite').objectStore(store).clear(); } catch { /* ignore */ }
}
