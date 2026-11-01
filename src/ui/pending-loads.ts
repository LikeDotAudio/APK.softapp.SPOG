// src/ui/pending-loads — the lazy console loads anyone may need to wait for
// (ROAD-3481). A source folder renders when its header is clicked and a
// destination tab when it is first activated; both fetch first, so a caller that
// clicks them (the 1990s view's load-everything, an editor deep link) used to
// sleep a guessed 220/600/700 ms. Each lazy load now registers its promise here,
// and `loadsSettled` resolves when every load of that kind — including any a
// load starts while it runs — has finished.

export type LoadKind = 'sources' | 'destinations';

const pending: Record<LoadKind, Set<Promise<unknown>>> = { sources: new Set(), destinations: new Set() };

/** Register a lazy load; returns the same promise. */
export function trackLoad<T>(kind: LoadKind, p: Promise<T>): Promise<T> {
  const set = pending[kind];
  set.add(p);
  const done = (): void => { set.delete(p); };
  p.then(done, done);
  return p;
}

/** How many loads of this kind are in flight now. */
export const loadsInFlight = (kind: LoadKind): number => pending[kind].size;

/** Resolve once no load of this kind is in flight (failures count as finished). */
export async function loadsSettled(kind: LoadKind): Promise<void> {
  const set = pending[kind];
  while (set.size) await Promise.allSettled([...set]);
}
