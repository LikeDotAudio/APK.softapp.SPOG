// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/ui/ink-var — a DATA colour on an element's custom property, seen through the mode (ROAD-3456).
 *
 *  Palette colours follow the chroma / vision modes by themselves (`var(--pal-*)`). A colour
 *  that arrives as data — a destination group's "r,g,b", a room's `#hex` from Routes JSON —
 *  cannot, so it is written resolved (`ink()`) and remembered on the element as
 *  `data-ink="--prop=colour|…"`; the Colour Engine calls `repaintInkVars()` after every mode
 *  change and each one is re-resolved from its true colour. Accepts a CSS colour or an
 *  "r,g,b" triple (written back as a triple, for `rgba(var(--x), a)`). */

import { ink } from './canvas-ink.js';
import { parseColour } from '../domain/colour-resolve.js';

const TRIPLE = /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/;

/** A colour or "r,g,b" triple as the interface paints it now (same form back). */
export function inkValue(colour: string): string {
  const t = TRIPLE.exec(colour);
  if (!t) return ink(colour);
  const c = parseColour(ink(`rgb(${t[1]}, ${t[2]}, ${t[3]})`));
  return c ? `${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])}` : colour;
}

const read = (el: Element): Map<string, string> =>
  new Map((el.getAttribute('data-ink') ?? '').split('|').filter(Boolean).map((p) => {
    const i = p.indexOf('=');
    return [p.slice(0, i), p.slice(i + 1)] as [string, string];
  }));
const write = (m: Map<string, string>): string => [...m].map(([k, v]) => `${k}=${v}`).join('|');

/** Set `prop` on `el` to `colour` resolved for the mode, and keep the true colour for repaints. */
export function setInkVar(el: HTMLElement, prop: string, colour: string): void {
  const m = read(el);
  m.set(prop, colour);
  el.setAttribute('data-ink', write(m));
  el.style.setProperty(prop, inkValue(colour));
}

/** The same for an HTML string: `style="${prop}: …"` comes from inkValue, this is the attribute. */
export const inkAttr = (vars: Record<string, string>): string =>
  `data-ink="${write(new Map(Object.entries(vars))).replace(/"/g, '&quot;')}"`;

/** Re-resolve every remembered data colour (after a mode change). */
export function repaintInkVars(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-ink]').forEach((el) => {
    for (const [prop, colour] of read(el)) el.style.setProperty(prop, inkValue(colour));
  });
}
