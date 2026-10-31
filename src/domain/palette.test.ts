// src/domain/palette.test — the hex-literal ratchet (ROAD-3449, Colour Engine P2), in the
// shape of the root's check_brand_colour.py baseline: SPOG's colours live in ONE file,
// src/domain/palette.ts, and the count spelled anywhere else may fall and never rise.
// Lower CEILING in the same commit that moves literals into the palette (or onto a
// contract token); the test fails if CEILING is above the measured count too, so the
// gate tightens with every sweep instead of quietly keeping the old slack.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { PAL } from './palette.js';

const SRC = resolve(__dirname, '..');
/** The literals still spelled outside the palette (the files ROAD-3448 had open during the sweep). */
const CEILING = 140;
// The same measure as ROAD-3449's proof: *.ts under src/, minus tests and vendored copies,
// minus the palette itself and src/ui/clock-faces (its own repository, its own gate).
const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
const counted = (f: string): boolean => {
  const r = relative(SRC, f);
  return !/test|vendor/.test(r) && r !== 'domain/palette.ts' && !r.startsWith('ui/clock-faces/');
};

describe('palette ratchet (ROAD-3449)', () => {
  const all = files(SRC);
  it(`hex literals outside src/domain/palette.ts stay at or below ${CEILING}`, () => {
    const per = all.filter(counted).map((f) => [relative(SRC, f), (readFileSync(f, 'utf8').match(HEX) ?? []).length] as const)
      .filter(([, n]) => n > 0);
    const total = per.reduce((a, [, n]) => a + n, 0);
    expect(total, `over the ceiling — move them into PAL:\n${per.map(([f, n]) => `${n}\t${f}`).join('\n')}`).toBeLessThanOrEqual(CEILING);
    expect(total, `the count fell to ${total}: lower CEILING to match`).toBe(CEILING);
  });
  it('every palette colour is used, and spelled once', () => {
    const text = all.filter((f) => relative(SRC, f) !== 'domain/palette.ts' && !f.endsWith('.test.ts')).map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(Object.keys(PAL).filter((k) => !new RegExp(`PAL\\.${k}\\b`).test(text))).toEqual([]);
    const vals = Object.values(PAL);
    expect(vals.length).toBe(new Set(vals).size);
  });
  it('the palette spells neither the brand accent nor a contract state tone', () => {
    const vals = Object.values(PAL) as string[];
    for (const v of ['#f4902c', '#ffa552', '#2ea043', '#f85149', '#d29922']) expect(vals).not.toContain(v);
  });
});
