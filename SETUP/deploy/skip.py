"""Skip unchanged files on upload (ROAD-3481).

The server keeps a manifest of what this deploy last put there, at
/.deploy-manifest.json: {"version": 1, "files": {remote_rel: {"sha256", "size"}}}.
A file whose local SHA-256 equals the manifest's is not uploaded again, unless
the server's own listing (MLSD, when the server has it) shows it missing or a
different size. That is what keeps the ~11.5 MB self-hosted OCR engine (dist/ocr/,
versioned paths, ROAD-3475) and every unchanged hashed asset off the wire.

The manifest lives on the SERVER, not in the checkout, because CI deploys from a
fresh clone. It is a dot-file, so remote_list / fresh_sweep never treat it as dead.

Crash safety: before the first upload, the manifest is rewritten WITHOUT the
entries about to change; the full manifest is written only after every upload
finished. So a deploy that dies half way can make the next one upload too much,
never too little.
"""

import ftplib
import hashlib
import io
import json
import os

REMOTE_MANIFEST = '.deploy-manifest.json'
VERSION = 1


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()


def describe(pairs, hasher=sha256_file):
    """{remote_rel: {"sha256", "size", "local"}} for [(local_abs, remote_rel)]."""
    return {remote: {'sha256': hasher(local), 'size': os.path.getsize(local), 'local': local}
            for local, remote in pairs}


def parse_manifest(raw):
    """The files map of a manifest, or {} for anything unreadable / another version."""
    try:
        doc = json.loads(raw)
    except (ValueError, TypeError):
        return {}
    if not isinstance(doc, dict) or doc.get('version') != VERSION or not isinstance(doc.get('files'), dict):
        return {}
    return {k: v for k, v in doc['files'].items()
            if isinstance(v, dict) and isinstance(v.get('sha256'), str) and isinstance(v.get('size'), int)}


def render_manifest(files):
    body = {k: {'sha256': v['sha256'], 'size': v['size']} for k, v in sorted(files.items())}
    return json.dumps({'version': VERSION, 'files': body}, indent=0, sort_keys=True).encode()


def plan(local, manifest, remote_sizes=None, force=False):
    """Split `local` (from describe) into (upload, skip) lists of remote paths.

    remote_sizes: {remote_rel: size} from the server's listing for the directories
    involved, or None when the server cannot list sizes (then the manifest alone
    decides)."""
    upload, skip = [], []
    for remote, d in sorted(local.items()):
        m = manifest.get(remote)
        same = (not force and m is not None and m['sha256'] == d['sha256'] and m['size'] == d['size'])
        if same and remote_sizes is not None and remote_sizes.get(remote) != d['size']:
            same = False      # gone from the server, or truncated, whatever the manifest says
        (skip if same else upload).append(remote)
    return upload, skip


def read_remote_manifest(ftp):
    buf = io.BytesIO()
    try:
        ftp.cwd('/')
        ftp.retrbinary(f'RETR {REMOTE_MANIFEST}', buf.write)
    except (ftplib.error_perm, ftplib.error_temp, EOFError, OSError):
        return {}
    return parse_manifest(buf.getvalue().decode('utf-8', 'replace'))


def write_remote_manifest(ftp, files):
    ftp.cwd('/')
    ftp.storbinary(f'STOR {REMOTE_MANIFEST}', io.BytesIO(render_manifest(files)))


def remote_sizes(ftp, remotes):
    """{remote_rel: size} for files present in the directories of `remotes`, via
    MLSD; None if the server does not support it (one listing per directory)."""
    dirs = sorted({r.rsplit('/', 1)[0] if '/' in r else '' for r in remotes})
    out = {}
    for d in dirs:
        try:
            for name, facts in ftp.mlsd(d, facts=['type', 'size']):
                if facts.get('type') == 'file' and 'size' in facts:
                    out[f'{d}/{name}' if d else name] = int(facts['size'])
        except ftplib.error_perm as e:
            if str(e)[:3] in ('500', '502'):
                return None   # MLSD not understood / not implemented on this server
            continue          # 550 (501 on pyftpdlib): the directory is not there yet, nothing to skip
        except (AttributeError, ValueError):
            return None
    return out


def next_manifest(manifest, local, forget=(), stale_prefixes=(), mirror=False):
    """The manifest after a deploy: what was there, minus what this deploy removes
    (`forget`, and anything under `stale_prefixes` it no longer ships — the pruned
    hashed bundles), plus every file it shipped. `mirror` (--fresh): exactly `local`."""
    if mirror:
        kept = {}
    else:
        gone = set(forget)
        kept = {k: v for k, v in manifest.items()
                if k not in gone and not (k not in local and k.startswith(tuple(stale_prefixes)))}
    kept.update({r: {'sha256': d['sha256'], 'size': d['size']} for r, d in local.items()})
    return kept


def sync(ftp, pairs, upload_file, force=False, forget=(), stale_prefixes=(), mirror=False):
    """Upload the changed files of [(local_abs, remote_rel)] in the given order,
    skipping unchanged ones (all of them with force). Returns (uploaded, skipped)."""
    local = describe(pairs)
    manifest = read_remote_manifest(ftp)
    sizes = None if force else remote_sizes(ftp, list(local))
    upload, skip = plan(local, manifest, sizes, force)
    todo = set(upload)
    print(f"{len(upload)} file(s) to upload, {len(skip)} unchanged on the server "
          f"({sum(local[r]['size'] for r in skip) / 1e6:.1f} MB not re-sent).")
    if todo & manifest.keys():
        write_remote_manifest(ftp, {k: v for k, v in manifest.items() if k not in todo})
    done = []
    for local_path, remote in pairs:
        if remote in todo:
            upload_file(ftp, local_path, remote)
            done.append(remote)
    write_remote_manifest(ftp, next_manifest(manifest, local, forget, stale_prefixes, mirror))
    return done, skip


def prune(ftp, root, keep, remote_list):
    """Delete files directly or deeply under /<root> that are not in `keep`
    (remote-relative paths) — the stale hashed bundles, AFTER the new ones landed."""
    removed = 0

    def walk(path):
        nonlocal removed
        for name, is_dir in remote_list(ftp, path):
            rel = f'{path}/{name}'
            if is_dir:
                walk(rel)
            elif rel not in keep:
                try:
                    ftp.cwd('/')
                    ftp.delete(rel)
                    print(f'  ✗ {rel}')
                    removed += 1
                except ftplib.error_perm as e:
                    print(f'  could not delete {rel}: {e}')
    walk(root)
    return removed
