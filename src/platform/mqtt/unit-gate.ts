// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// THE UNIT GATE (ROAD-3558): a VISA unit's …/Write goes through the recorder agent's
// one-exchange-per-unit gate while its keeper (System/Agents/capture-recorder, retained,
// last will = offline) says online. The rule is the contract's (contracts/src/unit-gate.ts,
// vectors/unit_gate.json); this only keeps the keeper's state for one client.

// @ts-expect-error TS7016 — untyped vendored ES module (a .d.ts beside it would fail the vendor check)
import { gateUnitWrite as gateUntyped, gateAgentOnline as onlineUntyped, UNIT_GATE_AGENT_TOPIC as AGENT } from '../../vendor/apk-contracts/apk-contracts.mjs';

const gateUnitWrite = gateUntyped as (topic: string, command: string, by: string, online: boolean, ttlS?: number) => { topic: string; payload: string };
const gateAgentOnline = onlineUntyped as (row: unknown) => boolean;

export interface UnitGate {
  /** The keeper's row: subscribe to it. */
  readonly agentTopic: string;
  /** True when this message was the keeper's row (it is then consumed). */
  heard(topic: string, payload: Uint8Array): boolean;
  /** The publish a write to `topic` should be. */
  route(topic: string, text: string): { topic: string; payload: string };
}

export function makeUnitGate(by: string): UnitGate {
  let online = false;
  return {
    agentTopic: AGENT as string,
    heard(topic, payload) {
      if (topic !== AGENT) return false;
      online = gateAgentOnline(new TextDecoder().decode(payload));
      return true;
    },
    route(topic, text) {
      return gateUnitWrite(topic.replace(/^\/+/, ''), String(text), by, online);
    },
  };
}
