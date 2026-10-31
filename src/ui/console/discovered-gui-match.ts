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

import type { DeviceSetup } from './discovered-layer.js';

export interface PanelRef { key: string; folder: string; serial: string }

export const PANELS_TOPIC = 'APK.audio/System/Gui/Panels/+';

const norm = (s: string | null | undefined): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** A retained panel document as a PanelRef, or null for an erase / a stranger. */
export function panelRef(topic: string, payload: unknown): PanelRef | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { key?: unknown; folder?: unknown; device?: { serial?: unknown } };
  const key = typeof p.key === 'string' ? p.key : topic.split('/').pop() ?? '';
  if (!key) return null;
  return { key, folder: typeof p.folder === 'string' ? p.folder : key, serial: String(p.device?.serial ?? '') };
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
