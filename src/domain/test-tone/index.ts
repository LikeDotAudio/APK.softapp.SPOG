// src/domain/test-tone — SPOG's synthetic, routable line-up TONE (the audio half
// of the test frame; the picture half is src/domain/test-card).
//
// Every source carries the same EBU R68 line-up — a 1 kHz sine at −18 dBFS — so a
// level check means the same thing on every destination. What tells sources APART
// is an ident CADENCE keyed on the test card's own ident number: at the top of each
// cycle the LEFT leg drops out 1–4 times (the right leg runs continuous, EBU
// "stereo ident" style), so a listener can count which feed is on the monitor and
// hear a left/right swap. Pure maths, zero DOM/audio — the Web Audio player that
// voices it is src/ui/test-tone-player.ts. See docs/Audit/Test-Frame-Routing-Audit.md.

import { identFor } from '../test-card/ident.js';

export type ToneLeg = 'L' | 'R';

export interface ToneSpec {
  /** Stable id of the source voicing the tone (the routed label). */
  id: string;
  /** Sine frequency (Hz). */
  freqHz: number;
  /** Line-up level (dBFS, sine RMS-referenced like a PPM/loudness lineup). */
  levelDbfs: number;
  /** Ident cadence period (ms). */
  cycleMs: number;
  /** Left-leg dropouts at the top of each cycle (1–4). 0 = no ident (continuous). */
  blips: number;
  /** Length of each dropout AND of the tone between dropouts (ms). */
  blipMs: number;
  /** A faulted source voices silence, matching the card's NO SIGNAL slate. */
  silent: boolean;
}

export const LINEUP_HZ = 1000;
export const LINEUP_DBFS = -18;

/** The tone for a source label — the same ident seed the test card uses, so the
 *  number on the slate and the count in your ears agree. */
export function toneFor(label: string, opts?: { faulted?: boolean }): ToneSpec {
  const { num } = identFor(label);
  return {
    id: label,
    freqHz: LINEUP_HZ,
    levelDbfs: LINEUP_DBFS,
    cycleMs: 4000,
    blips: ((num - 1) % 4) + 1,
    blipMs: 250,
    silent: !!opts?.faulted,
  };
}

/** dBFS → linear amplitude (0 dBFS = 1). */
export const dbToGain = (db: number): number => Math.pow(10, db / 20);

/** The dropout windows within one cycle, as [startMs, endMs) pairs, in order. */
export function identGaps(spec: ToneSpec): Array<[number, number]> {
  const gaps: Array<[number, number]> = [];
  for (let i = 0; i < spec.blips; i++) {
    const s = i * 2 * spec.blipMs;
    gaps.push([s, s + spec.blipMs]);
  }
  return gaps;
}

/** The leg's on/off envelope (0 or 1) at time `tMs` since the tone started.
 *  The right leg is always on; the left drops out in the ident gaps. */
export function toneGateAt(spec: ToneSpec, tMs: number, leg: ToneLeg): 0 | 1 {
  if (spec.silent) return 0;
  if (leg === 'R') return 1;
  const p = ((tMs % spec.cycleMs) + spec.cycleMs) % spec.cycleMs;
  return identGaps(spec).some(([s, e]) => p >= s && p < e) ? 0 : 1;
}
