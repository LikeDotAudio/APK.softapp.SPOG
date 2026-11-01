// src/ui/ocr/ocr-candidates — the identity values the selected photo offers,
// each with "+ ATTACH", and "ADD ALL" (ROAD-3475). Hovering a value marks the
// word boxes it was read from; the write goes through ocr-attach (SCAN's Fill).

import { el } from '../dom.js';
import type { Candidate } from '../../domain/ocr/candidates.js';
import type { NetEntry } from '../../domain/scan/netlist.js';
import type { Tone } from '../scan/scan-act.js';
import { attachAll, attachOne } from './ocr-attach.js';

const KIND: Record<Candidate['kind'], string> = { serial: 'SERIAL', asset_tag: 'ASSET TAG', mac: 'MAC' };

export interface CandidateHooks {
  hover(wordIds: readonly string[]): void;
  done(line: string, tone: Tone): void;
}

export function renderCandidates(host: HTMLElement, cands: readonly Candidate[], target: NetEntry | null, hooks: CandidateHooks): void {
  const who = target ? `${target.parent ? `${target.parent} · ` : ''}${target.name}` : null;
  if (!cands.length) {
    host.replaceChildren(el('div', { class: 'ocr-empty' }, ['No serial, asset tag or MAC in the text read from this photo.']));
    return;
  }
  const busy = (b: HTMLButtonElement, run: () => Promise<void>): void => {
    b.disabled = true;
    void run().catch((e: unknown) => hooks.done(`ATTACH failed — ${String(e)}`, 'bad')).finally(() => { b.disabled = false; });
  };
  const all = el('button', { class: 'ocr-all', title: who ? `Write every labelled value to ${who}` : 'Pick a device card first' }, ['ADD ALL']);
  all.onclick = (): void => busy(all, async () => {
    for (const r of await attachAll(cands, target?.key ?? null)) hooks.done(`${KIND[r.candidate.kind]} ${r.candidate.value}: ${r.acted.line}`, r.acted.tone);
  });
  const rows = cands.map((c) => {
    const add = el('button', { title: who ? `Write ${c.value} as ${who}'s ${KIND[c.kind].toLowerCase()}` : 'Pick a device card first' }, ['+ ATTACH']);
    add.onclick = (): void => busy(add, async () => {
      const r = await attachOne(c, target?.key ?? null);
      hooks.done(`${KIND[c.kind]} ${c.value}: ${r.acted.line}`, r.acted.tone);
    });
    const row = el('div', { class: `ocr-cand${c.labelled ? '' : ' shape'}` }, [
      el('span', { class: 'ocr-kind' }, [KIND[c.kind]]),
      el('span', { class: 'ocr-val' }, [c.value]),
      el('span', { class: 'ocr-how' }, [c.labelled ? 'labelled' : 'shape only']),
      add,
    ]);
    row.onmouseenter = (): void => hooks.hover(c.wordIds);
    row.onmouseleave = (): void => hooks.hover([]);
    return row;
  });
  host.replaceChildren(el('div', { class: 'ocr-row' }, [all, el('span', { class: 'ocr-to' }, [who ? `→ ${who}` : 'no device card picked'])]), ...rows);
}
