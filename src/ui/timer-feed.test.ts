// src/ui/timer-feed.test — ROAD-3448: a routed PRODUCTION TIMERS feed paints the
// RC1000 timer on every surface that draws through drawFauxSignal (monitor,
// multiviewer pane, switcher PGM/PVW), and LISTEN is on unless ?tone=0.

import { describe, it, expect, afterEach } from 'vitest';
import { paintTimerFeed, setTimerSnapshotSource } from './timer-feed.js';
import { drawFauxSignal } from './faux-signal.js';
import { drawCard, testCardFor } from './test-card/index.js';
import { toneEnabled } from './test-tone-player.js';
import { channelsFor } from '../editors/multi-viewer/channels.js';

const g = globalThis as any;
const saved = { window: g.window, location: g.location };
afterEach(() => { g.window = saved.window; g.location = saved.location; setTimerSnapshotSource(() => undefined); });

/** A laid-out canvas whose 2D context records every fillText. */
function canvas(): { cvs: HTMLCanvasElement; texts: string[] } {
  const texts: string[] = [];
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'fillText' ? (s: string) => texts.push(s) : k === 'measureText' ? () => ({ width: 10 }) : () => undefined),
    set: () => true,
  });
  const cvs = { clientWidth: 320, clientHeight: 180, width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  return { cvs, texts };
}
const at = (search: string): void => { g.window = { devicePixelRatio: 1 }; g.location = { search, hash: '' }; };

describe('timer feeds on every surface', () => {
  it('paints the destination\'s RC1000 rows through drawFauxSignal (the multiviewer / switcher path)', () => {
    at('');
    const asked: string[] = [];
    setTimerSnapshotSource((id) => { asked.push(id); return undefined; });
    const { cvs, texts } = canvas();
    drawFauxSignal(cvs, { label: 'TIMER A ▾ COUNT', timer: true, timerDest: 'prod9' }, 0);
    expect(asked).toEqual(['prod9']);
    expect(texts).toContain('A');            // the channel tag column, not the cartoon's lower-third
  });
  it('a multiviewer pane carries the timer to its test card', () => {
    at('');
    const asked: string[] = [];
    setTimerSnapshotSource((id) => { asked.push(id); return undefined; });
    drawCard(canvas().cvs, testCardFor('TIMER B', '#8040ff', { timerDest: 'prod7' }), 0);
    expect(asked).toEqual(['prod7']);
    const ctx = { sources: [{ id: 't', label: 'TIMER B', color: '#fff', media: 'video', timer: true }], twist: {} } as any;
    expect(channelsFor(ctx)[0]).toMatchObject({ label: 'TIMER B', timer: true });
  });
  it('?timergfx=off keeps the faux signal', () => {
    at('?timergfx=off');
    expect(paintTimerFeed(canvas().cvs, 'prod9', 'TIMER A')).toBe(false);
  });
});

describe('line-up tone', () => {
  it('is on by default; ?tone=0 turns LISTEN off', () => {
    at('');
    expect(toneEnabled()).toBe(true);
    at('?tone=0');
    expect(toneEnabled()).toBe(false);
  });
});
