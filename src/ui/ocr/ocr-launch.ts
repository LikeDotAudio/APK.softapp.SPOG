// src/ui/ocr/ocr-launch — the ⌕ OCR button in the seat MENU (ROAD-3475). The only
// OCR code in the console's main bundle: the panel, the zip reader and the engine
// arrive by dynamic import on the first click, and the Tesseract worker, core and
// language data only when the first photo is read.

import { el, addStyles } from '../dom.js';
import { PAL } from '../../domain/palette.js';

const LAUNCH_CSS = `
/* Fallback seat if the launcher is not adopted into the seat MENU (dev/tests). */
.ocr-launch{position:fixed;left:12px;bottom:164px;z-index:60;font:800 12px 'Courier New',monospace;letter-spacing:1px;
  padding:7px 12px;border-radius:14px;background:${PAL.blue19};color:${PAL.sky84};border:1px solid ${PAL.blue23s39};cursor:pointer;}`;

export function initOcrPanel(): void {
  addStyles('ocr-launch-styles', LAUNCH_CSS);
  if (document.querySelector('.ocr-launch')) return;
  const launch = el('button', { class: 'ocr-launch', title: 'OCR photos of labels and rating plates → serial / asset tag / MAC on a device card' }, ['⌕ OCR']);
  launch.onclick = (): void => {
    launch.disabled = true;
    void import('./ocr-panel.js')
      .then((m) => m.toggleOcrPanel(), (e: unknown) => { console.error('OCR panel failed to load', e); })
      .finally(() => { launch.disabled = false; });
  };
  document.body.append(launch);
}
