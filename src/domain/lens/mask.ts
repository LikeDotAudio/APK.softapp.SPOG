// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/domain/lens/mask — WHAT the Discipline Lens does to a drawing (ROAD-3473).
 *
 *  The lens is a VIEW PROJECTION: a lens state plus a graph in, a fresh mask per node and
 *  per edge out. The graph is only read — never written, never re-shaped — so the project
 *  / netlist a canvas was drawn from is the same object, deep-equal, before and after.
 *  The lens state itself belongs to the operator's view settings, never to a project.
 *
 *    • ALL (showing = null) is the free default: every mask is full strength.
 *    • ONLY isolates one discipline; shift-toggling builds a set.
 *    • strength 0…1 is the DIM / HIDE slider: what the lens is not showing fades to
 *      `1 - 0.9 × strength`, and at 1 it is hidden (kept in place, never removed).
 *    • an edge is in the lens when any of its disciplines is showing; a node when any of
 *      its edges is — or, with no edges at all, when its own unrouted port (`own`) is.
 *  Pure: no DOM. */

import { classifyConnection, isDiscipline, DISCIPLINES, type ConnectionFacts, type DisciplineId } from './disciplines.js';

export interface LensState {
  /** The disciplines showing; null = ALL. */
  showing: DisciplineId[] | null;
  /** DIM → HIDE strength, 0…1 (1 hides). */
  strength: number;
}

export const DEFAULT_STRENGTH = 0.75;
export const ALL_LENS: LensState = { showing: null, strength: DEFAULT_STRENGTH };

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Read a stored lens state; junk falls back to ALL rather than masking a drawing blind. */
export function toLensState(raw: unknown): LensState {
  if (!raw || typeof raw !== 'object') return { ...ALL_LENS };
  const r = raw as { showing?: unknown; strength?: unknown };
  const strength = typeof r.strength === 'number' && Number.isFinite(r.strength) ? clamp01(r.strength) : DEFAULT_STRENGTH;
  const ids = Array.isArray(r.showing) ? [...new Set(r.showing.filter(isDiscipline))] : [];
  return { showing: normalise(ids), strength };
}

/** A set that is empty or everything means ALL. */
function normalise(ids: DisciplineId[]): DisciplineId[] | null {
  if (!ids.length || ids.length >= DISCIPLINES.length) return null;
  return DISCIPLINES.map((d) => d.id).filter((id) => ids.includes(id));
}

export const isAll = (s: LensState): boolean => s.showing === null;
/** The one discipline isolated, if exactly one is showing. */
export const onlyOf = (s: LensState): DisciplineId | null => (s.showing && s.showing.length === 1 ? s.showing[0] ?? null : null);

/** ONLY: isolate one discipline; ONLY on the already-isolated one returns to ALL. */
export function isolateLens(s: LensState, id: DisciplineId): LensState {
  return { ...s, showing: onlyOf(s) === id ? null : [id] };
}

/** Add / remove one discipline from what is showing (from ALL, removing keeps the rest). */
export function toggleLens(s: LensState, id: DisciplineId): LensState {
  const cur = s.showing ?? DISCIPLINES.map((d) => d.id);
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  return { ...s, showing: normalise(next) };
}

export const resetLens = (s: LensState): LensState => ({ ...s, showing: null });
export const withStrength = (s: LensState, strength: number): LensState => ({ ...s, strength: clamp01(strength) });

// ---- the projection ---------------------------------------------------------------------
export interface LensEdge { id: string; from: string; to: string; facts: ConnectionFacts }
export interface LensNode { id: string; own?: ConnectionFacts }
export interface LensGraph { nodes: readonly LensNode[]; edges: readonly LensEdge[] }

export interface Mask { visible: boolean; dimmed: boolean; opacity: number }
export interface LensMaskResult {
  nodes: Map<string, Mask>;
  edges: Map<string, Mask>;
  /** Each edge's disciplines (for tinting / counts) — computed once here. */
  disciplines: Map<string, DisciplineId[]>;
}

export const FULL: Readonly<Mask> = Object.freeze({ visible: true, dimmed: false, opacity: 1 });

/** The mask for something the lens is NOT showing, at this strength. */
export function maskedAt(strength: number): Mask {
  const s = clamp01(strength);
  if (s >= 1) return { visible: false, dimmed: true, opacity: 0 };
  return { visible: true, dimmed: s > 0, opacity: Math.round((1 - 0.9 * s) * 1000) / 1000 };
}

export function inLens(ids: readonly DisciplineId[], s: LensState): boolean {
  return s.showing === null || ids.some((id) => s.showing!.includes(id));
}

/** lens state + graph → a mask per node and per edge. Reads the graph, never writes it. */
export function lensMask(graph: LensGraph, s: LensState): LensMaskResult {
  const nodes = new Map<string, Mask>();
  const edges = new Map<string, Mask>();
  const disciplines = new Map<string, DisciplineId[]>();
  const off = maskedAt(s.strength);
  const lit = new Set<string>();
  const touched = new Set<string>();
  for (const e of graph.edges) {
    const ids = classifyConnection(e.facts);
    disciplines.set(e.id, ids);
    const on = inLens(ids, s);
    edges.set(e.id, on ? { ...FULL } : { ...off });
    touched.add(e.from); touched.add(e.to);
    if (on) { lit.add(e.from); lit.add(e.to); }
  }
  for (const n of graph.nodes) {
    const on = lit.has(n.id) || (!touched.has(n.id) && !!n.own && inLens(classifyConnection(n.own), s));
    nodes.set(n.id, on || s.showing === null ? { ...FULL } : { ...off });
  }
  return { nodes, edges, disciplines };
}

/** How many edges each discipline holds — the toolbar shows which lenses have anything. */
export function disciplineCounts(res: LensMaskResult): Map<DisciplineId, number> {
  const out = new Map<DisciplineId, number>();
  for (const ids of res.disciplines.values()) for (const id of ids) out.set(id, (out.get(id) ?? 0) + 1);
  return out;
}
