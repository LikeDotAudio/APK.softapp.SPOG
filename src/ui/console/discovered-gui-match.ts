// src/ui/console/discovered-gui-match — which GUI panel belongs to which
// discovered device. Pure (no DOM, no bus) so it is testable; discovered-gui.ts
// owns subscribing and drawing.
//
// A device presents its own panel, retained at `APK.audio/System/Gui/Panels/<key>`
// ({ key, folder, device: { serial, resource, … } } — DISCOVERY.Engine RUNNER
// panels.rs). The engine's setup names the same device by MAC or serial
// (discovered-layer.ts). Identity is serial/MAC, so that is the first join; the
// two that follow are for hunters whose panel serial is their own id:
//   1. the panel's serial IS the device's serial or MAC (separators ignored);
//   2. the device's name CARRIES the panel's serial (a cast device is named
//      `Chromecast-<id>` and its panel's serial is that id);
//   3. the panel's key carries the device's name (`appletv-Living-Room_local`).
// A device with several panels (a Dante box has one per channel too) shows the
// shortest key — the device's own console, not one of its channels.

import { primaryWire, type DeviceSetup } from './discovered-layer.js';

export { primaryWire, GENERIC_WIRES } from './discovered-layer.js';

/** One retained panel, as much of it as SPOG needs: who it is (key, folder,
 *  serial, model, resource), whether it takes commands (`command`: the document
 *  names a `device.write_topic`), and how many pages it has (`pages`: its
 *  placements that carry frames). A panel with a command and at least one page
 *  is a TOUCH PANEL — a front panel that controls the box; one without a command
 *  only DISPLAYS it. */
export interface PanelRef {
  key: string;
  folder: string;
  serial: string;
  model?: string;
  resource?: string;
  command?: boolean;
  pages?: number;
}

export const PANELS_TOPIC = 'APK.audio/System/Gui/Panels/+';

const norm = (s: string | null | undefined): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** A retained panel document as a PanelRef, or null for an erase / a stranger. */
export function panelRef(topic: string, payload: unknown): PanelRef | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as {
    key?: unknown; folder?: unknown; placements?: unknown;
    device?: { serial?: unknown; model?: unknown; resource?: unknown; write_topic?: unknown };
  };
  const key = typeof p.key === 'string' ? p.key : topic.split('/').pop() ?? '';
  if (!key) return null;
  const pages = Array.isArray(p.placements)
    ? p.placements.filter((pl) => !!pl && Array.isArray((pl as { frames?: unknown }).frames) && (pl as { frames: unknown[] }).frames.length > 0).length
    : 0;
  const ref: PanelRef = {
    key,
    folder: typeof p.folder === 'string' ? p.folder : key,
    serial: p.device?.serial == null ? '' : String(p.device.serial),
    command: typeof p.device?.write_topic === 'string' && p.device.write_topic.length > 0,
    pages,
  };
  if (typeof p.device?.model === 'string' && p.device.model) ref.model = p.device.model;
  if (typeof p.device?.resource === 'string' && p.device.resource) ref.resource = p.device.resource;
  return ref;
}

/** The panel that is this device's GUI, or null. */
export function panelFor(device: DeviceSetup, panels: Iterable<PanelRef>): PanelRef | null {
  const ids = new Set([norm(device.serial), norm(device.mac)].filter((s) => s.length >= 6));
  const name = norm(device.name);
  const hits: PanelRef[] = [];
  for (const p of panels) {
    const serial = norm(p.serial);
    if ((serial && ids.has(serial))
      || (serial.length >= 8 && name.includes(serial))
      || (name.length >= 4 && norm(p.key).includes(name))) hits.push(p);
  }
  hits.sort((a, b) => a.key.length - b.key.length || a.key.localeCompare(b.key));
  return hits[0] ?? null;
}

/** The OS's own slug for a tab (core/route/route.js OS.routeSlug). */
export const routeSlug = (v: string): string =>
  v.replace(/\.json$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Where the OS draws one device's panel: the Device Consoles display, solo,
 *  on that device's tab. `osBase` is the OS's index.html. */
export const panelUrl = (osBase: string, p: PanelRef): string =>
  `${osBase}?solo=Device_Consoles&tab=${encodeURIComponent(routeSlug(p.folder))}`;

/** The touch panel, RUNNING — the Touch Panel Builder's run.html: the device's
 *  presented panel full size, every touch a command to the box, every readout
 *  its readback. `?panelrunner=<url>` overrides where it is served. */
export const RUNNER_PATH = '/Softapps/EDITORS/EDITORS.TouchPanelBuilder/run.html';

/** The protocol a runner link names: the device's own wire for an instrument
 *  (`visa`), else the most specific wire it was found on. */
export function runnerProtocol(device: DeviceSetup): string {
  if (device.wires.includes('visa')) return 'visa';
  return primaryWire(device);
}

/** Where the running front panel for this device is: run.html with the box's
 *  link (`?model=&serial=&resource=&protocol=`). The panel's own identity wins
 *  over the engine's (it is what run.html matches the presented panel by). */
export function runnerUrl(base: string, device: DeviceSetup, panel: PanelRef | null): string {
  const q = new URLSearchParams();
  const model = panel?.model || device.model || device.name;
  const serial = panel?.serial || device.serial;
  const resource = panel?.resource || device.address;
  if (model) q.set('model', model);
  if (serial) q.set('serial', serial);
  if (resource) q.set('resource', resource);
  q.set('protocol', runnerProtocol(device));
  return `${base}?${q.toString()}`;
}

/** A device has a front panel to run when it presents one, or when it is an
 *  instrument with a model (run.html builds its panel from the model's api.json). */
export const hasFrontPanel = (device: DeviceSetup, panel: PanelRef | null): boolean =>
  !!panel || (device.wires.includes('visa') && !!device.model);
