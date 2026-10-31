// src/domain/palette.test — the hex-literal ratchet (ROAD-3449, Colour Engine P2), in the
// shape of the root's check_brand_colour.py baseline: SPOG's colours live in ONE file,
// src/domain/palette.ts, and the count spelled anywhere else may fall and never rise.
// Lower CEILING in the same commit that moves literals into the palette (or onto a
// contract token); the test fails if CEILING is above the measured count too, so the
// gate tightens with every sweep instead of quietly keeping the old slack.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { HEX as TRUE } from './palette.js';
// @ts-expect-error TS7016 — untyped vendored ES module (the contract's browser build)
import { ACCENT, ACCENT_HOVER, STATE_TONES } from '../vendor/apk-contracts/apk-contracts.mjs';

const SRC = resolve(__dirname, '..');
const PALETTES = ['domain/palette.ts', 'ui/clock-faces/src/palette.ts'];
const ownFile = (f: string): boolean => !relative(SRC, f).startsWith('ui/clock-faces/');
/** The literals still spelled outside the palette: none since ROAD-3449's last sweep (audio-monitor, multi-viewer, faux-signal). */
const CEILING = 0;
// The same measure as ROAD-3449's proof: *.ts under src/, minus tests and vendored copies,
// minus the two palettes: this one and src/ui/clock-faces/src/palette.ts (that repository's
// own, held by its own test/palette.test.mjs).
const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
const counted = (f: string): boolean => {
  const r = relative(SRC, f);
  return !/test|vendor/.test(r) && !PALETTES.includes(r);
};

/** rgba()/hsl() spelled in .ts outside the palette machinery: ROAD-3456 sweeps these into `alpha(PAL.*, a)`. */
const RGBA_CEILING = 65;
const RGBA = /\brgba?\(|\bhsla?\(/g;
const MACHINERY = ['domain/colour-resolve.ts', 'ui/canvas-ink.ts'];
const LCARS = resolve(SRC, '../lcars.css');

describe('palette ratchet (ROAD-3449, ROAD-3456)', () => {
  const all = files(SRC);
  it(`rgba()/hsl() outside the palette stay at or below ${RGBA_CEILING}`, () => {
    const per = all.filter((f) => counted(f) && !MACHINERY.includes(relative(SRC, f)))
      .map((f) => [relative(SRC, f), (readFileSync(f, 'utf8').match(RGBA) ?? []).length] as const).filter(([, n]) => n > 0);
    const total = per.reduce((a, [, n]) => a + n, 0);
    expect(total, `over the ceiling — spell them alpha(PAL.<name>, a):\n${per.map(([f, n]) => `${n}\t${f}`).join('\n')}`).toBeLessThanOrEqual(RGBA_CEILING);
    expect(total, `the count fell to ${total}: lower RGBA_CEILING to match`).toBe(RGBA_CEILING);
  });
  it('lcars.css spells no colour: every one is var(--pal-*) (ROAD-3456)', () => {
    const css = readFileSync(LCARS, 'utf8');
    expect(css.match(HEX) ?? []).toEqual([]);
    expect(css.match(RGBA) ?? []).toEqual([]);
  });
  it(`hex literals outside src/domain/palette.ts stay at or below ${CEILING}`, () => {
    const per = all.filter(counted).map((f) => [relative(SRC, f), (readFileSync(f, 'utf8').match(HEX) ?? []).length] as const)
      .filter(([, n]) => n > 0);
    const total = per.reduce((a, [, n]) => a + n, 0);
    expect(total, `over the ceiling — move them into PAL:\n${per.map(([f, n]) => `${n}\t${f}`).join('\n')}`).toBeLessThanOrEqual(CEILING);
    expect(total, `the count fell to ${total}: lower CEILING to match`).toBe(CEILING);
  });
  it('every palette colour is used, and spelled once', () => {
    const text = all.filter((f) => ownFile(f) && relative(SRC, f) !== 'domain/palette.ts' && !f.endsWith('.test.ts')).map((f) => readFileSync(f, 'utf8')).join('\n');
    const css = readFileSync(LCARS, 'utf8');
    expect(Object.keys(TRUE).filter((k) => !new RegExp(`(PAL|HEX)\\.${k}\\b`).test(text) && !css.includes(`var(--pal-${k})`))).toEqual([]);
    const vals = Object.values(TRUE);
    expect(vals.length).toBe(new Set(vals).size);
  });
  it('the palette spells neither the brand accent nor a contract state tone', () => {
    const vals = Object.values(TRUE) as string[];
    // The contract's values, read from the vendored build (spelling them here would itself trip check.sh brand).
    const tones = Object.values(STATE_TONES as Record<string, { hex: string }>).map((t) => t.hex);
    expect(tones.length).toBeGreaterThanOrEqual(3);
    for (const v of [ACCENT as string, ACCENT_HOVER as string, ...tones]) expect(vals.map((x) => x.toLowerCase())).not.toContain(v.toLowerCase());
  });
});
