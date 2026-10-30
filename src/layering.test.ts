// src/layering.test — holds the src/README.md layering rules to the import graph:
// domain/ imports no ui/platform/editors/app, and editors never import editors.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';

const SRC = resolve(__dirname);
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
/** Every relative import/glob target of a file, as a src-relative path. */
const targets = (file: string): string[] =>
  [...readFileSync(file, 'utf8').matchAll(/(?:from|import|glob(?:<[^>]*>)?\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)]
    .map((m) => relative(SRC, resolve(dirname(file), m[1]!)));
const rel = (f: string): string => relative(SRC, f);

describe('layering (src/README.md)', () => {
  it('domain/ imports nothing from ui, platform, editors or app', () => {
    const bad = files(join(SRC, 'domain')).flatMap((f) =>
      targets(f).filter((t) => /^(ui|platform|editors|app)\//.test(t)).map((t) => `${rel(f)} → ${t}`));
    expect(bad).toEqual([]);
  });
  it('editors never import editors', () => {
    // editors/registry.ts + types.ts sit above the packages (the registry globs them all).
    const pkgFiles = files(join(SRC, 'editors')).filter((f) => rel(f).split('/').length > 2);
    const bad = pkgFiles.flatMap((f) => {
      const own = rel(f).split('/')[1];
      return targets(f)
        .filter((t) => t.startsWith('editors/') && t.split('/').length > 2 && t.split('/')[1] !== own)
        .map((t) => `${rel(f)} → ${t}`);
    });
    expect(bad).toEqual([]);
  });
});
