// SETUP/build-image.mjs — `npm run build:image`: SPOG's ONE build entry for any
// host that serves the console as a folder of static files (the APK.audio
// web-static image serves it at /APK:SPOG; spog.like.audio gets the same tree
// from SETUP/deploy.py).
//
// THE CONTRACT (what a consumer may rely on — nothing else):
//   input   this repo's tracked files after `npm ci` (no dist/, no node_modules
//           from the host checkout needed)
//   gates   typecheck, unit tests (incl. proto:check), the file-size gate
//   output  dist/                 the whole served tree, mount it anywhere:
//             index.htm           the console entry (= built index.next.html)
//             index.next.html     the same entry under its dev name
//             twist-mqtt-tree.html  the MQTT diagnostic tree
//             assets/**           content-hashed bundle
//             Routes/**           the data tree + regenerated index.json manifests
//             build-id.json, sw.js, spog-config.js, manifest.json, favicon.svg
//   exit    non-zero when any gate fails or the output is incomplete
//
// So a consumer copies the repo (minus node_modules/dist), runs
// `npm ci && npm run build:image`, and takes dist/. Which files the build reads
// is SPOG's business: renaming one changes this script, not the consumer.
import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skipGates = process.argv.includes('--no-gates');      // a deliberate escape hatch for local experiments
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

run(process.execPath, ['SETUP/generate-manifests.mjs']);
if (!skipGates) {
  run(npm, ['run', '--silent', 'typecheck']);
  run(npm, ['test', '--silent']);
}
run(npm, ['run', '--silent', 'build']);                      // prebuild = the file-size gate

const dist = join(root, 'dist');
copyFileSync(join(dist, 'index.next.html'), join(dist, 'index.htm'));
cpSync(join(root, 'Routes'), join(dist, 'Routes'), { recursive: true });

const must = ['index.htm', 'index.next.html', 'build-id.json', 'sw.js', 'spog-config.js', 'Routes/index.json'];
const missing = must.filter((f) => !existsSync(join(dist, f)) || statSync(join(dist, f)).size === 0);
if (missing.length) {
  console.error(`build:image: dist/ is missing ${missing.join(', ')}`);
  process.exit(1);
}
console.log('build:image: dist/ is ready to serve');
