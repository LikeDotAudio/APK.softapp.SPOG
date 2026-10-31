// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/ui/ink-var — a DATA colour on an element's custom property, seen through the mode (ROAD-3456).
 *
 *  Palette colours follow the chroma / vision modes by themselves (`var(--pal-*)`). A colour
 *  that arrives as data — a destination group's "r,g,b", a room's `#hex` from Routes JSON —
 *  cannot, so it is written resolved (`ink()`) and remembered on the element as
 *  `data-ink="--prop=colour|…"`; the Colour Engine calls `repaintInkVars()` after every mode
 *  change and each one is re-resolved from its true colour. Accepts a CSS colour or an
 *  "r,g,b" triple (written back as a triple, and as a colour on `<prop>-c`). */

import { ink } from './canvas-ink.js';
import { parseColour, tripleColour } from '../domain/colour-resolve.js';

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
  paintVar(el, prop, colour);
}

/** A triple also lands as a colour on `<prop>-c`, so CSS can read it without spelling rgb(var(…)). */
function paintVar(el: HTMLElement, prop: string, colour: string): void {
  el.style.setProperty(prop, inkValue(colour));
  if (TRIPLE.test(colour)) el.style.setProperty(`${prop}-c`, ink(tripleColour(colour)));
}

/** The TRUE (data) colour behind `prop` on `el`, as it was handed to setInkVar — for anything that
 *  sends or stores it (a chat endpoint's colour), never the mode-resolved paint. */
export const trueInkVar = (el: Element, prop: string): string | undefined => read(el).get(prop);

/** Forget `prop`'s true colour on `el` (the element is reused for a colour that is not data). */
export function dropInkVar(el: HTMLElement, prop: string): void {
  const m = read(el);
  if (!m.delete(prop)) return;
  if (m.size) el.setAttribute('data-ink', write(m)); else el.removeAttribute('data-ink');
}

/** The TRUE colour `el` paints its text in now, for a copy that must follow later mode changes (a
 *  dropped group takes its source's colour, ROAD-3464; an editor's feed, ROAD-3465). Read with the
 *  element marked `data-true-colour`, so palette tokens come back as spelled; when that equals the
 *  resolved value of a data colour on the way up (the node's own `--sig-node`, the nearest
 *  `--lcars-color`, where the walk stops), the element paints that one: its true colour. */
export function trueColourOf(el: HTMLElement): string {
  const had = el.hasAttribute('data-true-colour');
  if (!had) el.setAttribute('data-true-colour', '');
  const seen = getComputedStyle(el).color;
  if (!had) el.removeAttribute('data-true-colour');
  const x = parseColour(seen);
  for (let a: HTMLElement | null = el; a && x; a = a.parentElement) {
    const m = read(a);
    for (const v of m.values()) {
      const c = TRIPLE.test(v) ? tripleColour(v) : v;
      const y = parseColour(ink(c));
      if (y && x.slice(0, 3).every((n, i) => Math.round(n) === Math.round(y[i]!))) return c;
    }
    if (m.has('--lcars-color')) break;
  }
  return seen;
}

/** The same for an HTML string: `style="${prop}: …"` comes from inkValue, this is the attribute. */
export const inkAttr = (vars: Record<string, string>): string =>
  `data-ink="${write(new Map(Object.entries(vars))).replace(/"/g, '&quot;')}"`;

/** The first `from` data colour in an HTML string (as inkAttr wrote it), carried onto `to`:
 *  `[attribute, style declaration]`, both '' when the string holds none (a gang elbow takes its
 *  first twist's colour, ROAD-3464). */
export function carryInk(html: string, from: string, to: string): [string, string] {
  const c = new RegExp(`data-ink="(?:[^"]*\\|)?${from}=([^|"]+)`).exec(html)?.[1];
  return c ? [` ${inkAttr({ [to]: c })}`, ` ${to}:${inkValue(c)};`] : ['', ''];
}

/** Re-resolve every remembered data colour (after a mode change). */
export function repaintInkVars(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-ink]').forEach((el) => {
    for (const [prop, colour] of read(el)) paintVar(el, prop, colour);
  });
}

/** Run `repaint` after every colour-mode change while `el` is in the document: for a canvas drawn
 *  once (not per frame) or an inline style built from a computed colour, which would otherwise keep
 *  the old mode until something else redraws it (ROAD-3463). The listener drops itself once `el`
 *  has left the page; the returned function drops it sooner (an editor's `dispose.add`). */
export function onSchemeChange(el: Element, repaint: () => void): () => void {
  const off = (): void => document.removeEventListener('colour-scheme-change', fn);
  const fn = (): void => { if (el.isConnected) repaint(); else off(); };
  document.addEventListener('colour-scheme-change', fn);
  return off;
}
