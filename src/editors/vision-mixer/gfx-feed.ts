// src/editors/vision-mixer/gfx-feed — which graphics are on air (auto-multiviewer).
//
// Roadmap §2: any graphic on a DSK / the switcher lands in a multiviewer tile
// without a manual route. This is the pure half: from the definition + live state,
// list every graphic on air — whatever feeds a DSK that is ON (its PRE-ROUTE
// feed), plus any hard-wired graphics source (preroute.ts `graphicsInputs`) on an
// M/E keyer that is ON (upstream graphics) or on an M/E programme bus.
// projection.ts announces the result on platform/gfx-monitor, which the
// multiviewer watches.

import type { SwitcherDef } from '../../model/index.js';
import type { OnAirGraphic } from '../../platform/gfx-monitor.js';
import { srcLabel } from './me.js';
import type { SwitcherState } from './scenes.js';

/** Every on-air graphic, in a stable order (DSKs first, then M/E 1…n). */
export function onAirGraphicsOf(def: SwitcherDef, state: SwitcherState): OnAirGraphic[] {
  const gfx = new Set(def.dsks.map((d) => d.source ?? 0));
  const out = new Map<number, OnAirGraphic>();
  // Whatever a DSK keys IS a graphic layer (even a PRE-ROUTE onto a camera input);
  // upstream keyers and PGM buses count only when they carry a hard-wired graphic.
  const add = (src: number, via: string, keyed = false): void => {
    if (!keyed && !gfx.has(src)) return;
    const g = out.get(src);
    if (g) g.via.push(via);
    else out.set(src, { label: srcLabel(src, def), via: [via] });
  };
  def.dsks.forEach((d, i) => {
    if (state.dsks[i]) add(state.dskSrc?.[i] ?? d.source ?? 0, `DSK ${i + 1}`, true);
  });
  state.mes.forEach((m, mi) => {
    add(m.pgm, `M/E ${mi + 1} PGM`);
    m.keyers.forEach((k, ki) => { if (k.on) add(k.source, `M/E ${mi + 1} KEY ${ki + 1}`); });
  });
  return [...out.values()];
}
