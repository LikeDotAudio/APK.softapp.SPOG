// src/ui/console/lens-gather — read the console canvas as the graph the Discipline Lens
// projects (ROAD-3473). READ-ONLY: it never writes the DOM, a Production or a draft.
//
//   nodes = every destination twist (.twist-container) and every source feed in the
//           ingress rail (outermost .signal-node) — a node's `own` facts are its unrouted
//           port, so an empty Dante receiver still answers to ONLY Dante;
//   edges = every routed crosspoint: a source clone inside a twist's drop-zone (a dropped
//           group's members each count; the group chip follows them). An edge reads its
//           source node's facts — classes, data-wire / data-format / data-type — and falls
//           back to the twist's authored wire / format.
import type { ConnectionFacts } from '../../domain/lens/disciplines.js';
import type { LensEdge, LensGraph, LensNode } from '../../domain/lens/mask.js';
import { parseConfig } from './matrix-groups.js';

export interface LensScene {
  graph: LensGraph;
  nodeEls: Map<string, HTMLElement>;
  edgeEls: Map<string, HTMLElement>;
  /** Dropped-group chips and the edge ids inside them. */
  groups: Array<{ el: HTMLElement; edges: string[] }>;
}

/** The ingress node a routed clone came from: clone ids are `<source id>-<rid>` and the
 *  rid itself may hold '-', so strip trailing segments until a known id is left. Pure. */
export function resolveSourceId(cloneId: string, has: (id: string) => boolean): string | null {
  let id = cloneId;
  while (id.includes('-')) {
    id = id.slice(0, id.lastIndexOf('-'));
    if (has(id)) return id;
  }
  return null;
}

const factsOf = (el: HTMLElement): ConnectionFacts => ({
  wire: el.dataset.wire ?? null, format: el.dataset.format ?? null, type: el.dataset.type ?? null, tags: [...el.classList],
});

/** A source feed's own port: itself plus its sub-streams (a multiplex box carries all). */
function ownFacts(el: HTMLElement): ConnectionFacts {
  const subs = [...el.querySelectorAll<HTMLElement>('.signal-node')];
  const withWire = [el, ...subs].find((n) => n.dataset.wire);
  return {
    ...factsOf(el),
    wire: withWire?.dataset.wire ?? null,
    tags: [...el.classList, ...subs.flatMap((s) => [...s.classList])],
  };
}

const outermost = (n: HTMLElement): boolean => !n.parentElement?.closest('.signal-node');

/** The routed crosspoints inside one twist. */
function routedIn(twist: HTMLElement): HTMLElement[] {
  return [...twist.querySelectorAll<HTMLElement>('.signal-node')].filter((n) => {
    if (n.classList.contains('dropped-group')) return false;
    const up = n.parentElement?.closest('.signal-node');
    return !up || (up.classList.contains('dropped-group') && !!n.parentElement?.classList.contains('dropped-group-children'));
  });
}

/** Read the whole console under `root` as a lens graph. */
export function gatherScene(root: ParentNode = document): LensScene {
  const nodes: LensNode[] = [];
  const edges: LensEdge[] = [];
  const nodeEls = new Map<string, HTMLElement>();
  const edgeEls = new Map<string, HTMLElement>();
  const groups: LensScene['groups'] = [];

  root.querySelectorAll<HTMLElement>('.ingress-panel .signal-node').forEach((n) => {
    if (!n.id || !outermost(n) || nodeEls.has(n.id)) return;
    nodes.push({ id: n.id, own: ownFacts(n) });
    nodeEls.set(n.id, n);
  });
  const has = (id: string): boolean => nodeEls.has(id);

  root.querySelectorAll<HTMLElement>('.twist-container').forEach((tw, ti) => {
    const tid = `twist:${ti}`;
    const cfg = parseConfig(tw);
    const accepts = cfg?.accepts === 'both' ? ['audio', 'video'] : cfg?.accepts ? [cfg.accepts] : [];
    nodes.push({ id: tid, own: { wire: cfg?.wire ?? null, format: cfg?.format ?? null, tags: accepts } });
    nodeEls.set(tid, tw);
    const ids = new Map<HTMLElement, string>();
    routedIn(tw).forEach((el, ei) => {
      const eid = `${tid}:${ei}`;
      const f = factsOf(el);
      const from = (el.id && resolveSourceId(el.id, has)) || `${eid}:src`;
      edges.push({ id: eid, from, to: tid, facts: { ...f, wire: f.wire ?? cfg?.wire ?? null, format: f.format ?? cfg?.format ?? null } });
      edgeEls.set(eid, el);
      ids.set(el, eid);
    });
    tw.querySelectorAll<HTMLElement>('.signal-node.dropped-group').forEach((g) => {
      const inner = [...ids.entries()].filter(([el]) => g.contains(el)).map(([, id]) => id);
      if (inner.length) groups.push({ el: g, edges: inner });
    });
  });
  return { graph: { nodes, edges }, nodeEls, edgeEls, groups };
}
