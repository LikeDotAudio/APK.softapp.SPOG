// ROAD-3481 — loadAllSources / loadAllDest wait for the lazy loads they start,
// not a guessed sleep: loadsSettled resolves exactly when the last tracked load
// (including one a load starts while running) is done, and a failure counts as done.
import { describe, it, expect } from 'vitest';
import { trackLoad, loadsSettled, loadsInFlight } from './pending-loads.js';

const later = <T>(ms: number, v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

describe('pending-loads', () => {
  it('resolves at once when nothing is in flight', async () => {
    await loadsSettled('sources');
    expect(loadsInFlight('sources')).toBe(0);
  });

  it('waits for nested loads and for failures, per kind', async () => {
    const order: string[] = [];
    void trackLoad('sources', later(5, 'a').then(() => {
      order.push('a');
      void trackLoad('sources', later(5, 'b').then(() => { order.push('b'); }));   // started by a load
    }));
    void trackLoad('sources', Promise.reject(new Error('404')).catch(() => { order.push('x'); throw new Error('again'); })).catch(() => {});
    const dest = trackLoad('destinations', later(50, 'd'));
    expect(loadsInFlight('sources')).toBe(2);
    await loadsSettled('sources');
    expect(order.sort()).toEqual(['a', 'b', 'x']);
    expect(loadsInFlight('sources')).toBe(0);
    expect(loadsInFlight('destinations')).toBe(1);             // another kind is not waited on
    await dest;
  });
});
