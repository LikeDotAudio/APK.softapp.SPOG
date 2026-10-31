// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/ui/console/emoji-ink — colour emoji follow every mode (ROAD-3463 grey, ROAD-3464 all).
 *
 *  An emoji is a glyph from a colour font (Noto Color Emoji): no `--pal-*` token reaches it.
 *  Filtering the element that holds one applied mono / high / low twice to the element's own,
 *  already-resolved paint, so each run of colour emoji goes into its own
 *  `<span data-emoji>`, and lcars.css gives that span `filter: var(--emoji-filter)`: the mode's
 *  chain as CSS (colour-resolve.ts cssFilter, the same steps resolveColour runs). Text-glyph
 *  pictographs (©, a U+FE0E ✋, one the text font draws) paint in `color` and stay out: a canvas
 *  probe asks whether the glyph ignores its fill. In a flex or grid parent the text node is wrapped
 *  whole first, so it stays one item. Never inside a signal surface (`data-true-colour`), SVG,
 *  form text or an editable region. */

import { emojiRuns, presentsAsEmoji } from './emoji-runs.js';
import { withTrueColour } from '../../domain/true-colour.js';
import { formatColour } from '../../domain/colour-resolve.js';

const SKIP = '[data-true-colour],[data-emoji],svg,script,style,title,textarea,select,option,[contenteditable]';
const ROUGH = /[\p{Extended_Pictographic}\p{RI}⃣]/u;
const PROBE = formatColour(255, 0, 255);   // the probe's fill, never on screen: a text glyph paints exactly it
const probed = new Map<string, boolean>();
let probe: CanvasRenderingContext2D | null | undefined;

/** Does `cluster` draw from a colour font in `family`? A text glyph paints exactly its fill. */
function isColour(cluster: string, family: string): boolean {
  const key = `${family}\u0000${cluster}`;
  const hit = probed.get(key);
  if (hit !== undefined) return hit;
  if (probe === undefined) probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  let colour = presentsAsEmoji(cluster);
  if (probe) {
    const p = probe;
    p.canvas.width = p.canvas.height = 40;
    colour = withTrueColour(p, () => {
      p.font = `28px ${family}`;
      p.fillStyle = PROBE;
      p.fillText(cluster, 4, 32);
      const d = p.getImageData(0, 0, 40, 40).data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]! > 128 && (d[i + 1]! > 40 || Math.abs(d[i]! - d[i + 2]!) > 40)) return true;
      return false;
    });
  }
  probed.set(key, colour);
  return colour;
}

function wrapOne(t: Text): void {
  const p = t.parentElement;
  if (!p || !ROUGH.test(t.data) || p.closest(SKIP)) return;
  const cs = getComputedStyle(p);
  const runs = emojiRuns(t.data, (c) => isColour(c, cs.fontFamily));
  if (!runs.length) return;
  let host: Node = t;
  if (/flex|grid/.test(cs.display)) {   // the text node is ONE item there: keep it one
    const item = document.createElement('span');
    p.replaceChild(item, t);
    item.append(t);
    host = item;
  }
  const frag = document.createDocumentFragment();
  let at = 0;
  for (const [s, e] of runs) {
    if (s > at) frag.append(t.data.slice(at, s));
    const span = document.createElement('span');
    span.setAttribute('data-emoji', '');
    span.textContent = t.data.slice(s, e);
    frag.append(span);
    at = e;
  }
  if (at < t.data.length) frag.append(t.data.slice(at));
  (host === t ? p : host).replaceChild(frag, t);
}

function wrapAll(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) { wrapOne(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  const found: Text[] = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) found.push(n as Text);
  found.forEach(wrapOne);
}

let observer: MutationObserver | null = null;

/** Wrap colour emoji (any mode but full colour at normal vision) or stop wrapping; idempotent. The
 *  spans stay when off: lcars.css's `--emoji-filter` is `none` then. */
export function applyEmojiInk(on: boolean): void {
  if (typeof MutationObserver === 'undefined') return;
  if (!document.body) {   // painted before <body> exists: catch up once it does, in whatever mode is current then
    document.addEventListener('DOMContentLoaded', () => applyEmojiInk(getComputedStyle(document.documentElement).getPropertyValue('--emoji-filter').trim() !== 'none'), { once: true });
    return;
  }
  if (!on) { observer?.disconnect(); observer = null; return; }
  if (observer) return;
  wrapAll(document.body);
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') wrapAll(r.target);
      else r.addedNodes.forEach(wrapAll);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
