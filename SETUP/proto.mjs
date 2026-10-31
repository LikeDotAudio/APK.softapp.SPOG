// SETUP/proto.mjs — regenerate (or check) the protobufjs output from schema.proto.
//
//   npm run proto         rewrite src/platform/mqtt/schema.js + schema.d.ts
//   npm run proto:check   exit 1 when either file is not what schema.proto generates
//
// schema.js/.d.ts are generated code and committed (the app imports them; no
// build step runs pbjs). This script is the generator, and the check runs in
// `npm test` (src/platform/mqtt/schema.test.ts) so a proto edit without a
// regenerate fails before deploy.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dir = join(root, 'src/platform/mqtt');
const bin = (n) => join(root, 'node_modules/.bin', n);
const check = process.argv.includes('--check');

const tmp = mkdtempSync(join(tmpdir(), 'spog-proto-'));
try {
  const js = join(tmp, 'schema.js'), dts = join(tmp, 'schema.d.ts');
  execFileSync(bin('pbjs'), ['-t', 'static-module', '-w', 'es6', '-o', js, join(dir, 'schema.proto')], { stdio: 'inherit' });
  execFileSync(bin('pbts'), ['-o', dts, js], { stdio: 'inherit' });
  const stale = [];
  for (const [gen, name] of [[js, 'schema.js'], [dts, 'schema.d.ts']]) {
    const want = readFileSync(gen, 'utf8'), have = readFileSync(join(dir, name), 'utf8');
    if (want === have) continue;
    if (check) stale.push(name); else writeFileSync(join(dir, name), want);
  }
  if (check && stale.length) {
    console.error(`proto:check: ${stale.join(', ')} stale against schema.proto — run \`npm run proto\``);
    process.exit(1);
  }
  console.log(check ? 'proto:check: schema.js and schema.d.ts match schema.proto' : 'proto: regenerated');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
