// src/platform/device/receiver.ts — Ingests device manifests and values from MQTT.
// Listens for inputs, outputs, types, and groups broadcast on the broker.

import type { DeviceManifest, DeviceIO, DeviceGroup } from './types.js';
import { getBus, type TwistBus } from '../mqtt/index.js';

const devices = new Map<string, DeviceManifest>();
const listeners = new Set<(devs: DeviceManifest[]) => void>();
const valListeners = new Map<string, Set<(val: unknown) => void>>();

export function getDiscoveredDevices(): DeviceManifest[] {
  return Array.from(devices.values());
}

export function getDevice(id: string): DeviceManifest | undefined {
  return devices.get(id);
}

export function onDevicesChanged(cb: (devs: DeviceManifest[]) => void): () => void {
  listeners.add(cb);
  cb(getDiscoveredDevices());
  return () => { listeners.delete(cb); };
}

export function onDeviceValue(devId: string, ioId: string, cb: (v: unknown) => void): () => void {
  const k = `${devId}/${ioId}`;
  let set = valListeners.get(k);
  if (!set) { set = new Set(); valListeners.set(k, set); }
  set.add(cb);
  const dev = devices.get(devId);
  const io = [...(dev?.inputs ?? []), ...(dev?.outputs ?? [])].find((x) => x.id === ioId);
  if (io && io.value !== undefined) cb(io.value);
  return () => { set?.delete(cb); };
}

export function publishDeviceValue(devId: string, ioId: string, val: unknown): void {
  const dev = devices.get(devId);
  const io = [...(dev?.inputs ?? []), ...(dev?.outputs ?? [])].find((x) => x.id === ioId);
  if (io) io.value = val;
  const bus = getBus();
  bus.publishValue(`devices/${devId}/${ioId}`, val, { throttle: true });
}

export function ingestManifest(raw: unknown): DeviceManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, any>;
  const id = String(o.id || o.deviceId || o.name || '').trim();
  if (!id) return null;

  const normalizeIO = (item: any, idx: number, prefix: string): DeviceIO => {
    if (typeof item === 'string') {
      return { id: `${prefix}_${idx}`, name: item, type: 'indicator', writable: false };
    }
    return {
      id: String(item.id || `${prefix}_${idx}`),
      name: String(item.name || item.id || `${prefix.toUpperCase()} ${idx + 1}`),
      type: String(item.type || 'fader'),
      group: item.group ? String(item.group) : undefined,
      unit: item.unit ? String(item.unit) : undefined,
      min: typeof item.min === 'number' ? item.min : 0,
      max: typeof item.max === 'number' ? item.max : 1,
      step: typeof item.step === 'number' ? item.step : undefined,
      options: Array.isArray(item.options) ? item.options.map(String) : undefined,
      value: item.value,
      writable: item.writable !== false,
      topic: item.topic ? String(item.topic) : undefined,
    };
  };

  const groups: DeviceGroup[] = Array.isArray(o.groups)
    ? o.groups.map((g: any, i: number) => ({
        id: String(g.id || `group_${i}`),
        name: String(g.name || g.id || `Group ${i + 1}`),
        order: typeof g.order === 'number' ? g.order : i,
        direction: g.direction || 'both',
        icon: g.icon,
      }))
    : [];

  const inputs: DeviceIO[] = Array.isArray(o.inputs) ? o.inputs.map((it: any, i: number) => normalizeIO(it, i, 'in')) : [];
  const outputs: DeviceIO[] = Array.isArray(o.outputs) ? o.outputs.map((it: any, i: number) => normalizeIO(it, i, 'out')) : [];

  const manifest: DeviceManifest = {
    id,
    name: String(o.name || id),
    category: o.category ? String(o.category) : undefined,
    color: o.color ? String(o.color) : undefined,
    groups,
    inputs,
    outputs,
    types: typeof o.types === 'object' && o.types ? o.types : {},
    ts: Date.now(),
  };

  devices.set(id, manifest);
  const arr = getDiscoveredDevices();
  for (const l of listeners) l(arr);
  return manifest;
}

export function ingestValue(devId: string, ioId: string, val: unknown): void {
  const dev = devices.get(devId);
  if (!dev) return;
  const io = [...dev.inputs, ...dev.outputs].find((x) => x.id === ioId);
  if (io) io.value = val;
  const set = valListeners.get(`${devId}/${ioId}`);
  if (set) for (const cb of set) cb(val);
}

let receiverStarted = false;
export function initDeviceReceiver(bus: TwistBus = getBus()): () => void {
  if (receiverStarted) return () => {};
  receiverStarted = true;

  const unsubs: Array<() => void> = [];

  const handleMsg = (topic: string, payload: unknown) => {
    let data = payload;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { /* ignore parse error */ }
    }
    const clean = topic.replace(/^SPOG\//, '');
    const parts = clean.split('/');

    // Topic pattern: devices/<devId>/manifest or schema or config
    if (parts[0] === 'devices' && parts.length >= 3 && (parts[2] === 'manifest' || parts[2] === 'schema' || parts[2] === 'config')) {
      ingestManifest(data);
      return;
    }

    // Topic pattern: APK.audio/Device/<devId>/manifest
    if (parts[0] === 'APK.audio' && parts[1] === 'Device' && parts[3] === 'manifest') {
      ingestManifest(data);
      return;
    }

    // Live parameter / IO updates: devices/<devId>/<ioId> or devices/<devId>/params/<ioId>
    if (parts[0] === 'devices' && parts.length >= 3) {
      const devId = parts[1]!;
      const ioId = parts[2] === 'params' || parts[2] === 'io' ? parts[3]! : parts[2]!;
      const val = (data && typeof data === 'object' && 'value' in data) ? (data as any).value : data;
      ingestValue(devId, ioId, val);
    }
  };

  unsubs.push(bus.subscribe('devices/#', handleMsg));
  unsubs.push(bus.subscribe('APK.audio/Device/#', handleMsg));

  return () => {
    receiverStarted = false;
    unsubs.forEach((u) => u());
  };
}
