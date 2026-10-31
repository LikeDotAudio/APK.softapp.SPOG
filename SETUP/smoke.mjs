// SETUP/smoke.mjs — `npm run smoke [-- <base-url> ...]`: is THIS commit what a site serves?
//
// For each base URL (default: https://spog.like.audio/, or SPOG_SMOKE_URLS, comma-separated):
//   entry     <base>index.htm answers 200 with HTML
//   build-id  <base>build-id.json names HEAD's short sha, without "(uncommitted)"
//
// The APK.audio image serves the same tree at <origin>/APK:SPOG/ — pass that URL
// to check it (e.g. `npm run smoke -- http://localhost:8080/APK:SPOG/`).
// Exit 1 when any check fails; one line per check either way.
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const bases = (args.length ? args : (process.env.SPOG_SMOKE_URLS || 'https://spog.like.audio/').split(','))
  .map((u) => u.trim()).filter(Boolean).map((u) => (u.endsWith('/') ? u : `${u}/`));
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();

let failed = 0;
const report = (ok, base, check, detail) => { if (!ok) failed += 1; console.log(`${ok ? 'PASS' : 'FAIL'}  ${check.padEnd(8)} ${base}  ${detail}`); };

for (const base of bases) {
  try {
    const r = await fetch(new URL('index.htm', base), { redirect: 'follow' });
    const html = r.ok ? await r.text() : '';
    report(r.ok && /<html/i.test(html), base, 'entry', `HTTP ${r.status}`);
  } catch (e) { report(false, base, 'entry', String(e.cause?.code || e.message)); }
  try {
    const r = await fetch(new URL(`build-id.json?t=${Date.now()}`, base));
    const id = r.ok ? await r.json() : {};
    const full = String(id.full || '');
    const sha = (full.match(/git ([0-9a-f]{7,})/) || [])[1] || '';
    const ok = !!sha && (head.startsWith(sha) || sha.startsWith(head)) && !full.includes('uncommitted');
    report(ok, base, 'build-id', ok ? `serves ${sha} = HEAD` : `serves "${full || `HTTP ${r.status}`}", HEAD is ${head}`);
  } catch (e) { report(false, base, 'build-id', String(e.cause?.code || e.message)); }
}
process.exit(failed ? 1 : 0);
