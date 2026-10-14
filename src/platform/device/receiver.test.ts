import { describe, it, expect, beforeEach } from 'vitest';
import { ingestManifest, ingestValue, getDevice, getDiscoveredDevices, onDeviceValue, onDevicesChanged } from './receiver.js';

describe('device receiver', () => {
  const sample = {
    id: 'netgear-m4350',
    name: 'NETGEAR M4350 AV Switch',
    category: 'NETWORK',
    color: '#00ffff',
    groups: [
      { id: 'g1', name: 'Ports 1-4', direction: 'both' },
      { id: 'g2', name: 'PoE Status', direction: 'in' },
    ],
    inputs: [
      { id: 'rx1', name: 'Port 1 Rx', type: 'meter', group: 'g1', unit: 'Mbps', value: 12.5 },
      { id: 'poe1', name: 'Port 1 Power', type: 'toggle', group: 'g2', value: true },
    ],
    outputs: [
      { id: 'tx1', name: 'Port 1 Tx', type: 'meter', group: 'g1', unit: 'Mbps', value: 45.0 },
    ],
    types: {
      meter: 'network_bandwidth',
      toggle: 'poe_state',
    },
  };

  it('ingests and stores device manifest with inputs, outputs, types, and groups', () => {
    const dev = ingestManifest(sample);
    expect(dev).not.toBeNull();
    expect(dev?.id).toBe('netgear-m4350');
    expect(dev?.name).toBe('NETGEAR M4350 AV Switch');
    expect(dev?.groups.length).toBe(2);
    expect(dev?.inputs.length).toBe(2);
    expect(dev?.outputs.length).toBe(1);
    expect(dev?.types?.['meter']).toBe('network_bandwidth');

    const retrieved = getDevice('netgear-m4350');
    expect(retrieved).toBeDefined();
    expect(retrieved?.inputs[0]?.name).toBe('Port 1 Rx');
  });

  it('notifies listeners when devices are ingested', () => {
    let count = 0;
    const unsub = onDevicesChanged((devs) => {
      count = devs.length;
    });
    expect(count).toBeGreaterThan(0);
    unsub();
  });

  it('updates device IO values and notifies value listeners', () => {
    ingestManifest(sample);
    let rxValue: unknown = null;
    const unsub = onDeviceValue('netgear-m4350', 'rx1', (v) => {
      rxValue = v;
    });

    expect(rxValue).toBe(12.5);

    ingestValue('netgear-m4350', 'rx1', 99.2);
    expect(rxValue).toBe(99.2);

    const dev = getDevice('netgear-m4350');
    expect(dev?.inputs[0]?.value).toBe(99.2);

    unsub();
  });
});
