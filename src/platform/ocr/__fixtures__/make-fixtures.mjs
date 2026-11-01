#!/usr/bin/env node
// src/platform/ocr/__fixtures__/make-fixtures.mjs — writes the rack-label photo the
// OCR tests read (ROAD-3475). Run once from the WEB.SPOG root:
//
//   node src/platform/ocr/__fixtures__/make-fixtures.mjs
//
// Rendered with ImageMagick (`convert`, a system tool — not a package dependency)
// in DejaVu Sans Mono Bold: grey paper, ink that is not black, sensor noise, a
// 1.2° tilt on a dark rack background, greyscale. The label carries one serial,
// one MAC and one asset tag behind printed field names, plus a model number and
// a rating line that are NOT identity — the extractor must leave those alone.
// FIXTURES.json records what is printed, so a test compares against the label,
// never against whatever the engine happened to read.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LINES = [
  { size: 30, y: 80, text: 'RACK B  U12   DSP-8800' },
  { size: 36, y: 160, text: 'S/N: KX7R-24918' },
  { size: 36, y: 240, text: 'MAC: 00:1D:C1:4A:7F:22' },
  { size: 36, y: 320, text: 'ASSET TAG: AT-004512' },
  { size: 24, y: 395, text: 'Made in Canada  48V  2.5A' },
];
const args = ['-size', '900x440', 'xc:#d9d6cf', '-font', 'DejaVu-Sans-Mono-Bold', '-fill', '#2a2a2e'];
for (const l of LINES) args.push('-pointsize', String(l.size), '-annotate', `+50+${l.y}`, l.text);
args.push('-seed', '3475', '-attenuate', '0.3', '+noise', 'Gaussian', '-background', '#5a5a60', '-rotate', '1.2',
  '-colorspace', 'Gray', '-depth', '8', '-strip', join(HERE, 'rack-label.png'));
execFileSync('convert', args);

writeFileSync(join(HERE, 'FIXTURES.json'), JSON.stringify({
  'rack-label.png': {
    printed: LINES.map((l) => l.text),
    identity: { serial: 'KX7R-24918', mac: '00:1D:C1:4A:7F:22', asset_tag: 'AT-004512' },
  },
}, null, 2) + '\n');
console.log('wrote rack-label.png, FIXTURES.json');
