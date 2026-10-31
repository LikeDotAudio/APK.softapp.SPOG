// src/platform/mqtt/schema.test — the committed protobufjs output is what
// schema.proto generates today (SETUP/proto.mjs; `npm run proto` regenerates).
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

describe('schema.js / schema.d.ts', () => {
  it('match schema.proto', () => {
    expect(() => execFileSync(process.execPath, ['SETUP/proto.mjs', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
