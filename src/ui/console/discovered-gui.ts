// src/ui/console/discovered-gui — a discovered device's own GUI, on its tab.
//
// A device that presents a FRONT PANEL (a panel with a command and pages — a
// touch panel — or an instrument whose model has an api.json) leads its tab with
// that panel RUNNING: the Touch Panel Builder's run.html, full size, every touch
// a command to the box and every readout its readback. FULL SCREEN puts it on
// the whole glass. A device whose panel only displays keeps the OS frame below.
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
import {
  PANELS_TOPIC, RUNNER_PATH, panelRef, panelFor, panelUrl, runnerUrl, hasFrontPanel, type PanelRef,
} from './discovered-gui-match.js';
import { PAL } from '../../domain/palette.js';

const panels = new Map<string, PanelRef>();
const waiting = new Map<HTMLElement, DeviceSetup>();
const panelListeners = new Set<() => void>();

/** This device's panel, if one is on the bus (for grouping and drawing). */
export function panelOf(device: DeviceSetup): PanelRef | null {
  return panelFor(device, panels.values());
}

/** Told whenever the panel index changes (a panel arrives or leaves). */
export function onPanelsChanged(cb: () => void): () => void {
  panelListeners.add(cb);
  return () => { panelListeners.delete(cb); };
}

/** Where run.html is: `?panelrunner=<url>` wins, else beside SPOG on this server. */
export function runnerBase(): string {
  const asked = new URLSearchParams(location.search).get('panelrunner');
  return asked || `${location.origin}${RUNNER_PATH}`;
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.style.cssText = `font:inherit;font-size:11px;letter-spacing:1px;padding:3px 10px;border-radius:10px;border:0;cursor:pointer;`
    + `background:${PAL.sky67};color:${PAL.black};`;
  b.addEventListener('click', onClick);
  return b;
}

/** The running front panel: a toolbar (FULL SCREEN, NEW WINDOW, OS CONSOLE) and the frame. */
function frontPanel(slot: HTMLElement, device: DeviceSetup, panel: PanelRef | null): void {
  const url = runnerUrl(runnerBase(), device, panel);
  const had = slot.querySelector('iframe');
  if (had && had.src === url) return;   // the same panel: never reload under a finger
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.title = `${device.name} — front panel`;
  frame.allow = 'fullscreen';
  frame.allowFullscreen = true;
  // run.html lays its glass out at 1280×800; keep that shape, as big as the pane allows.
  frame.style.cssText = `width:100%;aspect-ratio:1280/800;max-height:80vh;border:0;border-radius:6px;background:${PAL.black};`;
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:0 0 6px;';
  bar.append(
    button('FULL SCREEN', () => { void frame.requestFullscreen?.().catch(() => window.open(url, '_blank')); }),
    button('NEW WINDOW', () => { window.open(url, '_blank', 'noopener'); }),
  );
  if (panel) bar.append(button('OS CONSOLE', () => { window.open(panelUrl(osBase(), panel), '_blank', 'noopener'); }));
  slot.replaceChildren(bar, frame);
}

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
  const touch = !!panel && !!panel.command && (panel.pages ?? 0) > 0;
  if (touch || (!panel && hasFrontPanel(device, null))) {
    frontPanel(slot, device, panel);
    // an instrument drawn from its api.json is filled again when its own panel arrives
    return !!panel;
  }
  if (!panel) {
    slot.textContent = 'No GUI on the bus for this device yet.';
    return false;
  }
  const frame = document.createElement('iframe');
  frame.src = panelUrl(osBase(), panel);
  frame.title = `${device.name} — GUI`;
  frame.loading = 'lazy';
  frame.style.cssText = `width:100%;height:520px;border:0;background:${PAL.black};`;
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
  const p = panelFor(device, panels.values());
  const lead = p ? !!p.command && (p.pages ?? 0) > 0 : hasFrontPanel(device, null);
  title.textContent = `${lead ? 'FRONT PANEL' : 'GUI'} — ${device.make ? device.make + ' ' : ''}${device.model || device.name}`;
  title.style.cssText = `font-size:11px;letter-spacing:1px;color:${PAL.sky67};margin-bottom:4px;`;
  const slot = document.createElement('div');
  slot.style.cssText = 'font-size:11px;opacity:.8;';
  section.append(title, slot);
  // The front panel is what an operator came to this tab for: it goes first.
  if (lead) pane.prepend(section); else pane.append(section);
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
    panelListeners.forEach((cb) => { try { cb(); } catch (e) { console.warn('panels listener:', e); } });
    for (const [slot, device] of waiting) {
      if (!slot.isConnected) waiting.delete(slot);
      else if (fill(slot, device)) waiting.delete(slot);
    }
  });
}
