// src/ui/ink-inline.test — an open editor is handed TRUE colours (its production's, its feeds')
// and paints them raw into inline styles; ink-inline sees each through the mode and the Colour
// Engine's repaint follows every mode change while the editor stays open (ROAD-3465).
// A tiny element stand-in and a hand-fired MutationObserver; no DOM.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { inkInline, inkStyle } from './ink-inline.js';
import { repaintInkVars, trueInkVar, trueColourOf, setInkVar } from './ink-var.js';
import { setInkMode } from './canvas-ink.js';
import { resolveColour, type Mode } from '../domain/colour-resolve.js';
import { HEX } from '../domain/palette.js';

class Fake {
  attrs = new Map<string, string>();
  props = new Map<string, string>();
  children: Fake[] = [];
  parentElement: Fake | null = null;
  style = {
    setProperty: (k: string, v: string): void => { this.props.set(k, v); },
    getPropertyValue: (k: string): string => this.props.get(k) ?? '',
    removeProperty: (k: string): void => { this.props.delete(k); },
    item: (i: number): string => [...this.props.keys()][i] ?? '',
    get length(): number { return 0; },
  };
  constructor() {
    Object.defineProperty(this.style, 'length', { get: () => this.props.size });
  }
  getAttribute(k: string): string | null {
    if (k === 'style') return this.props.size ? [...this.props].map(([p, v]) => `${p}: ${v}`).join('; ') : null;
    return this.attrs.get(k) ?? null;
  }
  setAttribute(k: string, v: string): void { this.attrs.set(k, v); }
  removeAttribute(k: string): void { this.attrs.delete(k); }
  hasAttribute(k: string): boolean { return this.attrs.has(k); }
  append(...c: Fake[]): void { c.forEach((x) => { x.parentElement = this; this.children.push(x); }); }
  closest(sel: string): Fake | null {
    const want = sel.replace(/^\[|\]$/g, '');
    for (let a: Fake | null = this; a; a = a.parentElement) if (a.attrs.has(want)) return a;
    return null;
  }
  querySelectorAll(sel: string): Fake[] {
    const all: Fake[] = [];
    const walk = (n: Fake): void => n.children.forEach((c) => { all.push(c); walk(c); });
    walk(this);
    if (sel === '[style]') return all.filter((n) => n.props.size);
    return sel === '[data-ink]' ? all.filter((n) => n.attrs.has('data-ink')) : all;
  }
}
const with$ = (props: Record<string, string>): Fake => {
  const f = new Fake();
  for (const [k, v] of Object.entries(props)) f.props.set(k, v);
  return f;
};
const GREY: Mode = { chroma: 'grey', vision: 'normal' };
const MONO: Mode = { chroma: 'mono', vision: 'normal', monoHue: -8 };
const FULL: Mode = { chroma: 'full', vision: 'normal' };
const PROD = HEX.teal54, FEED = HEX.orange50;   // a production's and a routed feed's TRUE colour

type G = { document?: unknown; Element?: unknown; MutationObserver?: unknown; getComputedStyle?: unknown };
const g = globalThis as unknown as G;
let saved: G;
let fire: (recs: unknown[]) => void;
beforeEach(() => {
  saved = { document: g.document, Element: g.Element, MutationObserver: g.MutationObserver, getComputedStyle: g.getComputedStyle };
  g.document = { createElement: () => new Fake() };
  g.Element = Fake;
  g.MutationObserver = class { constructor(cb: (r: unknown[]) => void) { fire = cb; } observe(): void {} disconnect(): void {} };
  setInkMode(GREY);
});
afterEach(() => { Object.assign(g, saved); setInkMode(FULL); });

describe('ink-inline: an open editor follows every mode change (ROAD-3465)', () => {
  it('the device rail and a feed chip paint resolved, repaint per mode and come back true', () => {
    const body = new Fake();
    const rail = with$({ '--lcars-accent': PROD });
    const chip = with$({ 'border-color': FEED, 'padding': '2px' });
    body.append(rail, chip);
    inkInline(body as unknown as Element);   // opened in grey
    expect(rail.props.get('--lcars-accent')).toBe(resolveColour(PROD, GREY));
    expect(chip.props.get('border-color')).toBe(resolveColour(FEED, GREY));
    expect(chip.props.get('padding')).toBe('2px');
    for (const m of [MONO, FULL, GREY, FULL]) {   // switch modes with the editor open
      setInkMode(m);
      repaintInkVars(body as unknown as ParentNode);
      fire([{ type: 'attributes', target: rail }, { type: 'attributes', target: chip }]);   // our own writes
      expect(rail.props.get('--lcars-accent')).toBe(resolveColour(PROD, m));
      expect(chip.props.get('border-color')).toBe(resolveColour(FEED, m));
    }
    expect(trueInkVar(chip as unknown as Element, 'border-color')).toBe(FEED);
  });

  it('a colour the editor writes later (a redraw, a new node) is taken as true and inked at once', () => {
    const body = new Fake();
    inkInline(body as unknown as Element);
    const late = with$({ color: FEED });
    body.append(late);
    fire([{ type: 'childList', addedNodes: [late] }]);
    expect(late.props.get('color')).toBe(resolveColour(FEED, GREY));
    late.props.set('color', PROD);   // the editor recolours it
    fire([{ type: 'attributes', target: late }]);
    expect(trueInkVar(late as unknown as Element, 'color')).toBe(PROD);
    expect(late.props.get('color')).toBe(resolveColour(PROD, GREY));
  });

  it('signal content (data-true-colour) and palette references are left as spelled', () => {
    const pic = new Fake(); pic.setAttribute('data-true-colour', '');
    const inPic = with$({ background: FEED });
    pic.append(inPic);
    inkStyle(inPic as unknown as HTMLElement);
    expect(inPic.props.get('background')).toBe(FEED);
    const pal = with$({ color: 'var(--pal-teal54)' });
    inkStyle(pal as unknown as HTMLElement);
    expect(pal.attrs.has('data-ink')).toBe(false);
  });

  it('a routed feed is read as its TRUE colour (its own --sig-node), never its paint', () => {
    const node = new Fake();
    setInkVar(node as unknown as HTMLElement, '--sig-node', FEED);
    g.getComputedStyle = () => ({ color: resolveColour(FEED, GREY) });   // var(--sig-node), resolved
    expect(trueColourOf(node as unknown as HTMLElement)).toBe(FEED);
  });
});
