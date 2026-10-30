import { describe, it, expect } from 'vitest';
import { needsStaffing, staffingHtml, type SLane } from './captains-log-timeline-staffing.js';
import { buildGrid } from './captains-log-timeline-render.js';

const ops: SLane = { type: 'who', name: 'Ops', plans: [{ s: 0, e: 10, showName: 'Sports' }, { s: 5, e: 15, showName: 'Weather' }] };

describe('timeline — needs staffing', () => {
  it('two overlapping crew bookings → one window, +1 operator, both shows named', () => {
    expect(needsStaffing([ops])).toEqual([{ lane: 'Ops', kind: 'crew', s: 5, e: 10, peak: 2, extra: 1, shows: ['Sports', 'Weather'] }]);
  });
  it('back-to-back bookings (rehearsal → air → teardown) are not a clash', () => {
    const chain: SLane = { type: 'who', name: 'TD', plans: [{ s: 0, e: 5, showName: 'A' }, { s: 5, e: 10, showName: 'A' }, { s: 10, e: 12, showName: 'A' }] };
    expect(needsStaffing([chain])).toEqual([]);
  });
  it('a triple-booking reports the PEAK and +2; rooms say room, people lanes are skipped', () => {
    const room: SLane = { type: 'how', name: 'Studio A', plans: [{ s: 0, e: 10, showName: 'X' }, { s: 2, e: 8, showName: 'Y' }, { s: 4, e: 6, showName: 'Z' }] };
    const talent: SLane = { type: 'whom', name: 'Host', plans: ops.plans };
    const [w, ...rest] = needsStaffing([room, talent]);
    expect(rest).toEqual([]);
    expect(w).toMatchObject({ kind: 'room', s: 2, e: 8, peak: 3, extra: 2, shows: ['X', 'Y', 'Z'] });
    expect(staffingHtml([w!])).toContain('+2 rooms');
  });
  it('drops clashes already over and scopes the drawer to one lane', () => {
    expect(needsStaffing([ops], 10)).toEqual([]);
    const html = staffingHtml(needsStaffing([ops]), 'Other');
    expect(html).toContain('no double-bookings ahead');
    expect(staffingHtml(needsStaffing([ops]))).toContain('+1 operator<');
  });
  it('the ×N badge carries its lane so a click can open the scoped view', () => {
    const { html } = buildGrid([{ section: 'who', group: 'CREW / ROLES', name: 'Ops', kf: [], plans: ops.plans.map((p) => ({ ...p, label: p.showName! })) }], (t) => t, 100, 0, 20, 0, new Set());
    expect(html).toContain('data-staff="Ops"');
  });
});
