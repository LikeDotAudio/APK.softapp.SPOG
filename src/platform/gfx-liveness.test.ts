// src/platform/gfx-liveness.test — a retained on-air set lives only as long as the switcher
// that announced it (ROAD-3455: unreachable is dead, trust decays).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGfxMonitor, type OnAirGraphic } from './gfx-monitor.js';
import { BEAT_STALE_MS, REFRESH_MS, TRUST_MS } from './gfx-liveness.js';
import type { TwistBus } from './mqtt/types.js';
import { broker } from './gfx-monitor.test-broker.js';

const g = (label: string, ...via: string[]): OnAirGraphic => ({ label, via });
const on = (bus: TwistBus) => createGfxMonitor(() => bus);
const TOPIC = 'productions/prod-7/gfx/on-air';

describe('gfx-monitor liveness (ROAD-3455)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-31T12:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); });

  it('the set clears on the wall the moment the switcher\'s Last Will lands', () => {
    const b = broker();
    const mixer = on(b.session('aaaa0001'));
    const wall = on(b.session('cccc0003'));
    const seen: OnAirGraphic[][] = [];
    wall.watch('prod-7', (l) => seen.push(l));
    mixer.announce('prod-7', [g('SW 19', 'DSK 1')]);
    expect(wall.current('prod-7')).toEqual([g('SW 19', 'DSK 1')]);
    b.die('aaaa0001');                                   // the broker publishes the will
    expect(seen).toEqual([[g('SW 19', 'DSK 1')], []]);
    expect(wall.current('prod-7')).toEqual([]);
  });

  it('a wall opened after the switcher died reads the retained set as empty', () => {
    const b = broker();
    on(b.session('aaaa0001')).announce('prod-7', [g('SW 19', 'DSK 1')]);
    b.die('aaaa0001');
    expect(b.retained.has(TOPIC)).toBe(true);           // the broker still holds it…
    const wall = on(b.session('cccc0003'));
    const seen: OnAirGraphic[][] = [];
    wall.watch('prod-7', (l) => seen.push(l));
    expect(wall.current('prod-7')).toEqual([]);          // …and nobody shows it
    expect(seen.flat()).toEqual([]);
  });

  it('a switcher that stops beating (no will yet) drops off the wall after BEAT_STALE_MS', () => {
    const b = broker();
    const mixer = on(b.session('aaaa0001'));
    const wall = on(b.session('cccc0003'));
    wall.watch('prod-7', () => {});
    mixer.announce('prod-7', [g('SW 19', 'DSK 1')]);
    for (let t = 0; t < 10_000; t += 1_000) { vi.advanceTimersByTime(1_000); b.beat('aaaa0001'); }
    expect(wall.current('prod-7')).toEqual([g('SW 19', 'DSK 1')]);
    vi.advanceTimersByTime(BEAT_STALE_MS + 5_000);       // silence
    expect(wall.current('prod-7')).toEqual([]);
  });

  it('a set older than the trust window reads empty even while its announcer beats', () => {
    const b = broker();
    const wall = on(b.session('cccc0003'));
    const old = Date.now() - TRUST_MS - 1_000;
    b.session('dddd0004').publishRaw(TOPIC, { v: 1, ts: old, production: 'prod-7', full_id: 'dddd0004:TWIST:1', list: [g('SW 9', 'DSK 1')] });
    wall.watch('prod-7', () => {});
    expect(wall.current('prod-7')).toEqual([]);
  });

  it('a live switcher re-stamps its set, so the wall keeps it past the trust window', () => {
    const b = broker();
    const mixer = on(b.session('aaaa0001'));
    const wall = on(b.session('cccc0003'));
    wall.watch('prod-7', () => {});
    mixer.announce('prod-7', [g('SW 19', 'DSK 1')]);
    for (let t = 0; t < TRUST_MS + 60_000; t += 1_000) { vi.advanceTimersByTime(1_000); b.beat('aaaa0001'); }
    expect(wall.current('prod-7')).toEqual([g('SW 19', 'DSK 1')]);
    expect(b.pubs.filter((t) => t === TOPIC).length).toBeGreaterThanOrEqual(Math.floor((TRUST_MS + 60_000) / REFRESH_MS));
  });
});
