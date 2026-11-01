import { describe, it, expect } from 'vitest';
import { buildLayer, FOLDER, type DeviceSetup } from './discovered-layer.js';

const dev = (over: Partial<DeviceSetup>): DeviceSetup => ({
  id: 'mac:00:1d:c1:12:34:56', key: 'mac_00_1d_c1_12_34_56', name: 'Stagebox', make: 'Audinate', model: 'AVIO',
  serial: '00:1d:c1:12:34:56', mac: '00:1d:c1:12:34:56', address: '192.168.1.40', wires: ['dante'], online: true,
  outputs: [], inputs: [], control: null, ...over,
});

describe('discovered — the engine setup as Routes', () => {
  it("a device's outputs are a source leaf and its inputs a destination's twists", () => {
    const layer = buildLayer([dev({
      outputs: [{ id: 'dante:tx:1', name: 'Mic 1', kind: 'audio', wire: 'dante' }, { id: 'dante:tx:2', name: 'Mic 2', kind: 'audio', wire: 'dante' }],
      inputs: [{ id: 'dante:rx:1', name: 'Out L', kind: 'audio', wire: 'dante', from: { device: 'Desk', channel: 'Main L', status: 'ok' } }],
    })], ['001_Studio/'], ['001_Control Room/']);

    expect(layer.get('Routes/Sources/index.json')).toEqual(['001_Studio/', `${FOLDER}/`]);
    expect(layer.get('Routes/Destinations/index.json')).toEqual(['001_Control Room/', `${FOLDER}/`]);
    expect(layer.get(`Routes/Sources/${FOLDER}/index.json`)).toEqual(['001_Stagebox.json']);
    const src = layer.get(`Routes/Sources/${FOLDER}/001_Stagebox.json`) as { items: string[]; name: string };
    expect(src.name).toBe('Stagebox');
    expect(src.items).toEqual(['Mic 1', 'Mic 2']);
    const dst = layer.get(`Routes/Destinations/${FOLDER}/001_Stagebox.json`) as { twists: { name: string; accepts: string; from: unknown }[] };
    expect(dst.twists).toEqual([{ name: 'Out L', accepts: 'audio', from: { device: 'Desk', channel: 'Main L', status: 'ok' }, wire: 'dante' }]);
  });

  it('every device is presented — one with no media in or out still gets a destination tab', () => {
    const layer = buildLayer([dev({ name: 'HL-L2405W', key: 'printer', outputs: [], inputs: [] })], [], []);
    expect(layer.get('Routes/Sources/index.json')).toEqual([]);
    const dst = layer.get(`Routes/Destinations/${FOLDER}/001_HL-L2405W.json`) as { twists: unknown[] };
    expect(dst.twists).toEqual([{ name: 'Device', accepts: 'both' }]);
  });

  it('no devices leaves the root manifests as they were (the folder is withdrawn)', () => {
    const layer = buildLayer([], ['001_Studio/', `${FOLDER}/`], ['001_Control Room/']);
    expect(layer.get('Routes/Sources/index.json')).toEqual(['001_Studio/']);
    expect(layer.get('Routes/Destinations/index.json')).toEqual(['001_Control Room/']);
    expect(layer.has(`Routes/Sources/${FOLDER}/index.json`)).toBe(false);
  });
});
