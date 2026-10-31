// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/ui/canvas-ink — the colour modes on a <canvas> (ROAD-3456).
 *
 *  A canvas cannot read `var(--pal-*)`, and before ROAD-3456 it did not need to: lcars.css's
 *  root filter re-coloured the finished page. Without that filter every colour a canvas is
 *  handed goes through `ink()`: a palette reference becomes its resolved colour, and a literal
 *  colour (a feed's data colour, a clock face's own palette) is seen through the mode too.
 *  `installCanvasInk()` wires `ink()` into the 2D context's colour setters once, so no drawing
 *  code changes. Signal content stays TRUE colour (owner, 2026-10-31): a canvas marked
 *  `data-true-colour`, or drawing inside `withTrueColour(ctx, …)` (src/domain/true-colour.ts), gets palette references as
 *  their true hex and every literal untouched. */

import { HEX } from '../domain/palette.js';
import { ACCENT_HEX } from '../domain/brand.js';
import { resolveColour, type Mode } from '../domain/colour-resolve.js';
import { isTrueColour } from '../domain/true-colour.js';

/** Every colour token the engine paints, custom-property name (no `--`) → true colour: the
 *  palette's `pal-*` and the contract's `brand-accent` (ROAD-3463). */
export const TRUE_VARS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(Object.entries(HEX).map(([k, v]) => [`pal-${k}`, v])),
  'brand-accent': ACCENT_HEX,
};
const IDENTITY: Mode = { chroma: 'full', vision: 'normal' };
let mode: Mode = IDENTITY;
let resolved: Record<string, string> = { ...TRUE_VARS };
let cache = new Map<string, string>();

const VAR = /var\(--([A-Za-z0-9_-]+)\)/g;
const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\([^()]*\)/g;

/** The tokens as the current mode paints them: custom-property name (no `--`) → colour. */
export const resolvedVars = (): Readonly<Record<string, string>> => resolved;

/** Point ink() (and so every interface canvas) at a mode. */
export function setInkMode(m: Mode): void {
  mode = m;
  resolved = Object.fromEntries(Object.entries(TRUE_VARS).map(([k, v]) => [k, resolveColour(v, m)]));
  cache = new Map();
}

const trueOf = (c: string): string => (c.includes('var(') ? c.replace(VAR, (s, k: string) => TRUE_VARS[k] ?? s) : c);

/** A colour as the interface paints it now; `trueColour` keeps signal content as spelled. */
export function ink(c: string, trueColour = false): string {
  if (trueColour) return trueOf(c);
  let v = cache.get(c);
  if (v !== undefined) return v;
  v = c.replace(VAR, (s, k: string) => resolved[k] ?? s);
  if (mode !== IDENTITY) v = trueOf(c).replace(LITERAL, (lit) => resolveColour(lit, mode));
  if (cache.size > 4096) cache.clear();
  cache.set(c, v);
  return v;
}

type Inked = { canvas?: unknown };
const isTrue = (ctx: Inked): boolean =>
  isTrueColour(ctx) || (ctx.canvas as HTMLElement | undefined)?.dataset?.trueColour !== undefined;

const gradientTrue = new WeakMap<object, boolean>();
let installed = false;
/** Wire ink() into every 2D context's colour setters and gradient stops. Idempotent; a no-op without a DOM. */
export function installCanvasInk(): void {
  if (installed || typeof globalThis.CanvasRenderingContext2D === 'undefined') return;
  installed = true;
  const protos = [globalThis.CanvasRenderingContext2D, globalThis.OffscreenCanvasRenderingContext2D]
    .filter((k): k is typeof CanvasRenderingContext2D => !!k).map((k) => k.prototype as unknown as Record<string, unknown>);
  for (const proto of protos) {
    for (const prop of ['fillStyle', 'strokeStyle', 'shadowColor']) {
      const d = Object.getOwnPropertyDescriptor(proto, prop);
      if (!d?.set || !d.get) continue;
      const set = d.set;
      Object.defineProperty(proto, prop, { ...d, set(this: Inked, v: unknown) { set.call(this, typeof v === 'string' ? ink(v, isTrue(this)) : v); } });
    }
    for (const make of ['createLinearGradient', 'createRadialGradient', 'createConicGradient']) {
      const f = proto[make] as ((...a: unknown[]) => object) | undefined;
      if (!f) continue;
      proto[make] = function (this: Inked, ...a: unknown[]): object { const g = f.apply(this, a); gradientTrue.set(g, isTrue(this)); return g; };
    }
  }
  const stop = CanvasGradient.prototype.addColorStop;
  CanvasGradient.prototype.addColorStop = function (this: CanvasGradient, o: number, c: string): void {
    stop.call(this, o, typeof c === 'string' ? ink(c, gradientTrue.get(this) ?? false) : c);
  };
}
