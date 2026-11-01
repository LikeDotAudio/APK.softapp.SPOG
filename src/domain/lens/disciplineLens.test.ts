// src/domain/lens/disciplineLens.test — the Discipline Lens (ROAD-3473): classification,
// lens state, and the projection — which must never touch the netlist it reads.
import { describe, it, expect } from 'vitest';
import { classifyConnection, DISCIPLINES } from './disciplines.js';
import {
  lensMask, toLensState, isolateLens, toggleLens, resetLens, withStrength, maskedAt,
  disciplineCounts, ALL_LENS, type LensGraph, type LensState,
} from './mask.js';

const netlist = (): LensGraph => ({
  nodes: [
    { id: 'stagebox' }, { id: 'desk' }, { id: 'camera' }, { id: 'switcher' },
    { id: 'clock', own: { wire: 'PTP' } }, { id: 'idle' },
  ],
  edges: [
    { id: 'e1', from: 'stagebox', to: 'desk', facts: { kind: 'audio', wire: 'dante' } },
    { id: 'e2', from: 'camera', to: 'switcher', facts: { kind: 'video', format: 'ST 2110-20' } },
    { id: 'e3', from: 'desk', to: 'switcher', facts: { tags: ['signal-node', 'audio-imported'], wire: 'aes67' } },
    { id: 'e4', from: 'camera', to: 'desk', facts: { tags: ['signal-node', 'camera-control'] } },
  ],
});

describe('classifyConnection', () => {
  it('a bundle lights its carrier and its essence signal', () => {
    expect(classifyConnection({ kind: 'audio', wire: 'dante' })).toEqual(['audio', 'dante']);
    expect(classifyConnection({ format: 'ST 2110-30' })).toEqual(['audio', 'st2110-30']);
    expect(classifyConnection({ format: 'st2110-20' })).toEqual(['video', 'st2110-20']);
    expect(classifyConnection({ format: 'SMPTE ST 2110-40 ANC' })).toEqual(['control', 'st2110-40']);
    expect(classifyConnection({ wire: 'Q-LAN' })).toEqual(['audio', 'qlan']);
    expect(classifyConnection({ wire: 'RAVENNA' })).toEqual(['audio', 'ravenna']);
    expect(classifyConnection({ wire: 'PTPv2' })).toEqual(['network', 'ptp']);
    expect(classifyConnection({ wire: 'IEEE 1588' })).toEqual(['network', 'ptp']);
    expect(classifyConnection({ wire: 'NMOS IS-05' })).toEqual(['control', 'nmos']);
  });
  it('signal words come from kind, type, wire and tags (exact word beats first part)', () => {
    expect(classifyConnection({ tags: ['signal-node', 'video', 'video-main'] })).toEqual(['video']);
    expect(classifyConnection({ tags: ['camera-control'] })).toEqual(['control']);
    expect(classifyConnection({ kind: 'data' })).toEqual(['control']);
    expect(classifyConnection({ type: 'powerCON' })).toEqual(['power']);
    expect(classifyConnection({ wire: 'rj45' })).toEqual(['network']);
    expect(classifyConnection({ tags: ['panel'] })).toEqual(['panels']);
  });
  it('what nothing classifies is OTHER — never an empty set', () => {
    expect(classifyConnection({})).toEqual(['other']);
    expect(classifyConnection({ tags: ['signal-node', 'dropped-group'], wire: 'chromecast' })).toEqual(['other']);
  });
  it('carries no device names — only the protocol/signal vocabulary', () => {
    expect(classifyConnection({ wire: 'Yamaha CL5' })).toEqual(['other']);
  });
});

