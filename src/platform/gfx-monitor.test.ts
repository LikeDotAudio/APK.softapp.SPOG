// src/platform/gfx-monitor.test — the switcher → multiviewer on-air channel.

import { describe, it, expect } from 'vitest';
import { announceOnAirGraphics, onAirGraphics, watchOnAirGraphics, createGfxMonitor, type OnAirGraphic } from './gfx-monitor.js';
import { topicMatches } from './mqtt/topics.js';
import type { TwistBus } from './mqtt/types.js';

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

/** A retained in-memory broker: each session drops its own echoes (like client.ts)
 *  and replays every retained topic to a late subscriber. */
function broker() {
  const retained = new Map<string, unknown>();
  const subs = new Set<{ origin: string; filter: string; cb: (t: string, p: unknown) => void }>();
  const pubs: string[] = [];
  const session = (origin: string): TwistBus => ({
    ready: Promise.resolve(), sessionId: `${origin}:TWIST:1`,
    status: () => ({ enabled: true, connected: true }),
    publishConfig: () => {}, publishValue: () => {},
    publishRaw: (topic: string, payload: unknown) => {
      pubs.push(topic);
      retained.set(topic, payload);
      for (const s of subs) if (s.origin !== origin && topicMatches(s.filter, topic)) s.cb(topic, payload);
    },
    subscribe: (filter: string, cb: (t: string, p: unknown) => void) => {
      const s = { origin, filter, cb };
      subs.add(s);
      for (const [t, p] of retained) if (topicMatches(filter, t)) cb(t, p);
      return () => subs.delete(s);
    },
    dispose: () => {},
  });
  return { session, pubs };
}

describe('gfx-monitor on the bus (ROAD-3447)', () => {
  it('two sessions in different productions see each other\'s on-air set', () => {
    const b = broker();
    const seatA = createGfxMonitor(() => b.session('aaaa0001'));   // a switcher in PROD 7
    const seatB = createGfxMonitor(() => b.session('bbbb0002'));   // a switcher in PROD 9
    const aSeesB: OnAirGraphic[][] = [], bSeesA: OnAirGraphic[][] = [];
    seatA.watch('prod-9', (l) => aSeesB.push(l));
    seatB.watch('prod-7', (l) => bSeesA.push(l));
    seatA.announce('prod-7', [g('SW 19', 'DSK 1')]);
    seatB.announce('prod-9', [g('SW 20', 'DSK 2')]);
    expect(bSeesA).toEqual([[g('SW 19', 'DSK 1')]]);
    expect(aSeesB).toEqual([[g('SW 20', 'DSK 2')]]);
    expect(seatB.current('prod-7')).toEqual([g('SW 19', 'DSK 1')]);
    expect(b.pubs).toEqual(['productions/prod-7/gfx/on-air', 'productions/prod-9/gfx/on-air']);
  });

  it('a wall opened later replays the retained set; an unchanged set is not republished', () => {
    const b = broker();
    const mixer = createGfxMonitor(() => b.session('aaaa0001'));
    mixer.announce('prod-7', [g('SW 19', 'DSK 1')]);
    mixer.announce('prod-7', [g('SW 19', 'DSK 1')]);
    expect(b.pubs).toHaveLength(1);
    const wall = createGfxMonitor(() => b.session('cccc0003'));
    const seen: OnAirGraphic[][] = [];
    wall.watch('prod-7', (l) => seen.push(l));
    expect(seen).toEqual([[g('SW 19', 'DSK 1')]]);
    mixer.announce('prod-7', []);
    expect(seen).toEqual([[g('SW 19', 'DSK 1')], []]);
  });

  it('a bus bound after the switcher announced publishes what it had', () => {
    const b = broker();
    let bus: TwistBus | null = null;
    const mixer = createGfxMonitor(() => bus);
    mixer.announce('prod-7', [g('SW 19', 'DSK 1')]);
    expect(b.pubs).toEqual([]);
    bus = b.session('aaaa0001');
    mixer.rebind();
    expect(b.pubs).toEqual(['productions/prod-7/gfx/on-air']);
  });

  it('ignores a payload that is not an on-air envelope for that production', () => {
    const b = broker();
    const wall = createGfxMonitor(() => b.session('cccc0003'));
    const seen: OnAirGraphic[][] = [];
    wall.watch('prod-7', (l) => seen.push(l));
    b.session('dddd0004').publishRaw('productions/prod-7/gfx/on-air', { v: 1, production: 'prod-8', list: [g('X')] });
    b.session('dddd0004').publishRaw('productions/prod-7/gfx/on-air', 'garbage');
    expect(seen).toEqual([]);
  });
});
