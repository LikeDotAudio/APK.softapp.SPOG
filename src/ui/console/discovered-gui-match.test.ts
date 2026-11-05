import { describe, it, expect } from 'vitest';
import { panelFor, panelRef, panelUrl, runnerUrl, hasFrontPanel, primaryWire, type PanelRef } from './discovered-gui-match.js';
import type { DeviceSetup } from './discovered-layer.js';

const dev = (over: Partial<DeviceSetup>): DeviceSetup => ({
  id: 'x', key: 'x', name: 'x', make: '', model: '', serial: '', mac: null, address: '', wires: [],
  online: true, outputs: [], inputs: [], control: null, ...over,
});
const P = (key: string, serial: string, folder = key): PanelRef => ({ key, serial, folder });

describe('discovered-gui-match — a device and its own panel', () => {
  it('joins by MAC, and a Dante box shows its own console, not a channel', () => {
    const panels = [P('dante-Metro16-DANTE2AVB-Channel-Ch1', '00:0a:92:02:77:5b'), P('dante-Metro16-DANTE2AVB', '00:0a:92:02:77:5b', 'Metro16-DANTE2AVB_dante')];
    const hit = panelFor(dev({ name: 'Metro16-DANTE2AVB', mac: '00:0A:92:02:77:5B', serial: '00:0a:92:02:77:5b' }), panels);
    expect(hit?.key).toBe('dante-Metro16-DANTE2AVB');
  });
  it("joins a cast device whose name carries its panel's serial", () => {
    const hit = panelFor(dev({ name: 'Google-Home-Mini-ce0968cbb52eaf0110d955bd700d6afd', mac: '44:44:44:00:00:01' }),
      [P('chromecast-Speaker-Garage_speaker', 'ce0968cbb52eaf0110d955bd700d6afd')]);
    expect(hit?.key).toBe('chromecast-Speaker-Garage_speaker');
  });
  it('joins by name when the panel key carries it, and nothing on a stranger', () => {
    expect(panelFor(dev({ name: 'Living Room' }), [P('appletv-Living-Room_local', 'abc')])?.key).toBe('appletv-Living-Room_local');
    expect(panelFor(dev({ name: 'HL-L2405W', serial: 'zzz' }), [P('dante-Metro16', '00:0a:92:02:77:5b')])).toBeNull();
  });
  it('reads a retained panel, treats an erase as none, and addresses the solo OS tab', () => {
    expect(panelRef('APK.audio/System/Gui/Panels/k', null)).toBeNull();
    const ref = panelRef('APK.audio/System/Gui/Panels/k', { key: 'k', folder: 'Metro16-DANTE2AVB_dante', device: { serial: 's' } });
    expect(ref).toEqual({ key: 'k', folder: 'Metro16-DANTE2AVB_dante', serial: 's', command: false, pages: 0 });
    expect(panelUrl('/APK%3AOS/index.html', ref!)).toBe('/APK%3AOS/index.html?solo=Device_Consoles&tab=metro16-dante2avb-dante');
  });
  it('reads whether a panel takes commands and how many pages it has', () => {
    const ref = panelRef('APK.audio/System/Gui/Panels/hp', {
      key: 'hp', folder: 'HP_visa',
      device: { serial: 'MY42000747', model: '34401A', resource: 'TCPIP::44.44.44.222::gpib7,22::INSTR', write_topic: 'X/Write' },
      placements: [{ at: 'Instruments', frames: [{ path: 'a.json' }] }, { at: 'Probe', frames: [{}] }, { at: 'Empty', frames: [] }],
    });
    expect(ref).toMatchObject({ command: true, pages: 2, model: '34401A', resource: 'TCPIP::44.44.44.222::gpib7,22::INSTR' });
  });
  it('links the running front panel by the panel\'s identity, protocol from the wire', () => {
    const d = dev({ name: 'HEWLETT-PACKARD 34401A', model: '34401A', serial: 'MY42000747', address: 'GPIB::22', wires: ['visa'] });
    const url = runnerUrl('/run.html', d, { key: 'hp', folder: 'f', serial: 'MY42000747', resource: 'TCPIP::x::INSTR', command: true, pages: 1 });
    const q = new URLSearchParams(url.split('?')[1]);
    expect(q.get('model')).toBe('34401A');
    expect(q.get('resource')).toBe('TCPIP::x::INSTR');
    expect(q.get('protocol')).toBe('visa');
    expect(hasFrontPanel(d, null)).toBe(true);
    expect(hasFrontPanel(dev({ wires: ['nic', 'ping'] }), null)).toBe(false);
    expect(primaryWire(dev({ wires: ['mdns', 'nic', 'ping'] }))).toBe('mdns');
    expect(primaryWire(dev({ wires: ['appletv', 'mdns', 'nic'] }))).toBe('appletv');
  });
  it('an IP-named device is not matched to the panels of instruments behind it', () => {
    const gateway = dev({ name: '44.44.44.222', serial: '', mac: null });
    expect(panelFor(gateway, [P('visa-TCPIP-44-44-44-222-gpib7-10-INSTR', 'MY1', 'x')])).toBeNull();
  });
});
