// src/ui/ocr/ocr-panel — the OCR importer (ROAD-3475): photos (many at once) or
// a .zip of them → the self-hosted Tesseract engine → word boxes over the photo
// → serial / asset tag / MAC candidates → "+ ATTACH" / "ADD ALL" onto a device
// card through the SCAN panel's Fill path; EXPORT FROM PROJECT writes the
// recorded identity back out as QR labels.
//
// Reached only by dynamic import from ocr-launch.ts, so neither this nor the
// engine is in the console's main bundle. Every photo says what happened to it:
// read (n words), read but no text, or failed and why — an engine that did not
// start is never reported as "no text".

import { el, addStyles } from '../dom.js';
import { correctWord, type OcrPage } from '../../domain/ocr/ocr-page.js';
import { extractCandidates } from '../../domain/ocr/candidates.js';
import type { NetEntry } from '../../domain/scan/netlist.js';
import { recognizeShared, engineWarm, TESSERACT_VERSION } from '../../platform/ocr/ocr-engine.js';
import { readZipImages } from '../../platform/ocr/zip-import.js';
import { sniffImage } from '../../domain/ocr/archive-rules.js';
import { loadNetlist } from '../../platform/scan/netlist-load.js';
import { onDraftsChange } from '../../platform/routes-store.js';
import type { Tone } from '../scan/scan-act.js';
import { createOcrView } from './ocr-view.js';
import { renderCandidates } from './ocr-candidates.js';
import { exportQrSheet } from './ocr-export.js';
import { OCR_CSS } from './ocr-styles.js';

interface Photo { name: string; file: File; url: string; page: OcrPage | null; state: 'queued' | 'reading' | 'read' | 'failed'; why?: string }

let panel: HTMLElement | null = null;

export function toggleOcrPanel(): void {
  if (!panel) panel = buildPanel();
  panel.classList.toggle('open');
}

