// src/editors/audio-monitor/listen — LISTEN to the line-up tone (ROAD-3448).
//
// One more master key on a confidence panel: it voices the line-up tone + ident
// cadence (domain/test-tone) of the CUE'd channel, else the first channel, on the
// page's shared listen bus (ui/test-tone-player) — the same button the room
// MONITOR carries. Retunes when the cue moves; `?tone=0` leaves it off.

import type { Disposer } from '../../ui/timers.js';
import { toneEnabled, listenToggle } from '../../ui/test-tone-player.js';

/** The label LISTEN voices: the first CUE'd channel, else channel 1 (null = none). */
export function listenLabel(panel: HTMLElement): string | null {
  const chans = [...panel.querySelectorAll<HTMLElement>('.am2-ch')];
  const cued = chans.find((c) => c.querySelector('.am2-cue.on')) ?? chans[0];
  return cued?.querySelector('.am2-lab')?.textContent?.trim() || null;
}

/** Add the LISTEN key to a built panel's master keys. */
export function mountListen(panel: HTMLElement, dispose: Disposer): void {
  if (!toneEnabled()) return;
  const keys = panel.querySelectorAll<HTMLElement>('.am2-master .am2-keys');
  const row = keys[keys.length - 1];
  if (!row) return;
  const t = listenToggle(() => listenLabel(panel), { className: 'am2-key' });
  t.btn.style.font = 'bold 12px sans-serif';
  row.append(t.btn);
  dispose.interval(() => { t.sync(); t.btn.classList.toggle('on', t.btn.classList.contains('run')); }, 250);
}
