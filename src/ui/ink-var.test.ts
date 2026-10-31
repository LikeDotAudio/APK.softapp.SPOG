// src/ui/ink-var.test — colours that were read once off the page and kept (the editor overlay's
// --ed-color, the gang elbow's --zone-color, a dropped group's colour) now carry their TRUE
// colour and repaint on every mode change (ROAD-3464). A tiny element stand-in; no DOM.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setInkVar, dropInkVar, trueInkVar, repaintInkVars, carryInk, inkAttr, inkValue, trueColourOf } from './ink-var.js';
import { setInkMode } from './canvas-ink.js';
import { resolveColour, type Mode } from '../domain/colour-resolve.js';
import { HEX } from '../domain/palette.js';
import { buildDroppedGroup } from './console/matrix-groups.js';

class Fake {
  attrs = new Map<string, string>();
  props = new Map<string, string>();
  children: Fake[] = [];
  parentElement: Fake | null = null;
  className = ''; id = ''; draggable = false; textContent = ''; innerText = '';
  classList = { remove: (): void => {} };
  style = Object.assign(Object.create(null), {
    setProperty: (k: string, v: string): void => { this.props.set(k, v); },
    getPropertyValue: (k: string): string => this.props.get(k) ?? '',
  }) as Record<string, unknown>;
  getAttribute(k: string): string | null { return this.attrs.get(k) ?? null; }
  setAttribute(k: string, v: string): void { this.attrs.set(k, v); }
  removeAttribute(k: string): void { this.attrs.delete(k); }
  hasAttribute(k: string): boolean { return this.attrs.has(k); }
  appendChild(c: Fake): Fake { c.parentElement = this; this.children.push(c); return c; }
  append(...c: Fake[]): void { c.forEach((x) => this.appendChild(x)); }
  addEventListener(): void {}
  cloneNode(): Fake { return new Fake(); }
  querySelectorAll(sel: string): Fake[] {
    const all: Fake[] = [];
    const walk = (n: Fake): void => n.children.forEach((c) => { all.push(c); walk(c); });
    walk(this);
    return sel === '[data-ink]' ? all.filter((n) => n.attrs.has('data-ink')) : all;
  }
}
const el = (): HTMLElement => new Fake() as unknown as HTMLElement;
const GREY: Mode = { chroma: 'grey', vision: 'normal' };
const MONO: Mode = { chroma: 'mono', vision: 'normal', monoHue: -8 };
const DATA = HEX.teal54;   // a Routes-style data colour

describe('ink-var: data colours repaint per mode (ROAD-3464)', () => {
  beforeEach(() => setInkMode(GREY));
  afterEach(() => setInkMode({ chroma: 'full', vision: 'normal' }));

  it('setInkVar paints resolved, keeps the true colour, and repaints it in the next mode', () => {
    const root = new Fake(), e = new Fake();
    root.appendChild(e);
    setInkVar(e as unknown as HTMLElement, '--ed-color', DATA);
    expect(e.props.get('--ed-color')).toBe(resolveColour(DATA, GREY));
    expect(trueInkVar(e as unknown as Element, '--ed-color')).toBe(DATA);
    setInkMode(MONO);
    repaintInkVars(root as unknown as ParentNode);
    expect(e.props.get('--ed-color')).toBe(resolveColour(DATA, MONO));
  });

  it('dropInkVar: a reused element (the overlay) stops repainting a colour it no longer shows', () => {
    const e = el();
    setInkVar(e, '--ed-color', DATA);
    setInkVar(e, '--other', DATA);
    dropInkVar(e, '--ed-color');
    expect(trueInkVar(e, '--ed-color')).toBeUndefined();
    expect(trueInkVar(e, '--other')).toBe(DATA);
    dropInkVar(e, '--other');
    expect(e.getAttribute('data-ink')).toBeNull();
  });

  it('carryInk: the gang elbow takes its first twist TRUE colour, not the resolved paint', () => {
    const html = `<div class="twist-container" ${inkAttr({ '--lcars-color': DATA })} style="--lcars-color: ${inkValue(DATA)};"></div>`;
    const [attr, style] = carryInk(html, '--lcars-color', '--zone-color');
    expect(attr).toBe(` ${inkAttr({ '--zone-color': DATA })}`);
    expect(style).toBe(` --zone-color:${resolveColour(DATA, GREY)};`);
    expect(carryInk('<div style="--lcars-color: #000"></div>', '--lcars-color', '--zone-color')).toEqual(['', '']);
  });

  it('a dropped group carries its source TRUE colour and repaints with the mode', () => {
    const g = globalThis as unknown as { document?: unknown; getComputedStyle?: unknown };
    const [doc, gcs] = [g.document, g.getComputedStyle];
    g.document = { createElement: () => new Fake(), createTextNode: () => new Fake() };
    const pool = new Fake(), src = new Fake();
    pool.appendChild(src);
    setInkVar(pool as unknown as HTMLElement, '--lcars-color', DATA);
    // the source paints var(--lcars-color): resolved for the mode, even when marked true-colour
    g.getComputedStyle = () => ({ color: resolveColour(DATA, GREY) });
    try {
      expect(trueColourOf(src as unknown as HTMLElement)).toBe(DATA);
      expect(src.hasAttribute('data-true-colour')).toBe(false);
      const grp = buildDroppedGroup('BOX', trueColourOf(src as unknown as HTMLElement), [], '') as unknown as Fake;
      expect(grp.style.color).toBe('var(--dg-color)');
      expect(grp.props.get('--dg-color')).toBe(resolveColour(DATA, GREY));
      const root = new Fake();
      root.appendChild(grp);
      setInkMode(MONO);
      repaintInkVars(root as unknown as ParentNode);
      expect(grp.props.get('--dg-color')).toBe(resolveColour(DATA, MONO));
      // a palette-class colour (data-true-colour reads it as spelled) is taken as read
      g.getComputedStyle = () => ({ color: 'rgb(1, 2, 3)' });
      expect(trueColourOf(src as unknown as HTMLElement)).toBe('rgb(1, 2, 3)');
    } finally { g.document = doc; g.getComputedStyle = gcs; }
  });
});
