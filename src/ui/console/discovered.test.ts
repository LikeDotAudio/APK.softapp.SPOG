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

    expect(layer.get('Routes/Sources/index.json')).toEqual([`${FOLDER}/`, '001_Studio/']);
    expect(layer.get('Routes/Destinations/index.json')).toEqual([`${FOLDER}/`, '001_Control Room/']);
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
    const layer = buildLayer([dev({ name: 'HL-L2405W', key: 'printer', make: '', model: '', wires: ['mdns', 'nic', 'ping'], outputs: [], inputs: [] })], [], []);
    expect(layer.get('Routes/Sources/index.json')).toEqual([]);
    const dst = layer.get(`Routes/Destinations/${FOLDER}/${NET}/005_Network/001_MDNS/001_HL-L2405W.json`) as { twists: unknown[] };
    expect(dst.twists).toEqual([{ name: 'Device', accepts: 'both' }]);
  });

  it('Network and Control: each wire under its domain, spilled by make then model; units named by serial', () => {
    const hp = ['S1', 'S2'].map((sn) => dev({ name: 'HEWLETT-PACKARD-34401A', key: `hp-${sn}`, make: 'Hewlett-Packard', model: '34401A', serial: sn, wires: ['visa', 'ping'] }));
    const gen = dev({ name: 'AGILENT-33210A', key: 'gen', make: 'Agilent Technologies', model: '33210A', serial: 'G1', wires: ['visa'] });
    const bare = dev({ name: '6060B', key: 'load', make: '', model: '', wires: ['visa'] });
    const sim = dev({ name: 'Sim', key: 'sim', make: '', model: '', wires: ['trunk_sim'] });
    const wwb = dev({ name: 'WWB', key: 'wwb', make: '', model: '', wires: ['wireless_wwb'] });
    const sw = dev({ name: 'Switch', key: 'sw', make: '', model: '', wires: ['snmp', 'ping'] });
    const layer = buildLayer([...hp, gen, bare, sim, wwb, sw], [], [], (d) => classify(d, null));
    const N = `Routes/Destinations/${FOLDER}/${NET}`;
    expect(layer.get(`${N}/index.json`)).toEqual(['001_Audio/', '002_Intercom/', '003_Routers/', '004_Testing/']);
    expect(layer.get(`${N}/001_Audio/index.json`)).toEqual(['001_WIRELESS_WWB/']);
    expect(layer.get(`${N}/002_Intercom/index.json`)).toEqual(['001_TRUNK_SIM/']);
    expect(layer.get(`${N}/003_Routers/index.json`)).toEqual(['001_SNMP/']);
    expect(layer.get(`${N}/004_Testing/001_VISA/index.json`)).toEqual(['001_6060B.json', 'AGILENT TECHNOLOGIES/', 'HEWLETT-PACKARD/']);
    expect(layer.get(`${N}/004_Testing/001_VISA/AGILENT%20TECHNOLOGIES/index.json`)).toEqual(['001_AGILENT-33210A.json']);
    expect(layer.get(`${N}/004_Testing/001_VISA/HEWLETT-PACKARD/index.json`)).toEqual(['34401A/']);
    expect(layer.get(`${N}/004_Testing/001_VISA/HEWLETT-PACKARD/34401A/index.json`)).toEqual(['001_S1.json', '002_S2.json']);
    expect((layer.get(`${N}/004_Testing/001_VISA/HEWLETT-PACKARD/34401A/002_S2.json`) as { name: string }).name).toBe('S2');
  });

  it('groups: what you can control first, then inputs and outputs, then the rest by wire', () => {
    const touch = dev({ name: 'Meter', key: 'meter', wires: ['visa'] });
    const display = dev({ name: 'Cast', key: 'cast', wires: ['chromecast'] });
    const both = dev({ name: 'Box', key: 'box', inputs: [{ id: 'i', name: 'In', kind: 'audio', wire: 'dante' }], outputs: [{ id: 'o', name: 'Out', kind: 'audio', wire: 'dante' }] });
    const tv = dev({ name: 'TV', key: 'tv', wires: ['appletv', 'mdns'], inputs: [{ id: 'i', name: 'HDMI', kind: 'video', wire: 'appletv' }] });
    const mic = dev({ name: 'Mic', key: 'mic', outputs: [{ id: 'o', name: 'Mic', kind: 'audio', wire: 'dante' }] });
    const nics = ['b', 'a'].map((n) => dev({ name: `nic-${n}`, key: `nic-${n}`, make: '', model: '', wires: ['nic', 'ping'] }));
    const mirror = dev({ name: 'APK:audio:nic:x', key: 'nmos-x', make: '', model: '', wires: ['nmos', 'nmos_device'], inputs: [{ id: 'r', name: 'x in', kind: 'data', wire: 'nmos' }] });
    const panels: Record<string, { command: boolean; pages: number }> = { meter: { command: true, pages: 2 }, cast: { command: false, pages: 1 } };
    const layer = buildLayer([mirror, ...nics, mic, tv, both, display, touch], [], [], (d) => classify(d, panels[d.key] ?? null));
    // every group present, in order (no meter in this bench: Meters is withdrawn)
    expect(layer.get(`Routes/Destinations/${FOLDER}/index.json`)).toEqual(Object.values(CLASS_FOLDERS).filter((f) => f !== CLASS_FOLDERS.meter).map((f) => `${f}/`));
    expect(layer.get(`Routes/Destinations/${FOLDER}/${encodeURIComponent(CLASS_FOLDERS.touch)}/index.json`)).toEqual(['001_Meter.json']);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${encodeURIComponent(CLASS_FOLDERS.in)}/index.json`)).toEqual(['001_TV.json']);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${NET}/index.json`)).toEqual(['001_Audio/', '005_Network/']);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${NET}/001_Audio/index.json`)).toEqual(['001_NMOS/']);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${NET}/005_Network/001_NIC/index.json`)).toEqual(['001_nic-a.json', '002_nic-b.json']);
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
});
