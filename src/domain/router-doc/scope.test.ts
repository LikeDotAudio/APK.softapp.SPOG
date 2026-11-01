import { describe, it, expect } from 'vitest';
import { ancestorKeys, touches } from './scope.js';

describe('router-doc scope — the groups an import touches (ROAD-3483)', () => {
  it('every proper ancestor of each name, as match keys', () => {
    const keys = ancestorKeys(['STUDIO 01 — WALL 02 — SB 03', '003_Primary — Prod 1', 'CAM 1']);
    expect([...keys].sort()).toEqual(['PRIMARY', 'STUDIO 01', 'STUDIO 01 — WALL 02']);
  });

  it('a folder label matches by the naming rules (order prefix, case, emoji, spaces)', () => {
    const keys = ancestorKeys(['Studio 01 — Wall  02 — SB 03']);
    expect(touches(keys, '001_Studio 01')).toBe(true);
    expect(touches(keys, '📹 studio 01 — wall 02')).toBe(true);
    expect(touches(keys, 'Studio 02')).toBe(false);
    expect(touches(keys, 'SB 03')).toBe(false);   // the leaf itself is not a folder
  });
});