describe('lens state (view settings)', () => {
  it('junk reads as ALL, strength clamps', () => {
    expect(toLensState(null)).toEqual(ALL_LENS);
    expect(toLensState({ showing: ['nope', 7], strength: 'x' })).toEqual(ALL_LENS);
    expect(toLensState({ showing: ['dante', 'dante'], strength: 4 })).toEqual({ showing: ['dante'], strength: 1 });
    expect(toLensState({ showing: DISCIPLINES.map((d) => d.id), strength: 0.2 })).toEqual({ showing: null, strength: 0.2 });
  });
  it('ONLY isolates; ONLY again (or ALL) resets; toggle builds a set', () => {
    const only = isolateLens(ALL_LENS, 'dante');
    expect(only.showing).toEqual(['dante']);
    expect(isolateLens(only, 'dante').showing).toBeNull();
    expect(toggleLens(only, 'aes67').showing).toEqual(['aes67', 'dante'].sort((a, b) =>
      DISCIPLINES.findIndex((d) => d.id === a) - DISCIPLINES.findIndex((d) => d.id === b)));
    expect(toggleLens(only, 'dante').showing).toBeNull();
    expect(toggleLens(ALL_LENS, 'power').showing).not.toContain('power');
    expect(resetLens(only).showing).toBeNull();
    expect(withStrength(only, -1).strength).toBe(0);
  });
  it('the slider dims, and at full strength hides', () => {
    expect(maskedAt(0)).toEqual({ visible: true, dimmed: false, opacity: 1 });
    expect(maskedAt(0.5)).toEqual({ visible: true, dimmed: true, opacity: 0.55 });
    expect(maskedAt(1)).toEqual({ visible: false, dimmed: true, opacity: 0 });
  });
});

describe('lensMask — the projection', () => {
  it('ALL masks nothing', () => {
    const res = lensMask(netlist(), ALL_LENS);
    expect([...res.nodes.values(), ...res.edges.values()].every((m) => m.visible && !m.dimmed && m.opacity === 1)).toBe(true);
  });

  it('ONLY Dante dims non-Dante nodes and edges, and the project/netlist object is deep-equal before and after', () => {
    const project = netlist();
    const before = structuredClone(project);
    const res = lensMask(project, isolateLens(ALL_LENS, 'dante'));
    expect(project).toEqual(before);
    expect(res.edges.get('e1')).toEqual({ visible: true, dimmed: false, opacity: 1 });
    for (const e of ['e2', 'e3', 'e4']) expect(res.edges.get(e)).toMatchObject({ visible: true, dimmed: true });
    expect(res.nodes.get('stagebox')?.dimmed).toBe(false);
    expect(res.nodes.get('desk')?.dimmed).toBe(false);
    for (const n of ['camera', 'switcher', 'clock', 'idle']) expect(res.nodes.get(n)?.dimmed).toBe(true);
    expect(res.edges.get('e2')?.opacity).toBeLessThan(1);
  });

  it('HIDE at full strength hides the rest; a node with no edges answers by its own port', () => {
    const s: LensState = { showing: ['ptp'], strength: 1 };
    const res = lensMask(netlist(), s);
    expect(res.nodes.get('clock')).toEqual({ visible: true, dimmed: false, opacity: 1 });
    expect(res.nodes.get('desk')).toEqual({ visible: false, dimmed: true, opacity: 0 });
    expect(res.edges.get('e1')?.visible).toBe(false);
  });

  it('a signal lens crosses bundles: ONLY Audio keeps the Dante and AES67 flows', () => {
    const res = lensMask(netlist(), isolateLens(ALL_LENS, 'audio'));
    expect(res.edges.get('e1')?.dimmed).toBe(false);
    expect(res.edges.get('e3')?.dimmed).toBe(false);
    expect(res.edges.get('e2')?.dimmed).toBe(true);
  });

  it('counts per discipline let the toolbar show which lenses hold anything', () => {
    const counts = disciplineCounts(lensMask(netlist(), ALL_LENS));
    expect(counts.get('dante')).toBe(1);
    expect(counts.get('audio')).toBe(2);
    expect(counts.get('control')).toBe(1);
    expect(counts.get('power')).toBeUndefined();
  });
});
