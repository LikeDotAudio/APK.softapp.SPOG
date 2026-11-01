// src/ui/console/lens-gather.test — a routed clone finds the source feed it was cloned from.
import { describe, it, expect } from 'vitest';
import { resolveSourceId } from './lens-gather.js';

describe('resolveSourceId', () => {
  const known = new Set(['pool-desk-mic-1', 'pool-cam-01']);
  const has = (id: string): boolean => known.has(id);
  it('strips the clone suffix (which itself holds a dash) back to the source id', () => {
    expect(resolveSourceId('pool-desk-mic-1-3-k2j1', has)).toBe('pool-desk-mic-1');
  });
  it('a sub-stream clone resolves to its multiplex box', () => {
    expect(resolveSourceId('pool-cam-01-A2-0-zz9', has)).toBe('pool-cam-01');
  });
  it('an unknown clone (a network-hydrated stand-in) resolves to nothing', () => {
    expect(resolveSourceId('net-4-abc', has)).toBeNull();
  });
});
