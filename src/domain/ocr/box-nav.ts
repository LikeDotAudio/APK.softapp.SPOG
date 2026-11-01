// src/domain/ocr/box-nav — keyboard movement between word boxes by GEOMETRY
// (ROAD-3475). Pure.
//
// The arrow keys go to the nearest box that actually lies that way in the photo:
// RIGHT is the next word on the same row, DOWN the word below — not "the next
// item in a list". (OneThing's getAdjacentBoxId, the reference, mapped all four
// arrows onto list order, so DOWN went to the word on the right.) Tab / Shift+Tab
// walk reading order. An arrow with nothing that way stays put.

export type BoxDir = 'left' | 'right' | 'up' | 'down' | 'next' | 'prev';

export interface Box { id: string; x0: number; y0: number; x1: number; y1: number }

const cx = (b: Box): number => (b.x0 + b.x1) / 2;
const cy = (b: Box): number => (b.y0 + b.y1) / 2;
/** How much two boxes share vertically, as a fraction of the shorter one. */
const vOverlap = (a: Box, b: Box): number =>
  Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)) / Math.max(1, Math.min(a.y1 - a.y0, b.y1 - b.y0));

/** Reading order: rows top to bottom (a box joins a row it half-overlaps), then left to right. */
export function readingOrder<T extends Box>(boxes: readonly T[]): T[] {
  const rows: T[][] = [];
  for (const b of [...boxes].sort((p, q) => cy(p) - cy(q))) {
    const row = rows.find((r) => r.some((o) => vOverlap(o, b) >= 0.5));
    if (row) row.push(b); else rows.push([b]);
  }
  rows.sort((r, s) => Math.min(...r.map(cy)) - Math.min(...s.map(cy)));
  return rows.flatMap((r) => r.sort((p, q) => p.x0 - q.x0));
}

/**
 * The box to select after pressing `dir` on `currentId`. No selection (or an id
 * not on the page) selects the first box in reading order; an empty page gives ''.
 */
export function getAdjacentBoxId(boxes: readonly Box[], currentId: string | null, dir: BoxDir): string {
  if (!boxes.length) return '';
  const order = readingOrder(boxes);
  const cur = order.find((b) => b.id === currentId);
  if (!cur) return order[0]!.id;
  if (dir === 'next' || dir === 'prev') {
    const i = order.indexOf(cur);
    return order[(i + (dir === 'next' ? 1 : -1) + order.length) % order.length]!.id;
  }
  const horizontal = dir === 'left' || dir === 'right';
  const sign = dir === 'right' || dir === 'down' ? 1 : -1;
  let best: Box | null = null, bestScore = Infinity;
  for (const b of boxes) {
    if (b.id === cur.id) continue;
    // Along the axis: centre to centre, and it must point the way pressed.
    const along = horizontal ? sign * (cx(b) - cx(cur)) : sign * (cy(b) - cy(cur));
    if (along <= 0) continue;
    const sameRow = vOverlap(cur, b) >= 0.5;
    if (!horizontal && sameRow) continue;   // a tilted photo must not make the next word "below"
    const across = horizontal ? Math.abs(cy(b) - cy(cur)) : Math.abs(cx(b) - cx(cur));
    // Off-axis distance counts triple; a box on the same row wins any left/right.
    const score = (horizontal && !sameRow ? 1e6 : 0) + along + 3 * across;
    if (score < bestScore) { best = b; bestScore = score; }
  }
  return best ? best.id : cur.id;
}

/** The key a keydown means, or null for keys the overlay does not handle. */
export function dirOfKey(key: string, shift: boolean): BoxDir | null {
  switch (key) {
    case 'ArrowLeft': return 'left';
    case 'ArrowRight': return 'right';
    case 'ArrowUp': return 'up';
    case 'ArrowDown': return 'down';
    case 'Tab': return shift ? 'prev' : 'next';
    default: return null;
  }
}
