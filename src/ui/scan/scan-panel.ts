// src/ui/scan/scan-panel — the SCAN panel: decode labels from the camera, from
// photos (one dark-rack flash shot, or a batch) or from a keyboard-wedge scanner,
// and act on the netlist in one of three modes (ROAD-3476):
//
//   LOCATE  jump to the device / twist / source the code names (and make it the
//           active card when exactly one thing matches)
//   FILL    write the code into the active card's serial or asset tag (draft +
//           reversible Captain's Log entry; BUILD right)
//   VERIFY  compare with the active card; mismatches become Captain's Log
//           observations
//
// Decoding: platform BarcodeDetector when present, otherwise the self-hosted
// zxing-wasm engine (platform/scan). A runtime that can decode nothing SAYS so.
// Every read goes through one ScanGuard, so a label held in view, or the same
// tag across a burst of photos, is one event.

import { el, addStyles } from '../dom.js';
import { ScanGuard } from '../../domain/scan/scan-guard.js';
import { routeRead, type ScanMode } from '../../domain/scan/scan-route.js';
import type { IdentityField, NetEntry } from '../../domain/scan/netlist.js';
import type { ScanRead } from '../../domain/scan/symbology.js';
import { decodeFrame, scanEngine } from '../../platform/scan/scan-decode.js';
import { loadBundledDecoder } from '../../platform/scan/load-decoder.js';
import { loadNetlist } from '../../platform/scan/netlist-load.js';
import { onDraftsChange } from '../../platform/routes-store.js';
import { act, type Tone } from './scan-act.js';
import { startCamera, type CameraHandle } from './scan-camera.js';
import { SCAN_CSS } from './scan-styles.js';

const ENGINE_TEXT = {
  native: 'engine · platform BarcodeDetector (+ bundled zxing-wasm for stills)',
  registered: 'engine · bundled zxing-wasm 3.1.5 (self-hosted)',
  none: 'engine · NONE — this browser cannot decode; type the code instead',
} as const;

const cardText = (e: NetEntry | null): string => !e ? 'no active card — Locate or pick one'
  : `${e.parent ? `${e.parent} · ` : ''}${e.name} · serial ${e.serial ?? '—'} · asset ${e.asset_tag ?? '—'}${e.mac ? ` · mac ${e.mac}` : ''}${e.live ? ' · discovered' : ''}`;

