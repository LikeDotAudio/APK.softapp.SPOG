// src/platform/import/projects — the committed side of an import: the head version
// of each project by name, so the next import of the same name is a delta and the
// NEXT version of its series, never a silent replacement. SPOG has no project
// database yet; this is the in-memory store for a page's life. A server-backed
// store (POD.database) is the same three methods — a swap of sink, not a rewrite.
import type { Topology } from '../../model/pyramid.js';

export interface ProjectHead { version: number; topology: Topology }

export interface ProjectStore {
  get(name: string): ProjectHead | undefined;
  put(name: string, version: number, topology: Topology): void;
  names(): string[];
}

export function memoryProjects(): ProjectStore {
  const heads = new Map<string, ProjectHead>();
  return {
    get: (n) => heads.get(n),
    put: (n, version, topology) => { heads.set(n, { version, topology }); },
    names: () => [...heads.keys()],
  };
}
