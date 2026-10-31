// src/editors/ifb/dials — builds the three IFB encoder knobs (Program, Interrupt,
// Threshold) into the `.ifb-knobs` container, wiring each vertical-drag dial to the
// state and returning a repaint map so inbound bus writes can redraw a knob.

import type { Disposer } from '../../ui/timers.js';
import { qs } from '../../ui/dom.js';
import type { DialKey, IfbState } from './state.js';
import { PAL } from '../../domain/palette.js';

/** Build the encoder dials; returns a per-key repaint fn for inbound bus writes. */
export function buildDials(
  body: HTMLElement,
  s: IfbState,
  dispose: Disposer,
  pubDial: (key: DialKey) => void,
): Map<DialKey, () => void> {
  const knobs = qs(body, '.ifb-knobs');
  const dialDefs: ReadonlyArray<[DialKey, string, string]> = [
    ['progGain', 'Program', PAL.green53],
    ['intGain', 'Interrupt', PAL.red71],
    ['threshold', 'Threshold', PAL.amber50],
  ];
  const dialPaint = new Map<DialKey, () => void>();
  for (const [key, label, c] of dialDefs) {
    const kn = document.createElement('div');
    kn.className = 'ifb-kn';
    kn.innerHTML = `<div class="ifb-dial" style="--c:${c}"><i></i></div><b></b><span>${label}</span>`;
    const dial = qs<HTMLElement>(kn, '.ifb-dial');
    const val = qs<HTMLElement>(kn, 'b');
    const paint = (): void => {
      const v = s[key];
      dial.style.setProperty('--p', `${v * 100}%`);
      dial.style.setProperty('--rot', `${v * 270 - 135}deg`);
      val.textContent =
        key === 'threshold'
          ? `-${Math.round(6 + v * 18)}dB`
          : `${v >= 0.5 ? '+' : ''}${Math.round((v - 0.5) * 24)}dB`;
    };
    let sy = 0;
    let sv = 0;
    let dr = false;
    dial.addEventListener('mousedown', (e: MouseEvent) => {
      dr = true;
      sy = e.clientY;
      sv = s[key];
      e.preventDefault();
    });
    const onMove = (e: MouseEvent): void => {
      if (!dr) return;
      s[key] = Math.max(0, Math.min(1, sv + (sy - e.clientY) / 130));
      paint();
      pubDial(key); // throttled — safe inside the drag loop
    };
    const onUp = (): void => {
      dr = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    dispose.add(() => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    });
    knobs.appendChild(kn);
    dialPaint.set(key, paint);
    paint();
  }
  return dialPaint;
}
