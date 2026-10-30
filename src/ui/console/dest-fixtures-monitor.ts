// src/ui/console/dest-fixtures-monitor — the MONITOR fixture (test-frame audit P3).
//
// Every destination now carries a live PROGRAM monitor: it renders the "faux
// signal" (the deterministic person-in-a-room picture) of whatever source
// currently sits in the room's crosspoints, so you can see at a glance which feed
// the room is carrying — the literal ask of the Test-Frame Routing audit.
//
// It re-reads the routed feed from the DOM each redraw (the same
// `.drop-zone > .signal-node` scan the rest of the app uses), so dragging a
// source onto any of the room's twists lights this monitor WITHOUT a full room
// re-render. When the room is OFFLINE it shows the NO SIGNAL slate; when nothing
// is routed it shows an idle placeholder. A routed PRODUCTION TIMERS feed paints
// the RC1000 dual-timer graphic from the room's counters_timer snapshot (opt out
// with `?timergfx=off`); if that paint throws, the frame falls back to the faux
// signal so the monitor keeps running.
//
// With `?tone=1` the fixture also gets a LISTEN button that voices the routed
// source's line-up tone + ident cadence (src/domain/test-tone) on the shared
// listen bus, retuning as the route changes. Audio failures leave it muted.

import { el } from '../dom.js';
import { drawFauxSignal, type FauxSource } from '../faux-signal.js';
import { patternForLabel } from '../../domain/tsg/index.js';
import { timerRows } from '../../domain/timer-core/graphic.js';
import { drawTimerGraphic } from '../timer-graphic.js';
import { timerSnapshotOf } from './dest-fixtures-counters.js';
import { timeSync } from '../../platform/time-sync.js';
import { toneFor } from '../../domain/test-tone/index.js';
import { toneEnabled, listenTone, stopTone, listening } from '../test-tone-player.js';
import { animate, card } from './dest-fixtures-shared.js';

type MonitorFeed = FauxSource & { timer?: boolean };

/** `?timergfx=off` (or 0) keeps a routed timer on the faux signal — the rollback switch. */
const timerGfxOn = (): boolean => {
  try { return !/^(off|0|false)$/i.test(new URLSearchParams(location.search).get('timergfx') ?? ''); } catch { return true; }
};

/** The feed to monitor: the first VIDEO/control feed routed anywhere in the room
 *  (an audio-only feed is used only as a last resort). Mirrors app/context.ts
 *  routedFeeds, but scans the whole room body across every twist's drop-zone. */
function routedFeed(body: HTMLElement): MonitorFeed | null {
  const nodes = body.querySelectorAll<HTMLElement>('.drop-zone .signal-node:not(.dropped-group)');
  let audioFallback: MonitorFeed | null = null;
  for (const n of nodes) {
    const label = (n.textContent ?? '').trim().split('\n')[0]?.trim() ?? '';
    if (!label) continue;
    const color = n.style.color || n.style.borderColor || '#4d94ff';
    const media = n.classList.contains('audio') ? 'audio' as const
      : n.classList.contains('video') ? 'video' as const
      : n.classList.contains('control') || n.classList.contains('camera-control') ? 'control' as const
      : undefined;
    const feed: MonitorFeed = { id: n.id || label, label, color, origin: n.dataset.origin, media };
    // A routed TEST SIGNAL GENERATOR feed paints its standardised pattern (resolved
    // from the routed label) instead of the person-in-a-room faux signal.
    if (n.classList.contains('tsg-source')) feed.tsg = patternForLabel(label).id;
    if (n.classList.contains('timer-source')) feed.timer = true;
    if (media !== 'audio') return feed;   // prefer a picture feed
    audioFallback ??= feed;
  }
  return audioFallback;
}

/** A dim "nothing routed" placeholder (distinct from the faulted NO SIGNAL slate). */
function drawIdle(cvs: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  const cw = cvs.clientWidth, ch = cvs.clientHeight;
  if (!cw || !ch) return;
  cvs.width = Math.round(cw * dpr); cvs.height = Math.round(ch * dpr);
  const g = cvs.getContext('2d'); if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#050608'; g.fillRect(0, 0, cw, ch);
  g.fillStyle = '#3a4658'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${Math.max(9, Math.round(ch * 0.1))}px 'Courier New',monospace`;
  g.fillText('NO SOURCE ROUTED', cw / 2, ch / 2);
}

/** The MONITOR fixture. `offline` (room fault status) forces the NO SIGNAL slate;
 *  `destId` keys the room's counters_timer snapshot for a routed timer feed. */
export function monitorCard(body: HTMLElement, offline: boolean, destId?: string): HTMLElement {
  const cvs = el('canvas', {
    class: 'dfx-cvs',
    style: 'aspect-ratio:16/9;height:auto;background:#000;',
  });
  const timerGfx = timerGfxOn();
  let warned = false;   // a persistently failing paint logs once, not 15×/s
  // ~15fps redraw (every 4th display frame): the faux "breathing" bob is slow, so
  // this stays smooth while quartering the DOM re-scan + canvas realloc cost.
  let f = 0;
  const tone = toneEnabled() ? listenButton(body, offline) : null;
  animate(cvs, () => {
    if (f++ % 4) return;
    const t = performance.now();
    tone?.sync();
    if (offline) { drawFauxSignal(cvs, { label: 'PROGRAM', faulted: true }, t); return; }
    const feed = routedFeed(body);
    if (feed?.timer && timerGfx && destId) {
      try { drawTimerGraphic(cvs, timerRows(timerSnapshotOf(destId), feed.label ?? '', timeSync.now())); return; }
      catch (e) { if (!warned) { warned = true; console.warn('timer graphic failed; showing faux signal', e); } }
    }
    if (feed) drawFauxSignal(cvs, feed, t);
    else drawIdle(cvs);
  });
  const view = tone ? el('div', { class: 'dfx-chat' }, [cvs, el('div', { class: 'dfx-mrow' }, [tone.btn])]) : cvs;
  return card('MONITOR', view, offline ? 'offline' : 'routed source');
}

/** The LISTEN toggle: voices the routed feed's test tone; `sync` (called from the
 *  fixture loop) retunes on a re-route and drops the bus when nothing is routed. */
function listenButton(body: HTMLElement, offline: boolean): { btn: HTMLElement; sync: () => void } {
  const btn = el('button', { class: 'dfx-mini', textContent: 'LISTEN', title: '1 kHz −18 dBFS line-up; left-leg dropouts count the source ident' });
  const mine = (): boolean => listening().owner === btn;
  const play = (label: string): void => {
    if (!listenTone(toneFor(label, { faulted: offline }), btn)) btn.textContent = 'NO AUDIO';
  };
  btn.addEventListener('click', () => {
    if (mine()) { stopTone(); return; }
    const feed = routedFeed(body);
    if (feed) play(feed.label ?? 'PROGRAM');
  });
  const sync = (): void => {
    if (mine()) {
      const feed = routedFeed(body);
      if (!feed) stopTone();
      else if ((feed.label ?? 'PROGRAM') !== listening().id) play(feed.label ?? 'PROGRAM');
    }
    const on = mine();
    btn.classList.toggle('run', on);
    if (on || btn.textContent !== 'NO AUDIO') btn.textContent = on ? 'MUTE' : 'LISTEN';
  };
  return { btn, sync };
}
