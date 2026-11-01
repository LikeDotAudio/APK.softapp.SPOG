// src/domain/ocr/attach-plan.test — "+ ATTACH" is SCAN's Fill decision, with the
// same refusals; ADD ALL takes labelled values, one per field (ROAD-3475).
import { describe, it, expect } from 'vitest';
import { attachOutcome, planAddAll } from './attach-plan.js';
import { entriesOf } from '../scan/netlist.js';
import type { Candidate } from './candidates.js';

const entries = [
  ...entriesOf('Routes/Sources/Audio/DSP 1.json', { name: 'DSP 1' }),
  ...entriesOf('Routes/Sources/Audio/DSP 2.json', { name: 'DSP 2', serial: 'KX7R-24918' }),
  ...entriesOf('Routes/Sources/Discovered/amp.json', { name: 'AMP', device: { serial: 'D-1', mac: '00:1D:C1:00:00:01' } }, true),
];
const [dsp1, dsp2, amp] = entries;
const c = (kind: Candidate['kind'], value: string, labelled = true): Candidate => ({ kind, value, labelled, wordIds: [] });

describe('attachOutcome (the Fill path)', () => {
  it('fills the target card field the candidate names', () => {
    expect(attachOutcome(c('asset_tag', 'AT-004512'), dsp1!, entries)).toMatchObject({ kind: 'fill', field: 'asset_tag', value: 'AT-004512', entry: { name: 'DSP 1' } });
    expect(attachOutcome(c('mac', '00:1D:C1:4A:7F:22'), dsp1!, entries)).toMatchObject({ kind: 'fill', field: 'mac' });
  });
  it('refuses with no target, on a discovered device, and a serial another unit holds', () => {
    expect(attachOutcome(c('serial', 'X1'), null, entries)).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/no device card/) });
    expect(attachOutcome(c('serial', 'X1'), amp!, entries)).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/discovered device/) });
    expect(attachOutcome(c('serial', 'kx7r 24918'), dsp1!, entries)).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/already recorded on DSP 2/) });
    expect(attachOutcome(c('mac', '00-1d-c1-00-00-01'), dsp1!, entries)).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/already recorded on AMP/) });
    expect(attachOutcome(c('serial', 'KX7R-24918'), dsp2!, entries)).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/already has serial/) });
  });
});

describe('planAddAll', () => {
  it('takes the labelled values and a bare MAC; leaves shape-only serials/tags for the operator', () => {
    const plan = planAddAll([c('serial', 'S1'), c('mac', '00:01:C1:4A:7F:22', false), c('asset_tag', 'IT-0098812', false)]);
    expect(plan.take.map((x) => x.kind)).toEqual(['serial', 'mac']);
    expect(plan.skipped).toEqual([{ candidate: c('asset_tag', 'IT-0098812', false), reason: expect.stringMatching(/no printed label/) }]);
  });
  it('two different serials on one photo is a question, not a pick', () => {
    const plan = planAddAll([c('serial', 'S1'), c('serial', 'S2'), c('asset_tag', 'AT-1')]);
    expect(plan.take.map((x) => x.value)).toEqual(['AT-1']);
    expect(plan.skipped.map((s) => s.reason)).toEqual([expect.stringMatching(/2 different serials/), expect.stringMatching(/2 different serials/)]);
  });
});
