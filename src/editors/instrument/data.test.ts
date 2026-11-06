import { describe, it, expect } from 'vitest';
import { deviceKey, rigTopic, readingsFilter, readingOf, tracesOf, panesFor, isInstrumentRoles } from './data.js';

const SCOPE = 'APK.audio/System/Protocols/visa/Device/Oscilloscope/54641D/Dev716';

describe('instrument editor — what each thing.json role reads off the bus', () => {
  it('roles choose the panes: metering → readings, monitoring → trace', () => {
    expect(panesFor(['inputs', 'metering'])).toEqual({ readings: true, trace: false });
    expect(panesFor(['inputs', 'metering', 'monitoring'])).toEqual({ readings: true, trace: true });
    expect(isInstrumentRoles(['inputs'])).toBe(false);          // a router is a destination, not an instrument view
    expect(isInstrumentRoles(undefined)).toBe(false);
  });

  it('a box prefix gives the capture recorder device key, its rig slot and its readings filter', () => {
    expect(deviceKey(SCOPE)).toBe('visa/Oscilloscope/54641D/Dev716');
    expect(rigTopic(SCOPE)).toBe('APK.audio/System/Captures/Rig/visa-Oscilloscope-54641D-Dev716');
    expect(readingsFilter(SCOPE + '/')).toBe(`${SCOPE}/Reading/#`);
    expect(deviceKey('APK.audio/Gui/Panels/x')).toBeNull();
  });

  it('a reading is its command (and field), value and unit — a string payload or parsed', () => {
    const r = readingOf(`${SCOPE}/Reading/Measure_DC_Voltage`, '{"value":"+1.204E+01","unit":"V","ts":"2026-11-05T05:23:03.404Z"}');
    expect(r).toEqual({ name: 'Measure_DC_Voltage', value: '+1.204E+01', unit: 'V', ts: '2026-11-05T05:23:03.404Z' });
    expect(readingOf(`${SCOPE}/Reading/trigger_settings/level`, { value: 0.5 })!.name).toBe('trigger_settings/level');
    expect(readingOf(`${SCOPE}/Write`, '*IDN?')).toBeNull();
  });

  it('a rig\'s Trace/<source> leaves become lanes; one without points is not drawn', () => {
    const leaf = (src: string, pts: number[]) => JSON.stringify({ source: src, points: pts, start: -5e-4, stop: 4.99e-4,
      y_increment: 0.01, y_origin: 0, y_reference: 128 });
    const rig = { device: 'visa/Oscilloscope/54641D/Dev716', ts: 1, rig: {
      'Reading/Read_IDN': '{"value":"AGILENT"}', 'Trace/CHAN2': leaf('CHAN2', [0, 300, -4]), 'Trace/CHAN1': leaf('CHAN1', [128, 138]),
      'Trace/CHAN3': JSON.stringify({ source: 'CHAN3', points: [] }) } };
    const t = tracesOf(JSON.stringify(rig));
    expect(t.map((x) => x.source)).toEqual(['CHAN1', 'CHAN2']);
    expect([...t[1]!.points]).toEqual([0, 255, 0]);          // clamped to the byte range
    expect(t[0]!.volts!(138)).toBeCloseTo(0.1);
    expect(tracesOf({ rig: {} })).toEqual([]);
  });
});
