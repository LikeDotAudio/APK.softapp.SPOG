// src/editors/obs-recorder/obs — an obs-websocket v5 client (OBS Studio ≥ 28),
// small and dependency-free. Pure where it can be: the auth string and the
// message shapes are testable without a socket.
//
// Protocol: the server says Hello (op 0, maybe with an auth challenge+salt); we
// Identify (op 1); it says Identified (op 2). Requests are op 6
// {requestType, requestId, requestData}; their responses op 7; events op 5.
// https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md

export const DEFAULT_URL = 'ws://localhost:4455';
const RPC_VERSION = 1;
/** EventSubscription bitmask: General | Config | Scenes | Outputs. */
const EVENTS = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 6);

const b64 = (bytes: ArrayBuffer): string => {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s);
};
const sha256 = async (text: string): Promise<ArrayBuffer> =>
  crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

/** The v5 auth string: base64(sha256(base64(sha256(password + salt)) + challenge)). */
export async function authString(password: string, salt: string, challenge: string): Promise<string> {
  const secret = b64(await sha256(password + salt));
  return b64(await sha256(secret + challenge));
}

export interface ObsState {
  connected: boolean;
  version?: string;
  recording: boolean;
  paused: boolean;
  recordTime?: string;
  streaming: boolean;
  scene?: string;
  scenes: string[];
}

export const emptyState = (): ObsState => ({ connected: false, recording: false, paused: false, streaming: false, scenes: [] });

/** Fold one event (op 5) into the state; unknown events change nothing. */
export function applyEvent(s: ObsState, type: string, data: Record<string, unknown>): ObsState {
  switch (type) {
    case 'RecordStateChanged': {
      const st = String(data.outputState ?? '');
      return { ...s, recording: !!data.outputActive, paused: st === 'OBS_WEBSOCKET_OUTPUT_PAUSED' };
    }
    case 'StreamStateChanged': return { ...s, streaming: !!data.outputActive };
    case 'CurrentProgramSceneChanged': return { ...s, scene: String(data.sceneName ?? s.scene ?? '') };
    default: return s;
  }
}

type Pending = { resolve: (v: Record<string, unknown>) => void; reject: (e: Error) => void };

/** One connection. `onState` gets every change; `request` resolves with responseData. */
export class ObsClient {
  state: ObsState = emptyState();
  private ws: WebSocket | null = null;
  private seq = 0;
  private pending = new Map<string, Pending>();
  constructor(private onState: (s: ObsState) => void, private onError: (e: Error) => void) {}

  connect(url: string, password: string): void {
    this.close();
    let ws: WebSocket;
    try { ws = new WebSocket(url); } catch (e) { this.onError(e as Error); return; }
    this.ws = ws;
    ws.onerror = () => this.onError(new Error(`OBS did not answer at ${url} — is Tools → WebSocket Server Settings on?`));
    ws.onclose = () => { this.set({ ...emptyState() }); this.pending.forEach((p) => p.reject(new Error('OBS closed the connection'))); this.pending.clear(); };
    ws.onmessage = async (m) => {
      let msg: { op: number; d: Record<string, any> };
      try { msg = JSON.parse(String(m.data)); } catch { return; }
      const d = msg.d ?? {};
      if (msg.op === 0) {
        const identify: Record<string, unknown> = { rpcVersion: RPC_VERSION, eventSubscriptions: EVENTS };
        if (d.authentication) identify.authentication = await authString(password, d.authentication.salt, d.authentication.challenge);
        ws.send(JSON.stringify({ op: 1, d: identify }));
      } else if (msg.op === 2) {
        this.set({ ...this.state, connected: true });
        void this.refresh();
      } else if (msg.op === 5) {
        this.set(applyEvent(this.state, d.eventType, d.eventData ?? {}));
      } else if (msg.op === 7) {
        const p = this.pending.get(d.requestId);
        if (!p) return;
        this.pending.delete(d.requestId);
        if (d.requestStatus?.result) p.resolve(d.responseData ?? {});
        else p.reject(new Error(`${d.requestType}: ${d.requestStatus?.comment ?? `code ${d.requestStatus?.code}`}`));
      }
    };
  }

  request(type: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error('Not connected to OBS'));
    const id = `spog-${++this.seq}`;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ op: 6, d: { requestType: type, requestId: id, ...(data ? { requestData: data } : {}) } }));
    });
  }

  /** Read everything the panel shows (after connect, and on demand). */
  async refresh(): Promise<void> {
    const [ver, rec, str, scenes] = await Promise.all([
      this.request('GetVersion'), this.request('GetRecordStatus'), this.request('GetStreamStatus'), this.request('GetSceneList'),
    ]);
    this.set({
      ...this.state,
      version: `OBS ${ver.obsVersion} · websocket ${ver.obsWebSocketVersion}`,
      recording: !!rec.outputActive, paused: !!rec.outputPaused, recordTime: String(rec.outputTimecode ?? ''),
      streaming: !!str.outputActive,
      scene: String(scenes.currentProgramSceneName ?? ''),
      scenes: ((scenes.scenes as { sceneName: string }[]) ?? []).map((s) => s.sceneName).reverse(),
    });
  }

  close(): void { if (this.ws) { this.ws.onclose = null; this.ws.close(); this.ws = null; } this.set(emptyState()); }
  private set(s: ObsState): void { this.state = s; this.onState(s); }
}
