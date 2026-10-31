// src/editors/native-title.test — no editor control hovers with a native `title`.
// Every hover in an editor rides the shared tool-tick layer (src/ui/tip.ts: hint() for a
// one-liner, tip() for the structured kind), which is styled, follows the pointer and also
// sets aria-label and answers focus + touch. A native title does none of that (ROAD-3450).
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const DIR = resolve(__dirname);
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') && !p.endsWith('.test.ts') ? [p] : [];
  });

/** A native hover: `x.title = …`, setAttribute('title', …), or a `title:` key in el()'s attrs. */
const NATIVE = [
  /\.title\s*=(?!=)/,
  /setAttribute\(\s*['"]title['"]/,
  /\bel\(\s*['"][\w-]+['"]\s*,\s*\{(?:[^{}]|\$\{[^}]*\})*?\btitle\s*:/,
];

describe('editors use the shared tooltip, not native title hovers (ROAD-3450)', () => {
  it('no src/editors file sets a native title', () => {
    const bad = files(DIR).flatMap((f) =>
      readFileSync(f, 'utf8').split('\n').flatMap((line, i) =>
        NATIVE.some((re) => re.test(line)) ? [`${relative(DIR, f)}:${i + 1}: ${line.trim()}`] : []));
    expect(bad).toEqual([]);
  });
});
