// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/ui/ink-inline — every literal colour an editor writes into an inline style, seen through
 *  the mode and repainted on every mode change (ROAD-3465).
 *
 *  An editor is handed TRUE colours (the production's, each routed feed's: app/context.ts) and
 *  paints them however it likes — a template's `style="color:…"`, `el.style.borderColor = …`, a
 *  widget's `--cyan:…`. PAL colours are `var(--pal-*)` and follow the mode already; a literal in an
 *  inline style is a data or computed colour, which would keep its true colour (or, before
 *  ROAD-3465, the mode the editor opened in). `inkInline(root)` watches `root`: each inline
 *  declaration holding a literal is handed to `setInkVar`, so it is painted resolved now and
 *  `repaintInkVars()` re-resolves it after each mode change — the DOM twin of canvas-ink's
 *  setters. A subtree marked `data-true-colour` (signal content) is left as spelled. */

import { inkValue, setInkVar, trueInkVar } from './ink-var.js';

const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;
type Styled = Element & ElementCSSInlineStyle;

let probe: HTMLElement | null = null;
/** `value` as the browser stores it on `prop` (a short hex reads back as rgb triple syntax). */
function stored(prop: string, value: string): string {
  probe ??= document.createElement('i');
  probe.style.setProperty(prop, value);
  const v = probe.style.getPropertyValue(prop);
  probe.style.removeProperty(prop);
  return v;
}

/** Record every literal-colour declaration on `el` as its true colour, unless it is already our paint. */
export function inkStyle(el: Styled): void {
  if (!LITERAL.test(el.getAttribute('style') ?? '') || el.closest('[data-true-colour]')) return;
  const s = el.style;
  for (let i = 0; i < s.length; i++) {
    const prop = s.item(i);
    const value = s.getPropertyValue(prop);
    if (!LITERAL.test(value)) continue;
    const t = trueInkVar(el, prop);
    if (t !== undefined && stored(prop, inkValue(t)) === value) continue;   // our own paint
    setInkVar(el as HTMLElement, prop, value);
  }
}

const sweep = (n: Node): void => {
  if (!(n instanceof Element)) return;
  if ('style' in n) inkStyle(n as Styled);
  n.querySelectorAll('[style]').forEach((e) => inkStyle(e as Styled));
};

/** Ink `root`'s inline colours now and whenever an inline style or a node is added; returns the
 *  disconnect (an editor overlay's dispose). Records run before the next paint, so a true colour
 *  never shows. */
export function inkInline(root: Element): () => void {
  sweep(root);
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      if (r.type === 'attributes') inkStyle(r.target as Styled);
      else r.addedNodes.forEach(sweep);
    }
  });
  mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
  return () => mo.disconnect();
}
