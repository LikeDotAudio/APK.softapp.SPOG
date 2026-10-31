// src/platform/gfx-monitor.test-broker — the in-memory retained broker the gfx-monitor tests
// share (not a test file itself). Each session drops its own echoes and replays every retained
// topic to a late subscriber, like client.ts; it beats presence on creation the way client.ts
// beats on connect, and `beat` / `die` play the 1 Hz heartbeat and the Last Will (ROAD-3455).
import { topicMatches } from './mqtt/topics.js';
import type { TwistBus } from './mqtt/types.js';

export function broker() {
  const retained = new Map<string, unknown>();
  const subs = new Set<{ origin: string; filter: string; cb: (t: string, p: unknown) => void }>();
  const pubs: string[] = [];
  const deliver = (from: string, topic: string, payload: unknown): void => {
    retained.set(topic, payload);
    for (const s of [...subs]) if (s.origin !== from && topicMatches(s.filter, topic)) s.cb(topic, payload);
  };
  const presence = (origin: string, active: boolean): void =>
    deliver(origin, `system/presence/${origin}`, { active, full_id: `${origin}:TWIST:1`, ...(active ? { ts: Date.now() } : {}) });
  const session = (origin: string): TwistBus => {
    presence(origin, true);
    return {
      ready: Promise.resolve(), sessionId: `${origin}:TWIST:1`,
      status: () => ({ enabled: true, connected: true }),
      publishConfig: () => {}, publishValue: () => {},
      publishRaw: (topic: string, payload: unknown) => { pubs.push(topic); deliver(origin, topic, payload); },
      subscribe: (filter: string, cb: (t: string, p: unknown) => void) => {
        const s = { origin, filter, cb };
        subs.add(s);
        for (const [t, p] of retained) if (topicMatches(filter, t)) cb(t, p);
        return () => subs.delete(s);
      },
      dispose: () => {},
    };
  };
  return { session, pubs, retained, beat: (origin: string) => presence(origin, true), die: (origin: string) => presence(origin, false) };
}
