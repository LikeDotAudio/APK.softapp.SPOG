// src/ui/identity-line — a device card's label identity (serial, asset tag, MAC),
// drawn as one quiet line under the card's title (ROAD-3479). The SCAN and OCR
// panels' Fill writes these fields through the authoring commit; before this no
// SPOG view drew them, so a Fill landed in the draft with nothing redrawing.
//
//   destination  under the room's .program-title, and under each twist's
//                .twist-title for a twist that carries its own identity
//   source       under the pool's header (the pool grid carries the leaf id)
//
// The line is a SIBLING of the title, never inside it: other modules read the
// title's text as the room / pool name.
import { destTabId } from '../domain/scan/netlist.js';
import { addStyles } from './dom.js';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** "S/N 123 · TAG A-7 · MAC 00:1D:…" — a discovered device's own serial/MAC
 *  stand in when the card records none. Empty when nothing is known. Pure. */
export function identityText(o: unknown): string {
  if (!isObj(o)) return '';
  const dev = isObj(o.device) ? o.device : {};
  const parts: string[] = [];
  const serial = str(o.serial) || str(dev.serial), tag = str(o.asset_tag), mac = str(o.mac) || str(dev.mac);
  if (serial) parts.push(`S/N ${serial}`);
  if (tag) parts.push(`TAG ${tag}`);
  if (mac) parts.push(`MAC ${mac}`);
  return parts.join(' · ');
}

const CSS = `.identity-line{font:10px/1.3 var(--mono-font,monospace);letter-spacing:.5px;opacity:.75;
padding:1px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}`;

/** Set (or clear) the identity line right after `title`. */
export function paintAfter(title: Element | null | undefined, o: unknown): void {
  if (!title?.parentElement) return;
  const text = identityText(o);
  let line = title.nextElementSibling;
  if (!line?.classList.contains('identity-line')) line = null;
  if (!text) { line?.remove(); return; }
  addStyles('identity-line-styles', CSS);
  if (!line) {
    line = document.createElement('div');
    line.className = 'identity-line';
    title.after(line);
  }
  line.textContent = text;
  (line as HTMLElement).title = text;
}

/** A rendered destination pane: the room and every twist that carries identity. */
export function paintDestination(doc: unknown, pane: HTMLElement): void {
  if (!isObj(doc)) return;
  paintAfter(pane.querySelector('.program-title'), doc);
  const kit = isObj(doc.kit) ? doc.kit : {};
  const twists = Array.isArray(doc.twists) ? doc.twists : Array.isArray(kit.twists) ? kit.twists : [];
  pane.querySelectorAll<HTMLElement>('.twist-container[data-twist-index]').forEach((tw) => {
    const t: unknown = twists[Number(tw.dataset.twistIndex)];
    paintAfter(tw.querySelector(':scope > .twist-title'), isObj(t) ? t : null);
  });
}

/** A rendered source pool (its grid carries the leaf id). */
export function paintSource(doc: unknown, root: ParentNode = document): void {
  if (!isObj(doc) || typeof doc.id !== 'string' || !doc.id) return;
  const grid = root.querySelector(`[id="${doc.id.replace(/["\\]/g, '\\$&')}"]`);
  paintAfter(grid?.closest('.input-group')?.querySelector(':scope > .foldable-header'), doc);
}

/** Redraw the identity of whatever card shows the Routes document at `url` — the
 *  rerender a SCAN / OCR Fill (and its undo) hands the authoring commit. */
export function refreshIdentity(url: string, doc: unknown): void {
  if (url.includes('/Destinations/')) {
    const pane = document.getElementById('tab-' + destTabId(url));
    if (pane) paintDestination(doc, pane);
  } else paintSource(doc);
}
