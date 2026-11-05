import { describe, it, expect } from 'vitest';
import { buildLayer, movedRoots, classify, matchMeters, visa, CLASS_FOLDERS, FOLDER, type DeviceSetup } from './discovered-layer.js';

const IO = encodeURIComponent(CLASS_FOLDERS.both);
const OUT = encodeURIComponent(CLASS_FOLDERS.out);
const NET = encodeURIComponent(CLASS_FOLDERS.network);

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
    expect(layer.get(`Routes/Sources/${FOLDER}/index.json`)).toEqual([`${CLASS_FOLDERS.both}/`]);
    expect(layer.get(`Routes/Sources/${FOLDER}/${IO}/index.json`)).toEqual(['001_Stagebox.json']);
    const src = layer.get(`Routes/Sources/${FOLDER}/${IO}/001_Stagebox.json`) as { items: string[]; name: string };
    expect(src.name).toBe('Stagebox');
    expect(src.items).toEqual(['Mic 1', 'Mic 2']);
    const dst = layer.get(`Routes/Destinations/${FOLDER}/${IO}/001_Stagebox.json`) as { twists: { name: string; accepts: string; from: unknown }[] };
    expect(dst.twists).toEqual([{ name: 'Out L', accepts: 'audio', from: { device: 'Desk', channel: 'Main L', status: 'ok' }, wire: 'dante' }]);
  });

  it('SAP and Ravenna streams are emitted as individual source leaves with channel lists', () => {
    const layer = buildLayer([dev({
      id: 'mac:00:07:f5:42:06:a2',
      name: 'WBS-32me.local',
      key: 'wbs_32me',
      wires: ['aes67', 'ravenna', 'sap'],
      outputs: [
        { id: 'stream:32ME-STREAM-1', name: '32ME-STREAM-1', kind: 'audio', wire: 'aes67', format: 'L24 48000Hz 8ch' },
        { id: 'stream:32ME-STREAM-2', name: '32ME-STREAM-2', kind: 'audio', wire: 'aes67', format: 'L24 48000Hz 8ch' }
      ],
      inputs: []
    })], [], []);

    const srcFiles = layer.get(`Routes/Sources/${FOLDER}/${OUT}/index.json`) as string[];
    expect(srcFiles.length).toBe(4); // 2 streams x 2 flavors (RAVENNA and SAP)
    expect(srcFiles).toContain('001_WBS-32me-local_32ME-STREAM-1-RAVENNA.json');
    expect(srcFiles).toContain('002_WBS-32me-local_32ME-STREAM-1-SAP.json');
    expect(srcFiles).toContain('003_WBS-32me-local_32ME-STREAM-2-RAVENNA.json');
    expect(srcFiles).toContain('004_WBS-32me-local_32ME-STREAM-2-SAP.json');

    const s1 = layer.get(`Routes/Sources/${FOLDER}/${OUT}/001_WBS-32me-local_32ME-STREAM-1-RAVENNA.json`) as { name: string; items: string[]; wire: string };
    expect(s1.name).toBe('32ME-STREAM-1 (RAVENNA)');
    expect(s1.items).toEqual(['CH 1', 'CH 2', 'CH 3', 'CH 4', 'CH 5', 'CH 6', 'CH 7', 'CH 8']);
    expect(s1.wire).toBe('ravenna');

    const s2 = layer.get(`Routes/Sources/${FOLDER}/${OUT}/002_WBS-32me-local_32ME-STREAM-1-SAP.json`) as { name: string; items: string[]; wire: string };
    expect(s2.name).toBe('32ME-STREAM-1 (SAP)');
    expect(s2.items).toEqual(['CH 1', 'CH 2', 'CH 3', 'CH 4', 'CH 5', 'CH 6', 'CH 7', 'CH 8']);
    expect(s2.wire).toBe('sap');
  });

  it('every device is presented — one with no media in or out still gets a destination tab', () => {
    const layer = buildLayer([dev({ name: 'HL-L2405W', key: 'printer', wires: ['mdns', 'nic', 'ping'], outputs: [], inputs: [] })], [], []);
    expect(layer.get('Routes/Sources/index.json')).toEqual([]);
    const dst = layer.get(`Routes/Destinations/${FOLDER}/${NET}/001_MDNS/001_HL-L2405W.json`) as { twists: unknown[] };
    expect(dst.twists).toEqual([{ name: 'Device', accepts: 'both' }]);
  });

  it('groups: what you can control first, then inputs and outputs, then the rest by wire', () => {
    const touch = dev({ name: 'Meter', key: 'meter', wires: ['visa'] });
    const display = dev({ name: 'Cast', key: 'cast', wires: ['chromecast'] });
    const both = dev({ name: 'Box', key: 'box', inputs: [{ id: 'i', name: 'In', kind: 'audio', wire: 'dante' }], outputs: [{ id: 'o', name: 'Out', kind: 'audio', wire: 'dante' }] });
    const tv = dev({ name: 'TV', key: 'tv', wires: ['appletv', 'mdns'], inputs: [{ id: 'i', name: 'HDMI', kind: 'video', wire: 'appletv' }] });
    const mic = dev({ name: 'Mic', key: 'mic', outputs: [{ id: 'o', name: 'Mic', kind: 'audio', wire: 'dante' }] });
    const nics = ['b', 'a'].map((n) => dev({ name: `nic-${n}`, key: `nic-${n}`, wires: ['nic', 'ping'] }));
    const mirror = dev({ name: 'APK:audio:nic:x', key: 'nmos-x', wires: ['nmos', 'nmos_device'], inputs: [{ id: 'r', name: 'x in', kind: 'data', wire: 'nmos' }] });
    const panels: Record<string, { command: boolean; pages: number }> = { meter: { command: true, pages: 2 }, cast: { command: false, pages: 1 } };
    const layer = buildLayer([mirror, ...nics, mic, tv, both, display, touch], [], [], (d) => classify(d, panels[d.key] ?? null));
    // every group present, in order (no meter in this bench: Meters is withdrawn)
    expect(layer.get(`Routes/Destinations/${FOLDER}/index.json`)).toEqual(Object.values(CLASS_FOLDERS).filter((f) => f !== CLASS_FOLDERS.meter).map((f) => `${f}/`));
    expect(layer.get(`Routes/Destinations/${FOLDER}/${encodeURIComponent(CLASS_FOLDERS.touch)}/index.json`)).toEqual(['001_Meter.json']);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${encodeURIComponent(CLASS_FOLDERS.in)}/index.json`)).toEqual(['001_TV.json']);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${NET}/index.json`)).toEqual(['001_NIC/', '002_NMOS/']);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${NET}/001_NIC/index.json`)).toEqual(['001_nic-a.json', '002_nic-b.json']);
    // a panel with no command only displays; data I/O is not signal
    expect(classify(display, { command: false, pages: 3 })).toBe('display');
    expect(classify(touch, { command: true, pages: 0 })).toBe('display');
    expect(classify(mirror, null)).toBe('network');
  });

  it('no devices leaves the root manifests as they were (the folder is withdrawn)', () => {
    const layer = buildLayer([], ['001_Studio/', `${FOLDER}/`], ['001_Control Room/']);
    expect(layer.get('Routes/Sources/index.json')).toEqual(['001_Studio/']);
    expect(layer.get('Routes/Destinations/index.json')).toEqual(['001_Control Room/']);
    expect(layer.has(`Routes/Sources/${FOLDER}/index.json`)).toBe(false);
  });

  it('a root drafted after the layer was built moves it; an unchanged one does not (ROAD-3483)', () => {
    const last = { src: ['001_Studio/'], dest: ['001_Control Room/'] };
    const disk = { src: ['001_Studio/'], dest: ['001_Control Room/'] };
    expect(movedRoots(last, { src: null, dest: null }, disk)).toBeNull();
    expect(movedRoots(last, { src: ['001_Studio/'], dest: null }, disk)).toBeNull();
    expect(movedRoots(last, { src: ['001_Studio/', '009_Imported/'], dest: null }, disk))
      .toEqual({ src: ['001_Studio/', '009_Imported/'], dest: ['001_Control Room/'] });
    // a draft cleared while disk was never read: the caller must fetch it
    expect(movedRoots({ src: ['009_Imported/'], dest: [] }, { src: null, dest: [] }, { src: null, dest: null })).toBe('fetch');
  });

  it('meters: the BIM library names them, gives them their jacks, and files them first', () => {
    const scope = dev({ name: '54641D', key: 'visa_MY42000747', make: 'AGILENT TECHNOLOGIES', model: '54641D', serial: 'MY42000747',
      address: 'tcpip0::44.44.44.222::gpib7,6::instr', wires: ['visa'] });
    const dmm = dev({ name: '34401A', key: 'visa_ttyUSB3', make: 'HEWLETT-PACKARD', model: '34401A', serial: '',
      address: '/dev/ttyUSB3', wires: ['visa'] });   // discovery's spelling of ASRL/dev/ttyUSB3::INSTR
    const box = dev({ name: 'Box', key: 'box', outputs: [{ id: 'o', name: 'Out', kind: 'audio', wire: 'dante' }] });
    // the same scope seen a second time on the network: one bench device is one meter
    const scopeNic = dev({ name: 'Agilent 54641D', key: 'mac_00_30', serial: 'MY42000747', address: '44.44.44.222', wires: ['nic', 'ping', 'visa'] });
    const psu = dev({ name: '66101A', key: 'visa_psu', serial: '', address: 'tcpip0::44.44.44.222::gpib7,30,0::instr', wires: ['visa'] });
    const instances = [
      { key: 'serial:x', state: 'online', serial: 'MY42000747', resource: 'TCPIP::44.44.44.222::gpib7,6::INSTR',
        part: { id: 'keysight/54641d', manufacturer: 'Keysight', model: '54641D', category: 'Test & Measurement' } },
      { key: 'psu', state: 'online', serial: null, resource: 'TCPIP::44.44.44.222::gpib7,30,0::INSTR',
        part: { id: 'keysight/66101a', manufacturer: 'Keysight', model: '66101A', category: 'Test & Measurement' } },
      { key: 'usb:y', state: 'online', serial: null, resource: 'ASRL/dev/ttyUSB3::INSTR',
        part: { id: 'keysight/34401a', manufacturer: 'Keysight', model: '34401A', category: 'Test & Measurement' } },
      { key: 'mac:z', state: 'online', serial: null, resource: null, part: { id: 'shure/sm58', category: 'Microphones' } },
    ];
    const parts = [
      { id: 'keysight/54641d', ports: [{ group: 'CH', side: 'input', domain: 'signal', count: 2 }, { group: 'MAINS', side: 'input', domain: 'power', count: 1 }, { group: 'GPIB', side: 'connection', domain: 'control' }] },
      { id: 'keysight/34401a', ports: [{ group: 'HI', side: 'input', domain: 'signal', count: 1 }] },
      { id: 'keysight/66101a', ports: [{ group: 'OUT', side: 'output', domain: 'power', count: 1 }] },
    ];
    expect(visa('tcpip0::44.44.44.222::gpib7,6::instr')).toBe('TCPIP::44.44.44.222::GPIB7,6::INSTR');
    const meters = matchMeters([scopeNic, scope, dmm, box, psu], instances, parts);
    expect([...meters.keys()].sort()).toEqual(['visa_MY42000747', 'visa_ttyUSB3']);
    expect(meters.get('visa_MY42000747')!.label).toBe('Keysight 54641D #MY42000747');
    expect(meters.get('visa_MY42000747')!.inputs).toEqual([{ name: 'CH 1', accepts: 'audio' }, { name: 'CH 2', accepts: 'audio' }]);

    const classOf = (d: DeviceSetup) => (meters.has(d.key) ? 'meter' as const : classify(d, null));
    const layer = buildLayer([box, scope, dmm], [], [], classOf, meters);
    const M = encodeURIComponent(CLASS_FOLDERS.meter);
    expect((layer.get(`Routes/Destinations/${FOLDER}/index.json`) as string[])[0]).toBe(`${CLASS_FOLDERS.meter}/`);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${M}/index.json`)).toEqual(['001_34401A.json', '002_54641D.json']);
    const d = layer.get(`Routes/Destinations/${FOLDER}/${M}/002_54641D.json`) as { name: string; bim: string; twists: { name: string }[] };
    expect(d.name).toBe('KEYSIGHT 54641D #MY42000747');
    expect(d.bim).toBe('keysight/54641d');
    expect(d.twists.map((t) => t.name)).toEqual(['CH 1', 'CH 2']);
  });
});
