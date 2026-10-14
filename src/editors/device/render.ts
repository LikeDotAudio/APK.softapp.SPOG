// src/editors/device/render.ts — Renders the Universal Device Interface by Groups & I/O.

import { el, addStyles } from '../../ui/dom.js';
import { CSS_ID, CSS } from './styles.js';
import type { EditorContext } from '../types.js';
import type { DeviceManifest } from '../../platform/device/types.js';
import { getDiscoveredDevices, getDevice, onDevicesChanged } from '../../platform/device/receiver.js';
import { createControlWidget } from './controls.js';

export function renderDeviceEditor(host: HTMLElement, ctx: EditorContext): void {
  addStyles(CSS_ID, CSS);
  host.innerHTML = '';

  const root = el('div', { class: 'dev-ed' });
  host.append(root);

  let activeDevId = resolveTargetDeviceId(ctx);

  const redraw = () => {
    root.innerHTML = '';
    const devs = getDiscoveredDevices();
    const manifest = (activeDevId ? getDevice(activeDevId) : null) ?? devs[0] ?? makeDemoDevice();
    activeDevId = manifest.id;

    // 1. Top Rail: Device Identity & Device Switcher Tabs
    const topRail = el('div', { class: 'dev-top-rail', style: `--lcars-accent: ${manifest.color || ctx.production.color || '#ff9900'}` });
    const metaBlock = el('div', { class: 'dev-meta-block' });
    metaBlock.append(
      el('span', { class: 'dev-badge', textContent: manifest.category || 'GEAR' }),
      el('span', { class: 'dev-title', textContent: manifest.name }),
    );

    const tabs = el('div', { class: 'dev-tabs' });
    for (const d of devs) {
      const btn = el('button', {
        class: `dev-tab-btn${d.id === activeDevId ? ' active' : ''}`,
        textContent: d.name,
      });
      btn.addEventListener('click', () => { activeDevId = d.id; redraw(); });
      tabs.append(btn);
    }

    topRail.append(metaBlock, tabs);

    // 2. Body: Group Cards
    const body = el('div', { class: 'dev-body' });
    renderGroups(body, manifest, ctx);

    root.append(topRail, body);
  };

  ctx.dispose.add(onDevicesChanged(() => redraw()));
  redraw();
}

function resolveTargetDeviceId(ctx: EditorContext): string | null {
  const cfg = ctx.twist.config as Record<string, any> | null;
  if (cfg?.deviceId) return String(cfg.deviceId);
  const name = ctx.twist.name.toLowerCase();
  const devs = getDiscoveredDevices();
  const match = devs.find((d) => d.id.toLowerCase() === name || d.name.toLowerCase().includes(name));
  return match ? match.id : null;
}

function renderGroups(body: HTMLElement, m: DeviceManifest, ctx: EditorContext): void {
  const accent = m.color || ctx.production.color || '#38bdf8';
  const groupMap = new Map<string, { in: typeof m.inputs; out: typeof m.outputs; name: string }>();

  // Ensure default groups exist
  if (m.groups && m.groups.length > 0) {
    for (const g of m.groups) {
      groupMap.set(g.id, { in: [], out: [], name: g.name });
    }
  }

  // Bucket inputs and outputs
  for (const input of m.inputs) {
    const gid = input.group || 'general';
    if (!groupMap.has(gid)) groupMap.set(gid, { in: [], out: [], name: gid.toUpperCase() });
    groupMap.get(gid)!.in.push(input);
  }

  for (const output of m.outputs) {
    const gid = output.group || 'general';
    if (!groupMap.has(gid)) groupMap.set(gid, { in: [], out: [], name: gid.toUpperCase() });
    groupMap.get(gid)!.out.push(output);
  }

  for (const [gid, grp] of groupMap.entries()) {
    if (grp.in.length === 0 && grp.out.length === 0) continue;

    const card = el('div', { class: 'dev-group-card', style: `--group-accent: ${accent};` });
    const head = el('div', { class: 'dev-group-head' });
    head.append(el('span', { class: 'dev-group-title', textContent: grp.name }));
    card.append(head);

    if (grp.in.length > 0) {
      card.append(el('div', { class: 'dev-subgroup-title', textContent: 'Inputs' }));
      const inGrid = el('div', { class: 'dev-io-grid' });
      for (const io of grp.in) inGrid.append(createControlWidget(m.id, io, ctx.dispose, accent));
      card.append(inGrid);
    }

    if (grp.out.length > 0) {
      card.append(el('div', { class: 'dev-subgroup-title', textContent: 'Outputs' }));
      const outGrid = el('div', { class: 'dev-io-grid' });
      for (const io of grp.out) outGrid.append(createControlWidget(m.id, io, ctx.dispose, accent));
      card.append(outGrid);
    }

    body.append(card);
  }
}

function makeDemoDevice(): DeviceManifest {
  return {
    id: 'stagebox-8ch',
    name: 'BROADCAST STAGEBOX 8CH',
    category: 'AUDIO STAGEBOX',
    color: '#ff9900',
    groups: [
      { id: 'bank1', name: 'Preamps 1-4' },
      { id: 'bank2', name: 'Preamps 5-8' },
      { id: 'master', name: 'Master & Monitor' },
    ],
    inputs: [
      { id: 'gain1', name: 'Ch 1 Gain', type: 'knob', group: 'bank1', unit: 'dB', min: 0, max: 60, value: 34 },
      { id: 'p48_1', name: 'Ch 1 +48V', type: 'switch', group: 'bank1', value: true },
      { id: 'fader1', name: 'Ch 1 Fader', type: 'fader', group: 'bank1', min: 0, max: 100, value: 75 },
      { id: 'meter1', name: 'Ch 1 Peak', type: 'meter', group: 'bank1', min: -60, max: 0, value: -12 },
      { id: 'gain2', name: 'Ch 2 Gain', type: 'knob', group: 'bank1', unit: 'dB', min: 0, max: 60, value: 28 },
      { id: 'fader2', name: 'Ch 2 Fader', type: 'fader', group: 'bank1', min: 0, max: 100, value: 65 },
    ],
    outputs: [
      { id: 'out_main', name: 'Main Out L/R', type: 'fader', group: 'master', min: 0, max: 100, value: 85 },
      { id: 'out_meter', name: 'PGM VU', type: 'meter', group: 'master', min: -60, max: 0, value: -6 },
    ],
  };
}
