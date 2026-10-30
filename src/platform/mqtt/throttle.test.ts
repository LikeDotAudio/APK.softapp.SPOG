// src/platform/mqtt/throttle.test — per-topic leading/trailing coalescing, bounded
// slot map, presence-flagged pending, flush-on-dispose and send-error resilience.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeThrottler } from './throttle.js';

describe('makeThrottler', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('sends the leading value, coalesces a burst and lands the final value on the trailing edge', () => {
    const sent: unknown[] = [];
    const t = makeThrottler((_topic, p) => sent.push(p), 50);
    for (let i = 1; i <= 10; i++) t.push('a', i);   // a 60 Hz drag inside one window
    expect(sent).toEqual([1]);
    vi.advanceTimersByTime(50);
    expect(sent).toEqual([1, 10]);
    vi.advanceTimersByTime(500);
    expect(sent).toEqual([1, 10]);                   // nothing re-sent once idle
  });

  it('keeps topics independent', () => {
    const sent: string[] = [];
    const t = makeThrottler((topic, p) => sent.push(`${topic}=${String(p)}`), 50);
    t.push('a', 1); t.push('b', 1); t.push('a', 2);
    vi.advanceTimersByTime(50);
    expect(sent).toEqual(['a=1', 'b=1', 'a=2']);
  });

  it('forgets idle topics so the slot map is bounded by activity, not history', () => {
    const t = makeThrottler(() => {}, 50);
    for (let i = 0; i < 100; i++) t.push(`p/${i}`, i);
    expect(t.size()).toBe(100);
    vi.advanceTimersByTime(50);
    expect(t.size()).toBe(0);
  });

  it('treats null / undefined as real values, not "nothing pending"', () => {
    const sent: unknown[] = [];
    const t = makeThrottler((_topic, p) => sent.push(p), 50);
    t.push('a', 1); t.push('a', null);
    vi.advanceTimersByTime(50);
    expect(sent).toEqual([1, null]);
  });

  it('dispose flushes the pending trailing value instead of dropping it', () => {
    const sent: unknown[] = [];
    const t = makeThrottler((_topic, p) => sent.push(p), 50);
    t.push('a', 1); t.push('a', 2); t.push('a', 3);
    t.dispose();
    expect(sent).toEqual([1, 3]);
    vi.advanceTimersByTime(500);
    expect(sent).toEqual([1, 3]);                    // no stray timer after dispose
    expect(t.size()).toBe(0);
  });

  it('keeps going when a trailing send throws', () => {
    const sent: unknown[] = [];
    const t = makeThrottler((topic, p) => { if (p === 'boom') throw new Error('x'); sent.push(`${topic}=${String(p)}`); }, 50);
    t.push('a', 1); t.push('a', 'boom'); t.push('b', 1); t.push('b', 2);
    expect(() => vi.advanceTimersByTime(50)).not.toThrow();
    expect(sent).toEqual(['a=1', 'b=1', 'b=2']);
    t.push('a', 4);                                  // a's window still works
    vi.advanceTimersByTime(100);
    expect(sent).toContain('a=4');
  });
});
