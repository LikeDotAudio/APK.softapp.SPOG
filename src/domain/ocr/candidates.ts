// src/domain/ocr/candidates — the identity values a page of OCR text offers
// (ROAD-3475). Pure.
//
// A candidate is a value the TEXT carries, found by shape (ocr-shapes.json —
// patterns, never device lists): a serial after "S/N:", an asset tag after
// "ASSET TAG:", a MAC by its own form. Each keeps the word boxes it was read
// from, so the overlay can show where it came from, and whether a printed label
// named it (`labelled`) or only its shape did. Nothing is offered that the page
// does not say, and a page that says nothing offers nothing.

import { normCode, type IdentityField } from '../scan/netlist.js';
import { pageLines, type OcrPage } from './ocr-page.js';
import SHAPES_JSON from './ocr-shapes.json';

export interface ShapeSpec { labels: string[]; value: string; shapes: string[] }
export type Shapes = Record<IdentityField, ShapeSpec>;
export const DEFAULT_SHAPES: Shapes = { mac: SHAPES_JSON.mac, serial: SHAPES_JSON.serial, asset_tag: SHAPES_JSON.asset_tag };

export interface Candidate {
  kind: IdentityField;
  value: string;
  /** A printed field label named it; false = recognised by shape only. */
  labelled: boolean;
  /** The word boxes it was read from. */
  wordIds: string[];
}

/** A MAC in one spelling: six colon-separated upper-case pairs. null when the
 *  text does not hold exactly twelve hex digits. */
export function canonicalMac(s: string): string | null {
  const hex = s.toUpperCase().replace(/[^0-9A-F]/g, '');
  return hex.length === 12 && /^[0-9A-F]{12}$/.test(hex) ? hex.match(/../g)!.join(':') : null;
}

interface Compiled { kind: IdentityField; labelled: boolean; re: RegExp; group: number }

/** One regex per label set (value in group 1) and one per bare shape (group 0).
 *  A label must be followed by a separator — `SER` never reads `SERVICE`. */
export function compileShapes(shapes: Shapes): Compiled[] {
  const out: Compiled[] = [];
  for (const kind of Object.keys(shapes) as IdentityField[]) {
    const s = shapes[kind];
    if (s.labels.length) {
      out.push({ kind, labelled: true, group: 1,
        re: new RegExp(`(?<![A-Z0-9])(?:${s.labels.join('|')})(?:\\s*[:#=]\\s*|\\s+)(${s.value})(?![A-Z0-9])`, 'gi') });
    }
    for (const shape of s.shapes) out.push({ kind, labelled: false, group: 0, re: new RegExp(`(?<![A-Z0-9])(?:${shape})(?![A-Z0-9])`, 'gi') });
  }
  return out;
}

const clean = (kind: IdentityField, raw: string): string | null =>
  kind === 'mac' ? canonicalMac(raw) : raw.trim().replace(/[.\-/]+$/, '') || null;

/** Every candidate on the page, labelled ones first, one per kind+value. */
export function extractCandidates(page: OcrPage, shapes: Shapes = DEFAULT_SHAPES): Candidate[] {
  const compiled = compileShapes(shapes);
  const found = new Map<string, Candidate>();
  for (const line of pageLines(page)) {
    for (const c of compiled) {
      c.re.lastIndex = 0;
      for (let m = c.re.exec(line.text); m; m = c.re.exec(line.text)) {
        const raw = m[c.group];
        if (!raw) continue;
        const value = clean(c.kind, raw);
        if (!value) continue;
        const start = m.index + m[0].lastIndexOf(raw), end = start + raw.length;
        const wordIds = line.spans.filter((s) => s.start < end && s.end > start).map((s) => s.id);
        const key = `${c.kind}|${normCode(value)}`;
        const had = found.get(key);
        if (had) { had.labelled ||= c.labelled; had.wordIds = [...new Set([...had.wordIds, ...wordIds])]; }
        else found.set(key, { kind: c.kind, value, labelled: c.labelled, wordIds });
      }
    }
  }
  // A labelled serial or asset value that is also a MAC is the MAC (a label like "ID: 00:1D:…").
  const macs = new Set([...found.values()].filter((c) => c.kind === 'mac').map((c) => normCode(c.value)));
  return [...found.values()]
    .filter((c) => c.kind === 'mac' || !macs.has(normCode(c.value)))
    .sort((a, b) => Number(b.labelled) - Number(a.labelled));
}
