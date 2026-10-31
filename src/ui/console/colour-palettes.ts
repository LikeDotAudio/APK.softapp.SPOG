// src/ui/console/colour-palettes — palette data tables + type guards.
// The single source of truth for the COLOUR & VISION engine (colour-engine.ts)
// and editor (colour-editor.ts): the six-token palettes, the accessibility axis
// value sets + guards, and the editor's preset/axis tables. Pure data — no DOM.

import { PAL } from '../../domain/palette.js';
import { STATE_VAR } from '../../domain/state.js';
import { STATE_TONES } from '../../domain/state.js';

export type Vision = 'low' | 'normal' | 'high';
export type Chroma = 'full' | 'grey' | 'mono';
/** FACE — the chrome aesthetic: LCARS bars, or the macOS-style icon tiles
 *  (Routes/Sources/.icon + Routes/Destinations/.icons). A presentation axis just
 *  like vision/chroma: `html[data-face]` + CSS overlay; the DOM never changes. */
export type Face = 'lcars' | 'icons';
export interface ColourScheme { vision: Vision; chroma: Chroma; cvd: string; face: Face; monoHue?: number; }

// ── PALETTES ────────────────────────────────────────────────────────────────
// Six semantic tokens per palette. `video/audio/program` are the three signal
// categories (the accessibility-critical trio — keep them distinct in hue AND
// luminance so they survive grey/mono); `alarm/ok/onair` are the state colours. Classic's
// alarm and ok ARE the contract's dead and good tones (domain/state.ts); the CVD-safe palettes
// re-hue them on purpose, which is what those palettes are for.
interface PaletteTokens { video: string; audio: string; program: string; alarm: string; ok: string; onair: string; }
export interface Palette { id: string; name: string; cvdSafe: boolean; blurb: string; t: PaletteTokens; }

export const PALETTES: readonly Palette[] = [
  { id: 'classic', name: 'Classic LCARS', cvdSafe: false,
    blurb: 'The signature Twist palette — violet / orange / blue.',
    t: { video: PAL.purple70, audio: PAL.orange69, program: PAL.blue60, alarm: STATE_TONES.dead.hex, ok: STATE_TONES.good.hex, onair: PAL.amber50s100 } },
  { id: 'okabe', name: 'Okabe-Ito', cvdSafe: true,
    blurb: 'The scientific gold standard — safe across all three colour-vision deficiencies.',
    t: { video: PAL.pink64, audio: PAL.amber45, program: PAL.sky63s77, alarm: PAL.orange42, ok: PAL.teal31, onair: PAL.yellow56 } },
  { id: 'ibm', name: 'IBM Carbon', cvdSafe: true,
    blurb: 'IBM Design colour-blind-safe set — bright and modern.',
    t: { video: PAL.indigo65, audio: PAL.orange50_fe6100, program: PAL.blue69, alarm: PAL.pink51, ok: STATE_VAR.good, onair: PAL.amber48 } },
  { id: 'tol', name: 'Paul Tol', cvdSafe: true,
    blurb: 'Paul Tol vibrant scheme — the muted, print-friendly CVD-safe alternative.',
    t: { video: PAL.pink43, audio: PAL.orange57s85, program: PAL.sky47, alarm: PAL.red43, ok: PAL.green33, onair: PAL.yellow53s57 } },
  { id: 'synthwave', name: 'Synthwave', cvdSafe: false,
    blurb: 'Neon night palette — electric purple, hot-pink and cyan on the dark grid.',
    t: { video: PAL.violet65, audio: PAL.pink59, program: PAL.cyan50s100, alarm: PAL.red60_ff3355, ok: PAL.teal51, onair: PAL.amber50 } },
  { id: 'ember', name: 'Ember', cvdSafe: false,
    blurb: 'Warm, blue-free ramp for low-light / night rooms — easy on dark-adapted eyes.',
    t: { video: PAL.red71, audio: PAL.orange65s100, program: PAL.amber62s100, alarm: PAL.red54, ok: PAL.lime45, onair: PAL.orange58 } },
  { id: 'tidal', name: 'Tidal', cvdSafe: false,
    blurb: 'Cool and calm — cyan, indigo and mint, with a warm alarm for salience.',
    t: { video: PAL.cyan59, audio: PAL.blue67, program: PAL.teal65, alarm: PAL.red71, ok: PAL.teal54s68, onair: PAL.sky72 } },
];