function buildPanel(): HTMLElement {
  addStyles('ocr-styles', OCR_CSS);
  const photos: Photo[] = [];
  let cur = -1;
  let entries: NetEntry[] = [];
  let targetKey: string | null = null;
  let running = false;

  const engine = el('span', { class: 'ocr-engine' }, [`engine · Tesseract.js ${TESSERACT_VERSION} (self-hosted, loads on the first photo)`]);
  const pick = el('input', { type: 'file', accept: 'image/*', multiple: true, class: 'ocr-file' });
  const pickZip = el('input', { type: 'file', accept: '.zip,application/zip', class: 'ocr-file' });
  const btn = (t: string, title: string): HTMLButtonElement => el('button', { title }, [t]);
  const photosBtn = btn('IMPORT PHOTOS', 'One or many photos — read in this browser, never uploaded');
  const zipBtn = btn('IMPORT .ZIP', 'A .zip of photos — opened in memory: images only, size and count limited, no path escapes');
  const exportBtn = btn('EXPORT FROM PROJECT', 'Every recorded serial / asset tag / MAC as a printable sheet of QR labels');
  const clearBtn = btn('CLEAR', 'Forget the imported photos');
  const cardSel = el('select', { title: 'The device card + ATTACH and ADD ALL write to' });
  const strip = el('div', { class: 'ocr-strip' });
  const cands = el('div', { class: 'ocr-cands' });
  const log = el('div', { class: 'ocr-log' });
  const close = el('span', { class: 'ocr-x', title: 'close' }, ['✕']);
  const view = createOcrView((id, typed) => {
    const p = photos[cur];
    if (!p?.page) return;
    p.page = correctWord(p.page, id, typed);
    paint();
  });
  const root = el('div', { class: 'ocr-panel' }, [
    el('div', { class: 'ocr-head' }, ['⌕ OCR · PHOTOS → SERIAL / ASSET TAG / MAC', close]),
    el('div', { class: 'ocr-row' }, [engine]),
    el('div', { class: 'ocr-row' }, [photosBtn, zipBtn, exportBtn, clearBtn, pick, pickZip]),
    el('div', { class: 'ocr-row' }, [el('label', {}, ['CARD']), cardSel]),
    strip, view.root, cands, log,
  ]);

  const say = (line: string, tone: Tone): void => {
    log.prepend(el('div', { class: `ocr-evt ${tone}` }, [el('span', { class: 'ocr-t' }, [new Date().toLocaleTimeString()]), line]));
  };

  function paint(): void {
    strip.replaceChildren(...photos.map((p, i) => {
      const n = p.page?.words.length ?? 0;
      const status = p.state === 'read' ? (n ? `${n} words` : 'no text read') : p.state === 'failed' ? `failed — ${p.why}` : p.state;
      const b = el('button', { class: `ocr-chip ${p.state}${i === cur ? ' on' : ''}`, title: p.name }, [`${p.name.split('/').pop()} · ${status}`]);
      b.onclick = (): void => { cur = i; paint(); view.focus(); };
      return b;
    }));
    const p = photos[cur];
    view.show(p?.url ?? '', p?.page ?? null);
    const target = entries.find((e) => e.key === targetKey) ?? null;
    renderCandidates(cands, p?.page ? extractCandidates(p.page) : [], target, {
      hover: (ids) => view.mark(ids),
      done: (line, tone) => { say(line, tone); void refreshNetlist(); },
    });
  }

  async function refreshNetlist(): Promise<void> {
    entries = await loadNetlist();
    cardSel.replaceChildren(el('option', { value: '' }, ['— pick the device card to attach to —']),
      ...entries.map((e) => el('option', { value: e.key }, [`${e.parent ? `${e.parent} · ` : ''}${e.name}${e.live ? ' (discovered)' : ''}`])));
    cardSel.value = entries.some((e) => e.key === targetKey) ? targetKey! : '';
    paint();
  }

  async function readQueue(): Promise<void> {
    if (running) return;
    running = true;
    try {
      for (const p of photos) {
        if (p.state !== 'queued') continue;
        p.state = 'reading'; paint();
        try {
          const bmp = await createImageBitmap(p.file).catch(() => { throw new Error('the browser could not decode this image'); });
          const { width, height } = bmp; bmp.close();
          p.page = await recognizeShared(p.file, width, height, document.baseURI);
          p.state = 'read';
          engine.textContent = `engine · Tesseract.js ${TESSERACT_VERSION} (self-hosted) · ${engineWarm() ? 'running' : 'idle'}`;
          say(`${p.name}: ${p.page.words.length ? `${p.page.words.length} words read` : 'the engine read no text in this photo'}`, p.page.words.length ? 'ok' : 'warn');
        } catch (err) {
          p.state = 'failed'; p.why = String((err as Error).message ?? err);
          say(`${p.name}: OCR failed — ${p.why}`, 'bad');
        }
        if (cur < 0) cur = photos.indexOf(p);
        paint();
      }
    } finally { running = false; }
  }

  function add(files: readonly File[]): void {
    for (const f of files) photos.push({ name: f.name, file: f, url: URL.createObjectURL(f), page: null, state: 'queued' });
    if (cur < 0 && photos.length) cur = 0;
    paint();
    void readQueue();
  }

  photosBtn.onclick = (): void => pick.click();
  zipBtn.onclick = (): void => pickZip.click();
  pick.onchange = async (): Promise<void> => {
    const ok: File[] = [];
    for (const f of Array.from(pick.files ?? [])) {
      if (sniffImage(new Uint8Array(await f.slice(0, 16).arrayBuffer()))) ok.push(f);
      else say(`${f.name}: not read — the file is not a PNG, JPEG, GIF, WebP or BMP image`, 'warn');
    }
    pick.value = '';
    add(ok);
  };
  pickZip.onchange = async (): Promise<void> => {
    const f = pickZip.files?.[0];
    pickZip.value = '';
    if (!f) return;
    try {
      const { images, rejected } = await readZipImages(f);
      say(`${f.name}: ${images.length} image${images.length === 1 ? '' : 's'} taken${rejected.length ? `, ${rejected.length} refused` : ''}`, rejected.length ? 'warn' : 'ok');
      for (const r of rejected) say(`${f.name} › ${r.name}: refused — ${r.reason}`, 'warn');
      add(images);
    } catch (err) { say(`${f.name}: archive refused — ${String((err as Error).message ?? err)}`, 'bad'); }
  };
  exportBtn.onclick = (): void => { void exportQrSheet().then((r) => say(r.line, r.tone), (e: unknown) => say(`EXPORT failed — ${String(e)}`, 'bad')); };
  clearBtn.onclick = (): void => { photos.splice(0).forEach((p) => URL.revokeObjectURL(p.url)); cur = -1; paint(); };
  cardSel.onchange = (): void => { targetKey = cardSel.value || null; paint(); };
  close.onclick = (): void => root.classList.remove('open');
  onDraftsChange(() => { if (root.classList.contains('open')) void refreshNetlist(); });

  document.body.append(root);
  void refreshNetlist();
  return root;
}
