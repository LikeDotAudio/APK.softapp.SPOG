// src/platform/gfx-liveness — is the session that announced an on-air set still there? (ROAD-3455)
//
// The on-air set is RETAINED (gfx-monitor.ts), so the broker keeps handing it out after the
// switcher that announced it is gone. House rule: unreachable is dead, and trust decays. The
// set carries no liveness of its own; it borrows its announcer's. Every SPOG session beats
// SPOG/system/presence/<origin> at 1 Hz and its MQTT Last Will turns that topic to
// {active:false} the moment the broker loses it (client.ts). A reader follows the presence
// of each origin whose set it holds: a set counts only while its announcer's beat is fresh.
// (One will per MQTT connection, and the presence topic already has it: binding the set to
// that will is what makes a crash clear the wall.)

import type { TwistBus } from './mqtt/types.js';

/** Nothing unverified for this long is trusted: a set's own `ts` older than this reads empty. */
export const TRUST_MS = 5 * 60_000;
/** Presence beats at 1 Hz; this many ms with none and the announcer counts as gone. */
export const BEAT_STALE_MS = 15_000;
/** The announcer re-stamps a non-empty set this often, well inside TRUST_MS. */
export const REFRESH_MS = 60_000;
/** How often a monitor re-checks what it holds. */
export const TICK_MS = 5_000;

/** The presence topic client.ts beats (relative to the SPOG root). */
export const presenceTopic = (origin: string): string => `system/presence/${origin}`;
/** A session id "<hex8>:TWIST:<birth>" → its origin (the 8-hex prefix every consumer reads). */
export const originOf = (fullId: unknown): string => String(fullId ?? '').split(':')[0] ?? '';

export interface Liveness {
  /** Follow this origin's presence (idempotent; needs a live bus). */
  follow(origin: string): void;
  /** Its presence beat within BEAT_STALE_MS and it has not announced itself gone. */
  alive(origin: string): boolean;
  /** Stop following every origin not in `keep`. */
  prune(keep: Set<string>): void;
}

/** `changed` fires when a followed origin's presence flips (a Last Will lands, a beat returns). */
export function createLiveness(bus: () => TwistBus | null, changed: () => void): Liveness {
  const lastBeat = new Map<string, number>();   // origin → local receipt time of its last live beat
  const subs = new Map<string, () => void>();
  const alive = (origin: string): boolean => {
    const t = lastBeat.get(origin);
    return t !== undefined && Date.now() - t <= BEAT_STALE_MS;
  };
  return {
    follow(origin) {
      const b = bus();
      if (!b || !origin || subs.has(origin)) return;
      subs.set(origin, b.subscribe(presenceTopic(origin), (_t, p) => {
        const wasAlive = alive(origin);
        const active = !!p && typeof p === 'object' && (p as { active?: unknown }).active !== false;
        if (active) lastBeat.set(origin, Date.now()); else lastBeat.delete(origin);
        if (alive(origin) !== wasAlive) changed();
      }));
    },
    alive,
    prune(keep) {
      for (const [origin, off] of subs) if (!keep.has(origin)) { off(); subs.delete(origin); lastBeat.delete(origin); }
    },
  };
}