export const paletteById = (id: string): Palette => PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;

export const DEFAULT: ColourScheme = { vision: 'normal', chroma: 'full', cvd: 'classic', face: 'lcars', monoHue: -8 };

const VISIONS: readonly Vision[] = ['low', 'normal', 'high'];
const CHROMAS: readonly Chroma[] = ['full', 'grey', 'mono'];
const FACES: readonly Face[] = ['lcars', 'icons'];

export const isVision = (v: string | null): v is Vision => (VISIONS as readonly string[]).includes(v ?? '');
export const isChroma = (v: string | null): v is Chroma => (CHROMAS as readonly string[]).includes(v ?? '');
export const isFace = (v: string | null): v is Face => (FACES as readonly string[]).includes(v ?? '');
export const isCvd = (v: string | null): boolean => PALETTES.some((p) => p.id === v);

// ── EDITOR TABLES ────────────────────────────────────────────────────────────
/** The named presets — each a labelled point in the vision×chroma×palette cube. Glyphs
 *  are monochrome (never colour-dependent), so they read in every mode including mono.
 *  Presets are points in the COLOUR cube only — FACE is orthogonal and preserved,
 *  so switching palette presets never flips the chrome between LCARS and icons. */
interface Preset { id: string; glyph: string; label: string; hint: string; scheme: Omit<ColourScheme, 'face'>; }
export const PRESETS: readonly Preset[] = [
  { id: 'default', glyph: '⬡', label: 'Default', hint: 'Classic LCARS, full colour',
    scheme: { vision: 'normal', chroma: 'full', cvd: 'classic' } },
  { id: 'lowvis', glyph: '☾', label: 'Low Visibility', hint: 'Dim, calm — dark-adapted / on-air rooms',
    scheme: { vision: 'low', chroma: 'full', cvd: 'okabe' } },
  { id: 'highvis', glyph: '☀', label: 'High Visibility', hint: 'Max contrast, glow off, CVD-safe palette',
    scheme: { vision: 'high', chroma: 'full', cvd: 'okabe' } },
  { id: 'grey', glyph: '◑', label: 'Grey', hint: 'Hue removed — shape + luminance carry meaning',
    scheme: { vision: 'high', chroma: 'grey', cvd: 'classic', monoHue: -8 } },
  { id: 'mono', glyph: '▮', label: 'Monochrome', hint: 'Single-hue amber phosphor — the universal fallback',
    scheme: { vision: 'normal', chroma: 'mono', cvd: 'classic', monoHue: -8 } },
];

// The two pure-CSS axes render as segmented controls; the palette gets its own gallery.
export const AXES: ReadonlyArray<{
  label: string; hint: string; get(s: ColourScheme): string;
  opts: ReadonlyArray<{ v: string; label: string }>;
  set(s: ColourScheme, v: string): ColourScheme;
}> = [
  { label: 'Vision', hint: 'contrast / luminance', get: (s) => s.vision,
    opts: [{ v: 'low', label: 'Low' }, { v: 'normal', label: 'Normal' }, { v: 'high', label: 'High' }],
    set: (s, v) => ({ ...s, vision: v as Vision }) },
  { label: 'Chroma', hint: 'hue → grey → mono', get: (s) => s.chroma,
    opts: [{ v: 'full', label: 'Full' }, { v: 'grey', label: 'Grey' }, { v: 'mono', label: 'Mono' }],
    set: (s, v) => ({ ...s, chroma: v as Chroma }) },
  { label: 'Face', hint: 'chrome aesthetic — LCARS bars or icon tiles', get: (s) => s.face,
    opts: [{ v: 'lcars', label: 'LCARS' }, { v: 'icons', label: 'Icons' }],
    set: (s, v) => ({ ...s, face: v as Face }) },
];
