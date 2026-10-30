// src/ui/console/state-glyphs — the STATE GLYPH layer of the Colour Engine
// (Documentation/🏛Philosophy/Colours and shapes.md §5, phase P0). Category is already shape-coded
// (video ▱ / audio ▽ / camera ⬡); STATE was colour + pulse only. This layer rides a
// monochrome glyph LEADING every faulted surface so the state survives grey, mono,
// colour-blindness and glare — colour becomes the tint, the glyph is the message.
//
// Pure CSS keyed off `html[data-state-glyphs]`, so the DOM never changes. Per-seat
// (A routed node in a drop zone keeps its crosspoint badge on ::before, so its glyph
// rides ::after, top-right, in place of the scanline.) Per-seat
// mode in prefs.ui.stateGlyphs:  auto (default) | on | off.
//   auto → ON whenever hue cannot carry state: chroma grey/mono, or vision high.
//          The default full-colour console is untouched (no change for everyone).
//   ?glyphs=on|off in the URL overrides the seat for this page load (a quick check).
// Fail-soft: a bad pref / URL / missing DOM leaves the console exactly as it was.

import { addStyles } from '../dom.js';
import { getPrefs, patchPrefs } from '../../platform/prefs.js';
import type { Chroma, Vision } from './colour-palettes.js';

export type GlyphMode = 'auto' | 'on' | 'off';
export const GLYPH_MODES: readonly GlyphMode[] = ['auto', 'on', 'off'];
export const isGlyphMode = (v: unknown): v is GlyphMode => (GLYPH_MODES as readonly unknown[]).includes(v);

/** The state → glyph vocabulary (monochrome text glyphs; U+FE0E forces text, not emoji). */
export const STATE_GLYPHS = { alarm: '⚠︎', ok: '✓', onair: '●' } as const;

/** Read a `glyphs=` override from a query string (on/1/true · off/0/false), else null. */
export function urlGlyphOverride(search: string): boolean | null {
  try {
    const v = new URLSearchParams(search).get('glyphs');
    if (v === null) return null;
    if (/^(on|1|true|yes)$/i.test(v)) return true;
    if (/^(off|0|false|no)$/i.test(v)) return false;
  } catch { /* malformed query → no override */ }
  return null;
}

/** Whether state glyphs show: URL override, then the seat mode, then `auto` follows the scheme. */
export function resolveStateGlyphs(
  mode: unknown, scheme: { vision: Vision; chroma: Chroma }, search = '',
): boolean {
  const url = urlGlyphOverride(search);
  if (url !== null) return url;
  const m: GlyphMode = isGlyphMode(mode) ? mode : 'auto';
  if (m !== 'auto') return m === 'on';
  return scheme.chroma !== 'full' || scheme.vision === 'high';
}

const G = `content:'${STATE_GLYPHS.alarm}';-webkit-text-fill-color:currentColor;font-weight:900;`;
const ON = 'html[data-state-glyphs]';
const CSS = `
${ON} :not(.drop-zone) > .signal-node.fault::before,${ON} .sub-stream.fault::before{${G}position:static;display:inline;
  width:auto;height:auto;background:none;border:0;animation:none;margin-right:4px;}
${ON} .drop-zone > .signal-node.fault::after{${G}position:absolute;top:1px;right:6px;left:auto;
  width:auto;height:auto;background:none;animation:none;font-size:10px;}
${ON} .foldable-header.fault::before{${G}margin-right:6px;}
${ON} .program-row.fault .program-title::before{${G}margin-right:6px;}
${ON} .twist-container.corrupted .twist-title::before{${G}margin-right:4px;}
${ON} .cse-win-states b{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;
  font:900 9px/1 Arial,sans-serif;color:#04101e;}
${ON} .cse-win-states .d-alarm::before{content:'!';}
${ON} .cse-win-states .d-ok::before{content:'${STATE_GLYPHS.ok}';}
${ON} .cse-win-states .d-onair::before{content:'${STATE_GLYPHS.onair}';font-size:7px;}
`;

/** This seat's glyph mode (default auto). */
export function getGlyphMode(): GlyphMode {
  try {
    const m = getPrefs().ui.stateGlyphs;
    return isGlyphMode(m) ? m : 'auto';
  } catch { return 'auto'; }
}

/** Paint `data-state-glyphs` for the given scheme. Never throws — glyphs are a layer, not a dependency. */
export function applyStateGlyphs(scheme: { vision: Vision; chroma: Chroma }): void {
  try {
    const search = typeof location === 'undefined' ? '' : location.search;
    const on = resolveStateGlyphs(getGlyphMode(), scheme, search);
    if (on) addStyles('state-glyph-styles', CSS);
    document.documentElement.toggleAttribute('data-state-glyphs', on);
  } catch (e) {
    console.warn('[state-glyphs] skipped:', e);
  }
}

/** Set this seat's glyph mode, persist it, and repaint against the scheme. */
export function setGlyphMode(m: GlyphMode, scheme: { vision: Vision; chroma: Chroma }): void {
  try { patchPrefs({ ui: { stateGlyphs: m } }); } catch (e) { console.warn('[state-glyphs] not saved:', e); }
  applyStateGlyphs(scheme);
}
