import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { manifestFor, signalsOf, tick, FLOOR_DB, SIM_PREFIX } from './sim-model.js';
import { simEnabled } from './simulator.js';

const ROUTES = join(__dirname, '../../../Routes');
function files(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) files(p, out);
    else if (n.endsWith('.json') && n !== 'index.json') out.push(p);
  }
  return out;
}

describe('sim-model — a Routes file as a running device', () => {
  it('reads every signal shape in use: stage box, items, players, boxes, talent kit', () => {
    expect(signalsOf({ prefix: 'V210-', count: 2, extraClass: 'video-st2' })).toEqual({
      video: ['V210-01', 'V210-02'],
      audio: ['V210-01 A1', 'V210-01 A2', 'V210-01 A3', 'V210-01 A4', 'V210-02 A1', 'V210-02 A2', 'V210-02 A3', 'V210-02 A4'],
    });
    expect(signalsOf({ items: ['MIC 1', 'MIC 2'] }).audio).toEqual(['MIC 1', 'MIC 2']);
    expect(signalsOf({ players: [{ name: 'P1', videos: [{ name: 'VIDEO 1', stack: { video: 'V1', audio: ['A1'] } }] }] }))
      .toEqual({ video: ['P1 VIDEO 1'], audio: ['P1 VIDEO 1 A1'] });
    expect(signalsOf({ boxes: [{ name: 'PROGRAM', audio: ['A1', 'A2'] }] }).audio).toEqual(['PROGRAM A1', 'PROGRAM A2']);
    expect(signalsOf({ source: { audio: ['MIC'], video: ['CAM'] } })).toEqual({ audio: ['MIC'], video: ['CAM'] });
  });

  it('inputs are controls (online, gain, mute); outputs are reports (status, level, format, tally)', () => {
    const m = manifestFor({ id: 'sb', name: 'SB', items: ['MIC 1'], status: 'LOST CLOCK' }, 'Routes/Sources/x.json', 'Sources')!;
    expect(m.id).toBe(SIM_PREFIX + 'sb');
    expect(m.inputs.map((i) => [i.id, i.writable])).toEqual([['online', true], ['gain_0', true], ['mute_0', true]]);
    expect(m.outputs.map((o) => o.id)).toEqual(['status', 'lvl_0']);
    expect(m.outputs[0]!.value).toBe('LOST CLOCK');
  });

  it("a room's twists are its inputs; a file with nothing to run is not a device", () => {
    const d = manifestFor({ id: 'r', name: 'ROOM', twists: [{ name: 'Monitor 1', accepts: 'video' }] }, 'u', 'Destinations')!;
    expect(d.outputs.map((o) => o.id)).toEqual(['status', 'in_0', 'src_0']);
    expect(manifestFor({ id: 'e', name: 'EMPTY' }, 'u', 'Sources')).toBeNull();
    expect(manifestFor(null, 'u', 'Sources')).toBeNull();
  });

  it('meters move, follow gain, drop to the floor when muted or offline; status follows online', () => {
    const m = manifestFor({ id: 'sb', items: ['A', 'B'] }, 'u', 'Sources')!;
    const at = (t: number) => new Map(tick(m, t, 'OK'));
    const a = at(0).get('lvl_0') as number, b = at(700).get('lvl_0') as number;
    expect(a).toBeGreaterThan(FLOOR_DB); expect(a).toBeLessThanOrEqual(0); expect(a).not.toBe(b);
    m.inputs.find((i) => i.id === 'gain_0')!.value = -10;
    expect(at(0).get('lvl_0')).toBeCloseTo(Math.max(FLOOR_DB, a - 10), 0);
    m.inputs.find((i) => i.id === 'mute_1')!.value = true;
    expect(at(0).get('lvl_1')).toBe(FLOOR_DB);
    m.inputs.find((i) => i.id === 'online')!.value = false;
    expect(at(0).get('status')).toBe('OFFLINE');
    expect(at(0).get('lvl_0')).toBe(FLOOR_DB);
  });

  it('every source and room defined in Routes/** that carries signal runs', () => {
    const all = files(ROUTES);
    let ran = 0;
    for (const f of all) {
      const area = f.slice(ROUTES.length + 1).split('/')[0]!;
      if (area === 'Schedule') continue;
      const m = manifestFor(JSON.parse(readFileSync(f, 'utf8')), f, area);
      if (m) { ran++; expect(m.inputs.length + m.outputs.length, f).toBeGreaterThan(1); }
    }
    expect(ran).toBeGreaterThan(150);
  });

  it('on by default; ?sim=off or a seat set to off stops it; ?sim=on wins', () => {
    expect(simEnabled('', null)).toBe(true);
    expect(simEnabled('?sim=off', null)).toBe(false);
    expect(simEnabled('', 'off')).toBe(false);
    expect(simEnabled('?sim=on', 'off')).toBe(true);
  });
});
