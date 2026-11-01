// src/ui/console/router-view-lens — the Discipline Lens on the 1990s grid (ROAD-3479).
// The grid's rows and columns ARE the canvas's source feeds and twists, and a routed
// cell IS a crosspoint clone, so the grid reads the mask the lens painted on those
// elements (lens.ts applyLens, called first) rather than projecting a second time:
//   hidden  (HIDE)  → the row / column leaves the grid, a routed cell goes blank
//   dimmed  (DIM)   → the header and its cells take the same opacity
// A folded group shows at the strongest of its members. The lens state stays the
// seat's view setting; nothing here writes it.

const OPACITY_VAR = '--lens-opacity';

/** What the lens did to one canvas element: 1 shown, 0 hidden, else its dim. */
export function lensOpacity(el: HTMLElement | null | undefined): number {
  // The lens paints the OUTERMOST node (a multiplex box, the twist); a sub-stream
  // row takes its box's mask.
  const m = el?.closest<HTMLElement>('.lens-hidden, .lens-masked');
  if (!m) return 1;
  if (m.classList.contains('lens-hidden')) return 0;
  const v = parseFloat(m.style.getPropertyValue(OPACITY_VAR));
  return Number.isFinite(v) ? v : 0.3;
}

/** A plan item (one leaf, or a folded group of them) at its strongest member. Pure. */
export function itemOpacity(ids: ReadonlyArray<readonly [string, string]>, of: ReadonlyMap<string, number>, sep: string): number {
  let best = 0;
  for (const id of ids) best = Math.max(best, of.get(id.join(sep)) ?? 1);
  return ids.length ? best : 1;
}

/** The inline attributes a cell or header takes for an opacity (none at full). */
export function lensAttr(op: number): { cls: string; style: string } {
  if (op >= 1) return { cls: '', style: '' };
  if (op <= 0) return { cls: ' lens-hidden', style: '' };
  return { cls: '', style: ` style="opacity:${op}"` };
}

/** Dim the header cells of a built grid (data-r on row heads, data-c on column heads). */
export function paintHeads(tbl: HTMLTableElement, rowOp: number[], colOp: number[]): void {
  const set = (el: HTMLElement, op: number): void => {
    el.classList.toggle('lens-hidden', op <= 0);
    if (op > 0 && op < 1) el.style.opacity = String(op); else el.style.removeProperty('opacity');
  };
  tbl.querySelectorAll<HTMLElement>('.rv-feedhead[data-r]').forEach((h) => set(h, rowOp[Number(h.dataset.r)] ?? 1));
  tbl.querySelectorAll<HTMLElement>('.rv-twisthead[data-c]').forEach((h) => set(h, colOp[Number(h.dataset.c)] ?? 1));
}
