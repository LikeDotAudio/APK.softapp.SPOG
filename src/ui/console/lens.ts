// src/ui/console/lens — the Discipline Lens on the console canvas (ROAD-3473).
//
// One lens per seat, held in the seat's VIEW prefs (prefs.ui.lens) — never in a
// Production, a routes draft or a netlist. Applying it only toggles two classes and one
// custom property on nodes the console already drew: `.lens-masked` (dim, via
// --lens-opacity) and `.lens-hidden` (visibility, so nothing reflows and every drop math
// stays put). The pure halves: domain/lens/disciplines.ts (what a connection is) and
// domain/lens/mask.ts (what the lens does to a graph); lens-gather.ts reads the canvas,
// lens-bar.ts is the header toolbar.
//
// It re-applies when the canvas changes shape (a room drawn, a route made / broken, the
// rail redrawn) — a MutationObserver filtered to those elements, coalesced per frame.
import { getPrefs, patchPrefs } from '../../platform/prefs.js';
import {
  toLensState, isolateLens, toggleLens, resetLens, withStrength, lensMask, disciplineCounts, isAll,
  type LensState, type Mask,
} from '../../domain/lens/mask.js';
import { gatherScene } from './lens-gather.js';
import { buildLensBar, paintLensBars, ensureLensStyles, type LensAction } from './lens-bar.js';

let state: LensState = toLensState(undefined);
let queued = false;

const MASK_CLASSES = ['lens-masked', 'lens-hidden'];

function paintEl(node: HTMLElement, m: Mask): void {
  node.classList.toggle('lens-hidden', !m.visible);
  node.classList.toggle('lens-masked', m.visible && m.dimmed);
  if (m.visible && m.dimmed) node.style.setProperty('--lens-opacity', String(m.opacity));
  else node.style.removeProperty('--lens-opacity');
}

function clearAll(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.lens-masked, .lens-hidden').forEach((n) => {
    n.classList.remove(...MASK_CLASSES);
    n.style.removeProperty('--lens-opacity');
  });
}

/** Read the canvas, project the lens, paint the masks and the toolbars. */
export function applyLens(root: ParentNode = document): void {
  mountBars(root);
  const scene = gatherScene(root);
  const res = lensMask(scene.graph, state);
  // A routed clone copies its source's lens classes — wipe, then paint what the lens says.
  clearAll(root);
  if (!isAll(state)) {
    res.nodes.forEach((m, id) => { const n = scene.nodeEls.get(id); if (n) paintEl(n, m); });
    res.edges.forEach((m, id) => { const n = scene.edgeEls.get(id); if (n) paintEl(n, m); });
    // A dropped-group chip follows its members: lit if any member is.
    for (const g of scene.groups) {
      const ms = g.edges.map((id) => res.edges.get(id)).filter((m): m is Mask => !!m);
      const best = ms.find((m) => !m.dimmed) ?? ms[0];
      if (best) paintEl(g.el, best);
    }
  }
  paintLensBars(state, disciplineCounts(res), root);
}

function schedule(): void {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; applyLens(); });
}

function setState(next: LensState, persist: boolean): void {
  state = next;
  if (persist) patchPrefs({ ui: { lens: { showing: next.showing, strength: next.strength } } });
  applyLens();
}

function act(a: LensAction): void {
  if (a.type === 'all') setState(resetLens(state), true);
  else if (a.type === 'only') setState(isolateLens(state, a.id), true);
  else if (a.type === 'toggle') setState(toggleLens(state, a.id), true);
  else setState(withStrength(state, a.value), a.commit);
}

/** Give every room canvas header its toolbar (rooms re-render their innerHTML). */
function mountBars(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.program-row').forEach((row) => {
    if (row.querySelector(':scope > .lens-bar')) return;
    const title = row.querySelector<HTMLElement>(':scope > .program-title');
    if (title) title.after(buildLensBar(act));
  });
}

const SHAPES = '.signal-node, .twist-container, .program-row, .matrix-container, .drop-zone, .pool-content';
const shapes = (nodes: NodeList): boolean =>
  [...nodes].some((n) => n instanceof HTMLElement && !n.classList.contains('lens-bar') && (n.matches(SHAPES) || !!n.querySelector(SHAPES)));

/** Boot the lens: read the seat's view prefs, follow canvas changes and prefs changes. */
export function initDisciplineLens(): void {
  ensureLensStyles();
  state = toLensState(getPrefs().ui.lens);
  new MutationObserver((recs) => {
    if (recs.some((r) => shapes(r.addedNodes) || shapes(r.removedNodes))) schedule();
  }).observe(document.body, { childList: true, subtree: true });
  // Another tab / the seat bus reconcile adopted new prefs: follow them.
  document.addEventListener('prefs-change', (e) => {
    const lens = (e as CustomEvent<{ ui?: { lens?: unknown } }>).detail?.ui?.lens;
    const next = toLensState(lens);
    if (JSON.stringify(next) !== JSON.stringify(state)) { state = next; schedule(); }
  });
  applyLens();
}
