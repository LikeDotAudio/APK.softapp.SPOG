// src/ui/ocr/ocr-view — one photo with the engine's word boxes drawn over it in
// SVG, a selected box, arrow-key movement by geometry (domain/ocr/box-nav) and
// an inline correction field (ROAD-3475).
//
// The SVG's viewBox is the photo's own pixel size, so a box sits exactly where
// the engine put it at any zoom. Colour says how sure the engine was (its own
// number), a dashed outline says the operator corrected it, and boxes a
// candidate was read from are marked while that candidate is hovered.

import { el } from '../dom.js';
import { getAdjacentBoxId, dirOfKey } from '../../domain/ocr/box-nav.js';
import { wordText, type OcrPage, type OcrWord } from '../../domain/ocr/ocr-page.js';

const SVG = 'http://www.w3.org/2000/svg';
/** Below this reported confidence a box is drawn as doubtful. */
export const DOUBT_BELOW = 70;

export interface OcrView {
  root: HTMLElement;
  show(url: string, page: OcrPage | null): void;
  select(id: string | null): void;
  mark(ids: readonly string[]): void;
  focus(): void;
}

export function createOcrView(onCorrect: (id: string, typed: string) => void): OcrView {
  const img = el('img', { class: 'ocr-img', alt: '' });
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'ocr-svg');
  const stage = el('div', { class: 'ocr-stage', tabIndex: 0, title: 'Arrow keys move between word boxes · Tab = reading order · Enter = correct' }, [img]);
  stage.append(svg);
  const word = el('span', { class: 'ocr-word-meta' }, ['no box selected']);
  const edit = el('input', { type: 'text', class: 'ocr-edit', placeholder: 'correct the selected box ⏎', disabled: true });
  const root = el('div', { class: 'ocr-view' }, [stage, el('div', { class: 'ocr-row' }, [word, edit])]);

  let page: OcrPage | null = null;
  let selected: string | null = null;
  const rects = new Map<string, SVGRectElement>();

  const describe = (w: OcrWord): string =>
    `${w.id} · engine read "${w.text}" at ${Math.round(w.confidence)}%${w.corrected ? ` · corrected to "${w.corrected}"` : ''}`;

  function draw(): void {
    svg.replaceChildren(); rects.clear();
    if (!page) return;
    svg.setAttribute('viewBox', `0 0 ${page.width} ${page.height}`);
    for (const w of page.words) {
      const r = document.createElementNS(SVG, 'rect');
      r.setAttribute('x', String(w.x0)); r.setAttribute('y', String(w.y0));
      r.setAttribute('width', String(Math.max(1, w.x1 - w.x0))); r.setAttribute('height', String(Math.max(1, w.y1 - w.y0)));
      r.setAttribute('class', `ocr-box${w.confidence < DOUBT_BELOW ? ' doubt' : ''}${w.corrected ? ' fixed' : ''}${w.id === selected ? ' sel' : ''}`);
      r.dataset['id'] = w.id;
      const t = document.createElementNS(SVG, 'title'); t.textContent = describe(w); r.append(t);
      r.addEventListener('click', () => { select(w.id); stage.focus(); });
      svg.append(r); rects.set(w.id, r);
    }
  }

  function select(id: string | null): void {
    selected = id && page?.words.some((w) => w.id === id) ? id : null;
    rects.forEach((r, k) => r.classList.toggle('sel', k === selected));
    const w = page?.words.find((x) => x.id === selected);
    word.textContent = w ? describe(w) : page?.words.length ? 'no box selected — click one or press an arrow key' : 'no box';
    edit.disabled = !w;
    edit.value = w ? wordText(w) : '';
  }

  stage.addEventListener('keydown', (e) => {
    if (!page) return;
    if (e.key === 'Enter' && selected) { e.preventDefault(); edit.focus(); edit.select(); return; }
    const dir = dirOfKey(e.key, e.shiftKey);
    if (!dir) return;
    e.preventDefault();
    select(getAdjacentBoxId(page.words, selected, dir));
    rects.get(selected ?? '')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  });
  edit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && selected) { e.preventDefault(); onCorrect(selected, edit.value); stage.focus(); }
    if (e.key === 'Escape') { e.preventDefault(); select(selected); stage.focus(); }
  });

  return {
    root,
    show(url, p) {
      if (img.src !== url) img.src = url;
      page = p;
      draw();
      select(selected);
    },
    select,
    mark(ids) { const s = new Set(ids); rects.forEach((r, k) => r.classList.toggle('hit', s.has(k))); },
    focus() { stage.focus(); },
  };
}
