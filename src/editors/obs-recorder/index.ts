// src/editors/obs-recorder — OBS Studio as a recording DESTINATION.
//
// Owner (2026-11-04): "an obs recorder as destination in spog". Opened on a twist
// named OBS (the Encoder group carries an OBS Recorder). It drives OBS over its
// own obs-websocket v5 server (Tools → WebSocket Server Settings, port 4455):
// record start / stop / pause / resume, stream start / stop, program scene, and
// the live recording timecode — and lists what is routed into this twist, which
// is what the operator should have OBS capture. The URL and password are this
// browser's (localStorage); a page served over https can reach ws://localhost.

import type { EditorPlugin } from '../types.js';
import { el, addStyles } from '../../ui/dom.js';
import { hint } from '../../ui/tip.js';
import { PAL } from '../../domain/palette.js';
import { ObsClient, DEFAULT_URL, type ObsState } from './obs.js';

const STYLE = `
.obsr{display:flex;flex-direction:column;gap:10px;color:${PAL.grey90s0};font:13px Inter,system-ui,sans-serif}
.obsr .bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.obsr input,.obsr button{background:${PAL.grey08};color:${PAL.grey90s0};border:1px solid ${PAL.grey21};border-radius:6px;padding:5px 10px;font:inherit}
.obsr button{cursor:pointer}.obsr button:disabled{opacity:.4;cursor:default}
.obsr .rec{font:600 22px ui-monospace,monospace}
.obsr .rec.on{color:${PAL.orange50}}
.obsr .state{color:${PAL.grey64}}
.obsr .scenes{display:flex;gap:6px;flex-wrap:wrap}
.obsr .scenes button.on{border-color:${PAL.orange50};color:${PAL.orange50}}
.obsr .err{color:${PAL.orange50}}`;

const remember = (k: string, v?: string): string => {
  try { if (v !== undefined) localStorage.setItem(`spog.obs.${k}`, v); return localStorage.getItem(`spog.obs.${k}`) ?? ''; } catch { return v ?? ''; }
};

const plugin: EditorPlugin = {
  id: 'obs-recorder',
  title: 'OBS Recorder',
  blurb: 'Record (and stream) what is routed here with OBS Studio, over its WebSocket server.',
  order: 40,
  match: (name) => /\bOBS\b/i.test(name),
  render(host, ctx) {
    addStyles('obsr-css', STYLE);
    const url = el('input', { value: remember('url') || DEFAULT_URL, size: 24 });
    const pass = el('input', { type: 'password', value: remember('pass'), placeholder: 'password (blank if none)' });
    hint(url, 'OBS → Tools → WebSocket Server Settings: enable it; the default port is 4455.');
    const connect = el('button', { textContent: 'Connect' });
    const status = el('div', { class: 'state', textContent: 'Not connected.' });
    const err = el('div', { class: 'err' });
    const time = el('div', { class: 'rec', textContent: '● 00:00:00' });
    const btn = (label: string, run: () => Promise<unknown>): HTMLButtonElement => {
      const b = el('button', { textContent: label });
      b.onclick = () => { err.textContent = ''; run().then(() => client.refresh()).catch((e: Error) => { err.textContent = e.message; }); };
      return b;
    };
    const client: ObsClient = new ObsClient((s) => paint(s), (e) => { err.textContent = e.message; });
    const start = btn('● Record', () => client.request('StartRecord'));
    const stop = btn('■ Stop', () => client.request('StopRecord'));
    const pause = btn('❚❚ Pause', () => client.request(client.state.paused ? 'ResumeRecord' : 'PauseRecord'));
    const stream = btn('Stream', () => client.request(client.state.streaming ? 'StopStream' : 'StartStream'));
    const scenes = el('div', { class: 'scenes' });
    const routed = el('div', { class: 'state' });

    const paint = (s: ObsState): void => {
      status.textContent = s.connected ? `${s.version ?? 'Connected'} — ${s.recording ? (s.paused ? 'recording paused' : 'RECORDING') : 'not recording'}${s.streaming ? ' · STREAMING' : ''}` : 'Not connected.';
      time.className = `rec${s.recording && !s.paused ? ' on' : ''}`;
      time.textContent = `● ${(s.recordTime || '00:00:00').slice(0, 8)}`;
      connect.textContent = s.connected ? 'Disconnect' : 'Connect';
      [start, stop, pause, stream].forEach((b) => { b.disabled = !s.connected; });
      start.disabled = !s.connected || s.recording;
      stop.disabled = !s.connected || !s.recording;
      pause.disabled = !s.connected || !s.recording;
      pause.textContent = s.paused ? '▶ Resume' : '❚❚ Pause';
      stream.textContent = s.streaming ? 'Stop stream' : 'Start stream';
      scenes.replaceChildren(...s.scenes.map((name) => {
        const b = btn(name, () => client.request('SetCurrentProgramScene', { sceneName: name }));
        if (name === s.scene) b.className = 'on';
        return b;
      }));
    };
    connect.onclick = () => {
      err.textContent = '';
      if (client.state.connected) { client.close(); return; }
      client.connect(remember('url', url.value.trim() || DEFAULT_URL), remember('pass', pass.value));
    };

    const feeds = ctx.sources.map((f) => (f as { name?: string }).name).filter(Boolean);
    routed.textContent = feeds.length ? `Routed here: ${feeds.join(', ')} — set OBS to capture these.` : 'Nothing routed here yet: drag a source onto this twist.';
    host.append(el('div', { class: 'obsr' }, [
      el('div', { class: 'bar' }, [el('b', { textContent: `⏺ ${ctx.twist.name}` }), url, pass, connect]),
      status, time,
      el('div', { class: 'bar' }, [start, pause, stop, stream]),
      el('div', {}, [el('div', { class: 'state', textContent: 'Program scene' }), scenes]),
      routed, err]));
    paint(client.state);
    // the timecode only moves when asked: while recording, ask once a second
    ctx.dispose.interval(() => {
      if (client.state.connected && client.state.recording) {
        client.request('GetRecordStatus').then((r) => { client.state = { ...client.state, recordTime: String(r.outputTimecode ?? '') }; paint(client.state); }).catch(() => {});
      }
    }, 1000);
    ctx.dispose.add(() => client.close());
  },
};

export default plugin;
