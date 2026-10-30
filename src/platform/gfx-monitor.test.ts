// src/platform/gfx-monitor.test — the switcher → multiviewer on-air channel.

import { describe, it, expect } from 'vitest';
import { announceOnAirGraphics, onAirGraphics, watchOnAirGraphics, type OnAirGraphic } from './gfx-monitor.js';

const g = (label: string, ...via: string[]): OnAirGraphic => ({ label, via });

describe('gfx-monitor', () => {
  it('delivers announcements to watchers of the same production only', () => {
    const a: OnAirGraphic[][] = [];
    const b: OnAirGraphic[][] = [];
    const offA = watchOnAirGraphics('prod-a', (l) => a.push(l));
    const offB = watchOnAirGraphics('prod-b', (l) => b.push(l));
    announceOnAirGraphics('prod-a', [g('SW 19', 'DSK 1')]);
    expect(a).toEqual([[g('SW 19', 'DSK 1')]]);
    expect(b).toEqual([]);
    expect(onAirGraphics('prod-a')).toEqual([g('SW 19', 'DSK 1')]);
    offA(); offB();
  });

  it('does not re-emit an unchanged set, and stops after unsubscribe', () => {
    const seen: OnAirGraphic[][] = [];
    const off = watchOnAirGraphics('prod-c', (l) => seen.push(l));
    announceOnAirGraphics('prod-c', [g('SW 20', 'DSK 2')]);
    announceOnAirGraphics('prod-c', [g('SW 20', 'DSK 2')]);
    expect(seen).toHaveLength(1);
    off();
    announceOnAirGraphics('prod-c', []);
    expect(seen).toHaveLength(1);
    expect(onAirGraphics('prod-c')).toEqual([]);
  });

  it('keeps going when a watcher throws', () => {
    const seen: OnAirGraphic[][] = [];
    const offBad = watchOnAirGraphics('prod-d', () => { throw new Error('boom'); });
    const offGood = watchOnAirGraphics('prod-d', (l) => seen.push(l));
    expect(() => announceOnAirGraphics('prod-d', [g('SW 21', 'DSK 3')])).not.toThrow();
    expect(seen).toEqual([[g('SW 21', 'DSK 3')]]);
    offBad(); offGood();
  });

  it('drops malformed entries instead of failing', () => {
    announceOnAirGraphics('prod-e', [{ label: '', via: [] }, null as unknown as OnAirGraphic, g('SW 22', 'M/E 1 PGM')]);
    expect(onAirGraphics('prod-e')).toEqual([g('SW 22', 'M/E 1 PGM')]);
  });

  it('reads an empty set for a production nothing announced (no storage in node)', () => {
    expect(onAirGraphics('never')).toEqual([]);
  });
});
