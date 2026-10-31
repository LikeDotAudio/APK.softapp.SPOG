import { describe, it, expect } from 'vitest';
import { panelFor, panelRef, panelUrl, type PanelRef } from './discovered-gui-match.js';
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
    expect(ref).toEqual({ key: 'k', folder: 'Metro16-DANTE2AVB_dante', serial: 's' });
    expect(panelUrl('/APK%3AOS/index.html', ref!)).toBe('/APK%3AOS/index.html?solo=Device_Consoles&tab=metro16-dante2avb-dante');
  });
});
