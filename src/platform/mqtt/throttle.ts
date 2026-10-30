// src/platform/mqtt/throttle — per-topic trailing-edge coalescing for publishValue
// (audit F4). Params publish THROTTLED by default (a slider drag / prompter scroll
// fires ~60 Hz); coalesce per-topic to ~20 Hz so the broker sees an order of
// magnitude fewer messages and the final retained value always lands. Discrete
// one-shots bypass this (they pass {throttle:false} and call send() directly).
//
// Refinements (payload-optimisation): every leading send arms the window timer, so
// a topic's slot lives only while it is inside its window — the map holds the
// topics moving NOW, not every param ever touched. `pending` is presence-flagged
// (a null/undefined payload is still a value), and dispose() FLUSHES the pending
// trailing values instead of dropping them, so a drag released just before the
// page closes still lands its final retained value.

type SendFn = (topic: string, payload: unknown) => void;
interface Slot { timer: ReturnType<typeof setTimeout>; has: boolean; pending: unknown }

export interface Throttler {
  /** Queue a payload for a topic; sends on the leading edge, then coalesces to the trailing edge. */
  push(topic: string, payload: unknown): void;
  /** Send every pending trailing value now and close all windows. */
  flush(): void;
  /** Flush pending trailing sends, then drop all state (call on bus dispose). */
  dispose(): void;
  /** Topics currently inside their coalescing window (bounded by activity, not history). */
  size(): number;
}

export function makeThrottler(send: SendFn, ms = 50): Throttler {
  const state = new Map<string, Slot>();
  // Close a topic's window: send its trailing value (and open a fresh window for
  // it), or — nothing pending — forget the topic entirely.
  const tick = (topic: string): void => {
    const s = state.get(topic); if (!s) return;
    if (!s.has) { state.delete(topic); return; }
    const p = s.pending; s.has = false; s.pending = undefined;
    s.timer = setTimeout(() => tick(topic), ms);
    try { send(topic, p); } catch { /* a failed send must not wedge the window */ }
  };
  const flush = (): void => {
    const live = [...state.entries()];
    state.clear();
    for (const [topic, s] of live) {
      clearTimeout(s.timer);
      if (s.has) { try { send(topic, s.pending); } catch { /* keep flushing the rest */ } }
    }
  };
  return {
    push(topic, payload) {
      const st = state.get(topic);
      if (st) { st.has = true; st.pending = payload; return; }   // in window → keep only the latest
      state.set(topic, { timer: setTimeout(() => tick(topic), ms), has: false, pending: undefined });
      send(topic, payload);                                       // leading edge
    },
    flush,
    dispose: flush,
    size: () => state.size,
  };
}
