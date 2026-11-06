import { describe, it, expect } from 'vitest';
import { buildLayer, movedRoots, classify, matchMeters, roleFromThing, roleIndex, visa, CLASS_FOLDERS, FOLDER, type DeviceSetup } from './discovered-layer.js';

const IO = encodeURIComponent(CLASS_FOLDERS.both);
const OUT = encodeURIComponent(CLASS_FOLDERS.out);
const NET = encodeURIComponent(CLASS_FOLDERS.network);

const dev = (over: Partial<DeviceSetup>): DeviceSetup => ({
  id: 'mac:00:1d:c1:12:34:56', key: 'mac_00_1d_c1_12_34_56', name: 'Stagebox', make: 'Audinate', model: 'AVIO',
  serial: '00:1d:c1:12:34:56', mac: '00:1d:c1:12:34:56', address: '192.168.1.40', wires: ['dante'], online: true,
  outputs: [], inputs: [], control: null, ...over,
});

describe('discovered — what the BIM library says a device takes in and gives out', () => {
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
    expect([...meters].filter(([, m]) => m.role === 'meter').map(([k]) => k).sort()).toEqual(['visa_MY42000747', 'visa_ttyUSB3']);
    expect(meters.get('visa_psu')!.role).toBe('out');   // a supply gives power OUT: a source, not a meter
    expect(meters.get('visa_psu')!.outputs).toEqual([{ name: 'OUT', domain: 'power' }]);
    expect(meters.get('visa_MY42000747')!.label).toBe('Keysight 54641D #MY42000747');
    expect(meters.get('visa_ttyUSB3')!.label).toBe('Keysight 34401A @ /dev/ttyUSB3');   // no serial: the port names it
    expect(meters.get('visa_MY42000747')!.inputs).toEqual([{ name: 'CH 1', accepts: 'audio' }, { name: 'CH 2', accepts: 'audio' }]);

    const classOf = (d: DeviceSetup) => (meters.get(d.key)?.role === 'meter' ? 'meter' as const : classify(d, null));
    const layer = buildLayer([box, scope, dmm], [], [], classOf, meters);
    const M = encodeURIComponent(CLASS_FOLDERS.meter);
    expect((layer.get(`Routes/Destinations/${FOLDER}/index.json`) as string[])[0]).toBe(`${CLASS_FOLDERS.meter}/`);
    expect(layer.get(`Routes/Destinations/${FOLDER}/${M}/index.json`)).toEqual(['000_Data Logger.json', '002_34401A-dev-ttyUSB3.json', '003_54641D-MY42000747.json']);
    const logger = layer.get(`Routes/Destinations/${FOLDER}/${M}/000_Data Logger.json`) as { twists: { name: string }[] };
    expect(logger.twists.map((t) => t.name)).toEqual(['LOGGER 1', 'LOGGER 2', 'LOGGER 3', 'LOGGER 4']);
    const d = layer.get(`Routes/Destinations/${FOLDER}/${M}/003_54641D-MY42000747.json`) as { name: string; bim: string; twists: { name: string }[] };
    expect(d.name).toBe('KEYSIGHT 54641D #MY42000747');
    expect(d.bim).toBe('keysight/54641d');
    expect(d.twists.map((t) => t.name)).toEqual(['CH 1', 'CH 2']);
  });

  it('BIM outputs are sources: generators and supplies are Outputs, a coax router both; serial 0 never pins a unit', () => {
    const gen = dev({ name: '33210A', key: 'visa_gen', make: 'AGILENT', model: '33210A', serial: 'MY48000299', address: 'TCPIP0::44.44.44.162::5025::SOCKET', wires: ['visa'] });
    const psus = [4, 5].map((n) => dev({ name: '66104A', key: `visa_psu${n}`, make: 'HP', model: '66104A', serial: '0', address: `tcpip0::44.44.44.222::gpib7,30,${n}::instr`, wires: ['visa'] }));
    const router = dev({ name: 'Router', key: 'rtr', make: 'X', model: 'R', serial: 'R1', address: '10.0.0.9', wires: ['snmp'] });
    const T = 'Test & Measurement';
    const instances = [
      { key: 'g', state: 'online', serial: 'MY48000299', resource: 'TCPIP0::44.44.44.162::5025::SOCKET', part: { id: 'k/33210a', manufacturer: 'Keysight', model: '33210A', category: T } },
      { key: 'p5', state: 'online', serial: '0', resource: 'TCPIP::44.44.44.222::gpib7,30,5::INSTR', part: { id: 'k/66104a', manufacturer: 'Keysight', model: '66104A', category: T } },
      { key: 'p4', state: 'online', serial: '0', resource: 'TCPIP::44.44.44.222::gpib7,30,4::INSTR', part: { id: 'k/66104a', manufacturer: 'Keysight', model: '66104A', category: T } },
      { key: 'r', state: 'online', serial: 'R1', resource: null, part: { id: 'x/coax', manufacturer: 'X', model: 'R', category: 'Routers' } },
    ];
    const parts = [
      { id: 'k/33210a', ports: [{ group: 'OUTPUT', side: 'output', domain: 'signal' }, { group: 'SYNC', side: 'output', domain: 'signal' }, { group: 'EXT TRIG', side: 'input', domain: 'signal' }, { group: 'MAINS IN', side: 'input', domain: 'power' }] },
      { id: 'k/66104a', ports: [{ group: 'DC OUT +', side: 'output', domain: 'power' }, { group: 'DC OUT -', side: 'output', domain: 'power' }, { group: 'SENSE +', side: 'input', domain: 'power' }] },
      { id: 'x/coax', ports: [{ group: 'IN', side: 'input', domain: 'video', count: 2 }, { group: 'OUT', side: 'output', domain: 'video', count: 3 }] },
    ];
    const bim = matchMeters([gen, ...psus, router], instances, parts);
    expect(bim.get('visa_gen')!.role).toBe('out');
    expect(bim.get('visa_psu4')!.label).toBe('Keysight 66104A @ tcpip0::44.44.44.222::gpib7,30,4::instr');   // its own slot, not the first serial 0
    expect(bim.get('visa_psu5')!.part).toBe('k/66104a');
    expect(bim.get('rtr')!.role).toBe('both');
    expect(bim.get('rtr')!.outputs.map((o) => o.name)).toEqual(['OUT 1', 'OUT 2', 'OUT 3']);
    const layer = buildLayer([gen, ...psus, router], [], [], (d) => bim.get(d.key)!.role as 'out' | 'both', bim);
    const OUTS = `Routes/Sources/${FOLDER}/${OUT}`;
    const src = layer.get(`${OUTS}/index.json`) as string[];
    expect(src).toHaveLength(3);
    const g = layer.get(`${OUTS}/${src.find((f) => f.includes('33210A'))}`) as { items: string[]; bim: string };
    expect(g.items).toEqual(['OUTPUT', 'SYNC']);
    expect(g.bim).toBe('k/33210a');
    const r = layer.get(`Routes/Destinations/${FOLDER}/${IO}/001_Router.json`) as { twists: { name: string }[] };
    expect(r.twists.map((t) => t.name)).toEqual(['IN 1', 'IN 2']);   // the router's coax inputs, from its part
  });

  it('the family\'s thing.json roles decide (ROAD-3516): inputs + metering is a meter whose jacks open the instrument editor', () => {
    expect(roleFromThing(['source', 'inputs', 'metering'], 2, 2)).toBe('meter');   // an SMU: the BIM count alone said source
    expect(roleFromThing(['source', 'metering'], 1, 2)).toBe('out');               // a supply meters what it sources
    expect(roleFromThing(['inputs'], 2, 3)).toBe('both');                          // a router
    expect(roleFromThing([], 2, 3)).toBeNull();                                    // no thing.json: the BIM decides
    const lib = roleIndex([{ model: '2450', roles: ['source', 'inputs', 'metering'] }, { model: 'X', roles: [] }]);
    expect([...lib.keys()]).toEqual(['2450']);
    const smu = dev({ name: '2450', key: 'visa_smu', make: 'KEITHLEY', model: '2450', serial: 'S1', address: 'TCPIP0::10.0.0.5::INSTR', wires: ['visa'] });
    const prefix = 'APK.audio/System/Protocols/visa/Device/SMU/2450/DevS1';
    const instances = [{ key: 's', state: 'online', serial: 'S1', resource: 'TCPIP::10.0.0.5::INSTR', panel: { prefix },
      part: { id: 'k/2450', manufacturer: 'Keithley', model: '2450', category: 'Test & Measurement' } }];
    const parts = [{ id: 'k/2450', ports: [{ group: 'FORCE HI', side: 'input', domain: 'signal' }, { group: 'SENSE HI', side: 'input', domain: 'signal' },
      { group: 'OUT A', side: 'output', domain: 'signal' }, { group: 'OUT B', side: 'output', domain: 'signal' }] }];
    const library = { rolesOf: (d: { model?: string }) => lib.get(String(d.model).toLowerCase()) ?? [], typeOf: () => 'SMU' };
    expect(matchMeters([smu], instances, parts).get('visa_smu')!.role).toBe('out');   // without the library: the BIM count
    const bim = matchMeters([smu], instances, parts, library);
    const m = bim.get('visa_smu')!;
    expect([m.role, m.family, m.prefix]).toEqual(['meter', 'SMU', prefix]);
    const layer = buildLayer([smu], [], [], () => 'meter', bim);
    const M = encodeURIComponent(CLASS_FOLDERS.meter);
    const files = layer.get(`Routes/Destinations/${FOLDER}/${M}/index.json`) as string[];
    const d = layer.get(`Routes/Destinations/${FOLDER}/${M}/${files[1]}`) as { twists: { name: string; instrument: { roles: string[]; prefix: string; family: string } }[] };
    expect(d.twists.map((t) => t.name)).toEqual(['FORCE HI', 'SENSE HI']);
    expect(d.twists[0]!.instrument).toEqual({ label: 'Keithley 2450 #S1', family: 'SMU', model: '2450', roles: ['source', 'inputs', 'metering'], prefix });
  });
});
