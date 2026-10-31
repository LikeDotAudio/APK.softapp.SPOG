// src/ui/console/discovered-gui — a discovered device's own GUI, on its tab.
//
// Devices present their panels on the bus (`System/Gui/Panels/<key>`); the OS
// draws them in its Device Consoles display. SPOG does not redraw them — it
// frames the OS showing that one device (`?solo=Device_Consoles&tab=<device>`),
// so a panel looks and behaves exactly as it does on the desk, and there is one
// renderer, not two. The match of panel to device is discovered-gui-match.ts.
//
// Lazy: the frame is built when the device's tab is first drawn (destinations
// onDestinationRendered), and a tab drawn before its panel has arrived is filled
// in when it does.

import type { TwistBus } from '../../platform/mqtt/index.js';
import type { DeviceSetup } from './discovered-layer.js';
import { onDestinationRendered } from './destinations.js';
import { PANELS_TOPIC, panelRef, panelFor, panelUrl, type PanelRef } from './discovered-gui-match.js';
import { PAL } from '../../domain/palette.js';

const panels = new Map<string, PanelRef>();
const waiting = new Map<HTMLElement, DeviceSetup>();

/** The OS's index.html: `?os=<url>` wins; on a like.audio host (no OS behind it)
 *  the published shell; anywhere else the OS beside SPOG on the same server. */
export function osBase(): string {
  const asked = new URLSearchParams(location.search).get('os');
  if (asked) return asked;
  if (/(^|\.)like\.audio$/i.test(location.hostname)) return 'https://apk.audio/APK%3AOS/index.html';
  return `${location.origin}/APK%3AOS/index.html`;
}

function fill(slot: HTMLElement, device: DeviceSetup): boolean {
  const panel = panelFor(device, panels.values());
  if (!panel) {
    slot.textContent = 'No GUI on the bus for this device yet.';
    return false;
  }
  const frame = document.createElement('iframe');
  frame.src = panelUrl(osBase(), panel);
  frame.title = `${device.name} — GUI`;
  frame.loading = 'lazy';
  frame.style.cssText = 'width:100%;height:520px;border:0;background:#000;';
  slot.replaceChildren(frame);
  return true;
}

function mount(data: unknown, pane: HTMLElement): void {
  const device = (data as { device?: DeviceSetup }).device;
  if (!device || !Array.isArray(device.inputs)) return;   // not a discovered device
  const section = document.createElement('section');
  section.className = 'device-gui';
  section.style.cssText = `margin:8px 6px;border-top:2px solid ${PAL.sky67};padding-top:4px;`;
  const title = document.createElement('div');
  title.textContent = `GUI — ${device.make ? device.make + ' ' : ''}${device.model || device.name}`;
  title.style.cssText = `font-size:11px;letter-spacing:1px;color:${PAL.sky67};margin-bottom:4px;`;
  const slot = document.createElement('div');
  slot.style.cssText = 'font-size:11px;opacity:.8;';
  section.append(title, slot);
  pane.append(section);
  if (!fill(slot, device)) waiting.set(slot, device);
}

// Registered at load, not in initDiscoveredGui: a remembered tab is re-opened
// (restoreFooterState) before the bus exists, and its GUI slot must still be drawn.
onDestinationRendered(mount);

/** Keep the panel index off the bus (an empty retained payload is a panel
 *  leaving), filling any device tab that was drawn before its panel arrived. */
export function initDiscoveredGui(bus: TwistBus): void {
  bus.subscribe(PANELS_TOPIC, (topic, payload) => {
    const key = topic.split('/').pop() ?? '';
    const ref = panelRef(topic, payload);
    if (ref) panels.set(key, ref); else panels.delete(key);
    for (const [slot, device] of waiting) {
      if (!slot.isConnected) waiting.delete(slot);
      else if (fill(slot, device)) waiting.delete(slot);
    }
  });
}
