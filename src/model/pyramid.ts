// src/model/pyramid — the typed shapes of an imported topology and of the loading
// pyramid it is read back as (ROAD-3474). One project shape (`Topology`: devices +
// wires, each device in exactly one group) that every import adapter translates
// into, and the levels a reader climbs:
//
//   L0 Identity   name · version · counts                     (tiny, always)
//   L1 Skeleton   every group's bounding box + chunk index     (tens of KB)
//   L2 Devices    one group's placed devices                   (per group, on view)
//   L3 Wires      the wires with an end in that group          (same chunk as L2)
//   L4 Full model the whole Topology — editing waits for it
//   L5 Derived    reports computed from L4 on demand
//
// Types only: the logic is domain/pyramid (pure) and platform/pyramid + import.

export type PyramidLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type Side = 'source' | 'destination';

/** A device: a source box (its feeds are its ports) or a destination twist. */
export interface TopoDevice {
  id: string;
  name: string;
  /** The group this device is drawn in — a wall of boxes or a room of twists. */
  group: string;
  side: Side;
  kind?: string;
  color?: string;
  status?: string;
  accepts?: string;
  row?: string;
  ports: string[];
}

export interface WireEnd { device: string; port: string }
/** A connection: a source feed routed into a destination twist (a crosspoint). */
export interface TopoWire { id: string; from: WireEnd; to: WireEnd; type?: string }

export interface Topology {
  schema: 'spog.topology/1';
  name: string;
  devices: TopoDevice[];
  wires: TopoWire[];
}

export interface Box { x: number; y: number; w: number; h: number }

/** L0 — what a project list shows. */
export interface Identity { name: string; version: number; devices: number; wires: number; groups: number }

/** One group's L1 entry: where it is, how big, and the hash its chunk is stored under. */
export interface SkeletonGroup { id: string; side: Side; box: Box; devices: number; hash: string }

/** L1 — every group box plus the chunk index. */
export interface Skeleton { identity: Identity; groups: SkeletonGroup[] }

export interface PlacedDevice extends TopoDevice { box: Box }

/** L2 + L3 for one group: its placed devices and every wire with an end in it. */
export interface Chunk { group: string; hash: string; devices: PlacedDevice[]; wires: TopoWire[] }
