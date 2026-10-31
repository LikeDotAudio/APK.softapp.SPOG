// src/ui/palette — the LCARS colour palettes, ported from js/util/palette.js.
import type { Hex } from '../model/index.js';
import { PAL } from '../domain/palette.js';

/** Per-audio-pool / per-group fill palette (also used for source sub-group colour). */
export const AUDIO_POOL_COLORS: Hex[] = [
  PAL.orange50_ff9c00, PAL.blue61, PAL.cyan76, PAL.orange45, PAL.yellow43,
  PAL.pink47, PAL.sky35s22, PAL.orange63s34, PAL.yellow53, PAL.blue49,
];

/** LCARS spine colours handed to each top-level source super-pool, by order. */
export const SOURCE_POOL_COLORS: Hex[] = [PAL.purple70, PAL.orange69, PAL.blue60, PAL.cyan52, PAL.orange46, PAL.green49];

/** Distinct colours for destination tabs. */
export const DEST_TAB_COLORS: Hex[] = [PAL.purple52, PAL.blue61, PAL.cyan56, PAL.orange45, PAL.yellow53, PAL.pink47, PAL.green45, PAL.orange63s34];

/** Destination category group colours, as "r,g,b" strings (footer group spines). */
export const DEST_GROUP_COLORS: string[] = ['100,109,204', '160,110,180', '255,51,102', '63,193,201', '198,120,37', '120,160,90'];

/** Pick from a "r,g,b" string palette by index, wrapping. */
export function rgbAt(palette: string[], i: number): string {
  return palette[((i % palette.length) + palette.length) % palette.length] ?? '255,170,0';
}

/** Pick from a palette by index, wrapping, with a guaranteed non-undefined result. */
export function paletteAt(palette: Hex[], i: number): Hex {
  return palette[((i % palette.length) + palette.length) % palette.length] ?? PAL.blue60;
}