export function initScanPanel(): void {
  addStyles('scan-styles', SCAN_CSS);
  if (document.querySelector('.scan-launch')) return;

  let mode: ScanMode = 'locate';
  let field: IdentityField = 'serial';
  let entries: NetEntry[] = [];
  let active: NetEntry | null = null;
  let camera: CameraHandle | null = null;
  let netlistStale = true;
  const guard = new ScanGuard();

  const launch = el('button', { class: 'scan-launch', title: 'Scan a label — Locate / Fill / Verify against the netlist' }, ['▦ SCAN']);
  const engine = el('span', { class: 'scan-engine' }, ['engine · …']);
  const modeBtns = (['locate', 'fill', 'verify'] as const).map((m) => el('button', { dataset: { mode: m } }, [m.toUpperCase()]));
  const fieldSel = el('select', { title: 'Fill writes this field' }, [el('option', { value: 'serial' }, ['serial']), el('option', { value: 'asset_tag' }, ['asset tag']), el('option', { value: 'mac' }, ['MAC'])]);
  const cardSel = el('select', { title: 'Active device card' });
  const card = el('div', { class: 'scan-card' }, [cardText(null)]);
  const video = el('video', { class: 'scan-video' });
  const camBtn = el('button', {}, ['START CAMERA']);
  const shoot = el('input', { type: 'file', accept: 'image/*', class: 'scan-photo' });
  shoot.setAttribute('capture', 'environment');   // phones open the rear camera (flash shot)
  const batch = el('input', { type: 'file', accept: 'image/*', multiple: true, class: 'scan-photo' });
  const shootBtn = el('button', {}, ['PHOTO']);
  const batchBtn = el('button', {}, ['IMPORT PHOTOS']);
  const typed = el('input', { type: 'text', placeholder: 'type / wedge-scan a code ⏎' });
  const log = el('div', { class: 'scan-log' }, [el('div', { class: 'scan-empty' }, ['No scans yet.'])]);
  const close = el('span', { class: 'scan-x', title: 'close' }, ['✕']);
  const panel = el('div', { class: 'scan-panel' }, [
    el('div', { class: 'scan-head' }, ['▦ SCAN · LOCATE / FILL / VERIFY', close]),
    el('div', { class: 'scan-row' }, [engine]),
    el('div', { class: 'scan-row' }, [...modeBtns, el('label', {}, ['FILL']), fieldSel]),
    el('div', { class: 'scan-row' }, [el('label', {}, ['CARD']), cardSel]),
    card,
    video,
    el('div', { class: 'scan-row' }, [camBtn, shootBtn, batchBtn, shoot, batch]),
    el('div', { class: 'scan-row' }, [typed]),
    log,
  ]);

  const say = (code: string, line: string, tone: Tone): void => {
    log.querySelector('.scan-empty')?.remove();
    const t = new Date().toLocaleTimeString();
    log.prepend(el('div', { class: `scan-evt ${tone}` }, [
      el('span', { class: 'scan-t' }, [t]), el('span', { class: 'scan-code' }, [code]), el('div', {}, [line])]));
  };
  const setActive = (e: NetEntry | null): void => {
    active = e;
    card.textContent = cardText(e);
    cardSel.value = e ? e.key : '';
  };
  const paintModes = (): void => modeBtns.forEach((b) => b.classList.toggle('on', b.dataset['mode'] === mode));
  const paintEngine = (): void => {
    const e = scanEngine();
    engine.textContent = ENGINE_TEXT[e];
    engine.classList.toggle('none', e === 'none');
    camBtn.disabled = e === 'none' && !camera;
  };
  async function refreshNetlist(): Promise<void> {
    entries = await loadNetlist();
    netlistStale = false;
    const keep = active?.key;
    cardSel.replaceChildren(el('option', { value: '' }, ['— pick a device card —']),
      ...entries.map((e) => el('option', { value: e.key }, [`${e.parent ? `${e.parent} · ` : ''}${e.name}`])));
    setActive(entries.find((e) => e.key === keep) ?? null);
  }

  async function handle(read: ScanRead): Promise<void> {
    if (!guard.admit(read.text, Date.now())) return;
    if (netlistStale) await refreshNetlist();
    const outcome = routeRead(mode, read.text, { entries, active, fillField: field });
    const done = await act(outcome);
    say(`${read.text} [${read.symbology}]`, done.line, done.tone);
    if (outcome.kind === 'located' && outcome.hits.length === 1) setActive(outcome.hits[0]!.entry);
    if (outcome.kind === 'fill' && done.tone === 'ok') { await refreshNetlist(); }
  }
  async function decodeFiles(files: FileList | null): Promise<void> {
    for (const f of Array.from(files ?? [])) {
      const reads = await decodeFrame(f);
      if (!reads.length) say(f.name, 'no QR / DataMatrix / Code 128 found in this photo', 'warn');
      for (const r of reads) await handle(r);
    }
  }

  modeBtns.forEach((b) => { b.onclick = (): void => { mode = b.dataset['mode'] as ScanMode; paintModes(); }; });
  fieldSel.onchange = (): void => { field = fieldSel.value as IdentityField; };
  cardSel.onchange = (): void => { setActive(entries.find((e) => e.key === cardSel.value) ?? null); };
  shootBtn.onclick = (): void => shoot.click();
  batchBtn.onclick = (): void => batch.click();
  shoot.onchange = (): void => { void decodeFiles(shoot.files).finally(() => { shoot.value = ''; }); };
  batch.onchange = (): void => { void decodeFiles(batch.files).finally(() => { batch.value = ''; }); };
  typed.onkeydown = (e): void => {
    if (e.key !== 'Enter' || !typed.value.trim()) return;
    void handle({ text: typed.value.trim(), symbology: 'other' });
    typed.value = '';
  };
  camBtn.onclick = async (): Promise<void> => {
    if (camera) { camera.stop(); camera = null; video.classList.remove('live'); camBtn.textContent = 'START CAMERA'; guard.clear(); return; }
    try {
      camera = await startCamera(video, (r) => { void handle(r); });
      video.classList.add('live'); camBtn.textContent = 'STOP CAMERA';
    } catch (err) {
      say('camera', `unavailable — ${String((err as Error).message ?? err)}; use PHOTO instead`, 'bad');
    }
  };
  const hide = (): void => { panel.classList.remove('open'); camera?.stop(); camera = null; video.classList.remove('live'); camBtn.textContent = 'START CAMERA'; };
  close.onclick = hide;
  launch.onclick = (): void => {
    if (panel.classList.toggle('open')) {
      paintModes(); paintEngine();
      void loadBundledDecoder().then(paintEngine, (e: unknown) => say('decoder', `bundled decoder failed to load — ${String(e)}`, 'bad'));
      void refreshNetlist();
    } else hide();
  };
  onDraftsChange(() => { netlistStale = true; });
  document.body.append(launch, panel);
}
