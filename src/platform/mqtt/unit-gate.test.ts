// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { makeUnitGate } from './unit-gate.js';

const W = 'APK.audio/System/Protocols/visa/Device/DMM/34401A/Dev7/Write';
const enc = (s: string): Uint8Array => new TextEncoder().encode(s);

describe('the unit gate (ROAD-3558)', () => {
  it('writes straight to the unit until the keeper says online, then requests through it', () => {
    const g = makeUnitGate('spog:test');
    expect(g.route(W, ':READ?')).toEqual({ topic: W, payload: ':READ?' });
    expect(g.heard(g.agentTopic, enc('{"status":"online"}'))).toBe(true);
    const out = g.route(`/${W}`, ':READ?');
    expect(out.topic).toBe('APK.audio/System/Protocols/capture-recorder/outgoing/write');
    expect(JSON.parse(out.payload)).toEqual({ device: 'visa/DMM/34401A/Dev7', command: ':READ?', by: 'spog:test' });
    g.heard(g.agentTopic, enc('{"status":"offline"}'));
    expect(g.route(W, 'x').topic).toBe(W);
  });
  it('leaves any other topic alone', () => {
    const g = makeUnitGate('spog:test');
    g.heard(g.agentTopic, enc('{"status":"online"}'));
    expect(g.heard('APK.audio/Gui/x', enc(''))).toBe(false);
    expect(g.route('APK.audio/Gui/x', 'y')).toEqual({ topic: 'APK.audio/Gui/x', payload: 'y' });
  });
});
