// src/editors/vision-mixer/gfx-route — the graphics→bus pre-router model (pure, no DOM).
//
// The control room's graphics are hard-wired: GFX n is the default source of DSK n
// (DEFAULT_SWITCHER: sources 19-24). They key in two places — DOWNSTREAM on the
// DSKs (after the M/E) and UPSTREAM as ordinary M/E keyers (e.g. the LOWER-THIRD
// look keys GRAPHICS 3 on M/E keyer 1). This module names those feeds and lists
// every keyer bus a graphic can be shifted onto, so preroute.ts can paint the
// GFX × bus matrix and keyers.ts can flag an upstream keyer that carries graphics.

import type { SwitcherDef } from '../../model/index.js';
import type { SwitcherState } from './scenes.js';

/** The hard-wired graphics feeds in GFX order (GFX n = DSK n's default source). */
export function gfxFeeds(def: SwitcherDef): number[] {
  const out: number[] = [];
  for (const d of def.dsks) { const src = d.source ?? 0; if (!out.includes(src)) out.push(src); }
  return out;
}

/** "GFX n" for a hard-wired graphics source, else null (a camera, playout, re-entry…). */
export function gfxName(def: SwitcherDef, src: number): string | null {
  const n = gfxFeeds(def).indexOf(src);
  return n < 0 ? null : `GFX ${n + 1}`;
}

/** One keyer bus a graphic can feed: a DSK (downstream) or an M/E keyer (upstream). */
export interface GfxBus {
  stream: 'down' | 'up';
  label: string;           // "DSK 1" · "M/E 2 KEY 3"
  topic: string;           // MQTT source topic, matching panels/keyers
  source: number;          // what feeds it now
}

/** Every bus on the pre-router: the DSKs, then the delegated M/E's keyers. */
export function gfxBuses(def: SwitcherDef, state: SwitcherState, delegate: number): GfxBus[] {
  const down = def.dsks.map((d, i): GfxBus => ({
    stream: 'down', label: `DSK ${i + 1}`, topic: `dsk.${i + 1}.source`,
    source: state.dskSrc?.[i] ?? d.source ?? 0,
  }));
  const up = (state.mes[delegate]?.keyers ?? []).map((k, ki): GfxBus => ({
    stream: 'up', label: `M/E ${delegate + 1} KEY ${ki + 1}`,
    topic: `me.${delegate + 1}.key.${ki + 1}.source`, source: k.source,
  }));
  return [...down, ...up];
}

/** Route `src` onto bus `row` of gfxBuses(); returns the bus it changed (or null). */
export function routeGfx(def: SwitcherDef, state: SwitcherState, delegate: number, row: number, src: number): GfxBus | null {
  const nDsk = def.dsks.length;
  if (row < 0) return null;
  if (row < nDsk) {
    (state.dskSrc ??= def.dsks.map((d) => d.source ?? 0))[row] = src;
  } else {
    const k = state.mes[delegate]?.keyers[row - nDsk];
    if (!k) return null;
    k.source = src;
  }
  return gfxBuses(def, state, delegate)[row] ?? null;
}

/** The pre-route panel view: 'list' (per-DSK selects, the shipped default) or 'matrix'.
 *  `?preroute=matrix|list` (search or hash query) wins over the stored per-device choice. */
export function prerouteView(stored: string | null, href: string): 'list' | 'matrix' {
  const q = href.includes('?') ? new URLSearchParams(href.slice(href.lastIndexOf('?') + 1)) : null;
  const v = q?.get('preroute') ?? stored;
  return v === 'matrix' ? 'matrix' : 'list';
}
