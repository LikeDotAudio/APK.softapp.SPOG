"""The deploy skips files the server already holds byte-for-byte (ROAD-3481), so
the ~11.5 MB self-hosted OCR engine is not re-sent on every deploy — and a file
the server lost, or one a crashed deploy left half-changed, is still sent.

Run: npm run test:deploy   (python3 -m unittest discover -s SETUP -p 'test_*.py')
"""

import ftplib
import io
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from deploy import skip  # noqa: E402


class FakeFTP:
    """Enough of ftplib.FTP_TLS for skip.py: a flat {path: bytes} server with MLSD."""

    def __init__(self, files=None, mlsd=True, missing_dir='550 no such directory'):
        self.files = dict(files or {})
        self.has_mlsd = mlsd
        self.missing_dir = missing_dir
        self.stored = []

    def cwd(self, _path):
        pass

    def retrbinary(self, cmd, cb):
        name = cmd.split(' ', 1)[1]
        if name not in self.files:
            raise ftplib.error_perm('550 no such file')
        cb(self.files[name])

    def storbinary(self, cmd, f):
        name = cmd.split(' ', 1)[1]
        self.files[name] = f.read()
        self.stored.append(name)

    def mlsd(self, path='', facts=None):
        if not self.has_mlsd:
            raise ftplib.error_perm('500 MLSD not understood')
        prefix = f'{path}/' if path else ''
        hits = [(k[len(prefix):], {'type': 'file', 'size': str(len(v))})
                for k, v in self.files.items() if k.startswith(prefix) and '/' not in k[len(prefix):]]
        if path and not hits:
            raise ftplib.error_perm(self.missing_dir)
        return iter(hits)


def upload(ftp, local, remote):
    with open(local, 'rb') as f:
        ftp.files[remote] = f.read()
    ftp.stored.append(remote)


class Skip(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.pairs = []
        for rel, body in (('ocr/eng.traineddata.gz', b'E' * 4000), ('assets/main-abc.js', b'js1'),
                          ('index.htm', b'<html>1')):
            p = os.path.join(self.dir.name, rel.replace('/', '_'))
            with open(p, 'wb') as f:
                f.write(body)
            self.pairs.append((p, rel))

    def write(self, rel, body):
        p = next(lp for lp, r in self.pairs if r == rel)
        with open(p, 'wb') as f:
            f.write(body)

    def test_first_deploy_uploads_everything_and_leaves_a_manifest(self):
        ftp = FakeFTP()
        done, skipped = skip.sync(ftp, self.pairs, upload)
        self.assertEqual(done, ['ocr/eng.traineddata.gz', 'assets/main-abc.js', 'index.htm'])
        self.assertEqual(skipped, [])
        manifest = skip.parse_manifest(ftp.files[skip.REMOTE_MANIFEST].decode())
        self.assertEqual(set(manifest), {'ocr/eng.traineddata.gz', 'assets/main-abc.js', 'index.htm'})
        self.assertEqual(manifest['index.htm']['size'], 7)

    def test_second_deploy_sends_only_what_changed(self):
        ftp = FakeFTP()
        skip.sync(ftp, self.pairs, upload)
        ftp.stored.clear()
        self.write('index.htm', b'<html>2')
        done, skipped = skip.sync(ftp, self.pairs, upload)
        self.assertEqual(done, ['index.htm'])
        self.assertEqual(sorted(skipped), ['assets/main-abc.js', 'ocr/eng.traineddata.gz'])
        self.assertNotIn('ocr/eng.traineddata.gz', ftp.stored)

    def test_a_file_the_server_lost_or_truncated_is_sent_again(self):
        ftp = FakeFTP()
        skip.sync(ftp, self.pairs, upload)
        del ftp.files['assets/main-abc.js']
        ftp.files['ocr/eng.traineddata.gz'] = b'E' * 10
        done, _ = skip.sync(ftp, self.pairs, upload)
        self.assertEqual(sorted(done), ['assets/main-abc.js', 'ocr/eng.traineddata.gz'])

    def test_without_mlsd_the_manifest_alone_decides(self):
        ftp = FakeFTP(mlsd=False)
        skip.sync(ftp, self.pairs, upload)
        done, skipped = skip.sync(ftp, self.pairs, upload)
        self.assertEqual(done, [])
        self.assertEqual(len(skipped), 3)

    def test_a_new_directory_does_not_switch_the_size_check_off(self):
        # pyftpdlib answers MLSD of a missing directory with 501, not 550; only
        # 500/502 mean "no MLSD here", so the truncated file is still re-sent.
        for reply in ('550 no such directory', '501 No such file or directory.'):
            with self.subTest(reply=reply):
                ftp = FakeFTP(missing_dir=reply)
                skip.sync(ftp, self.pairs, upload)
                ftp.files['ocr/eng.traineddata.gz'] = b'E' * 10
                p = os.path.join(self.dir.name, 'fonts_new.woff2')
                with open(p, 'wb') as f:
                    f.write(b'font')
                done, _ = skip.sync(ftp, self.pairs + [(p, 'fonts/new.woff2')], upload)
                self.assertEqual(sorted(done), ['fonts/new.woff2', 'ocr/eng.traineddata.gz'])

    def test_force_resends_everything(self):
        ftp = FakeFTP()
        skip.sync(ftp, self.pairs, upload)
        done, _ = skip.sync(ftp, self.pairs, upload, force=True)
        self.assertEqual(len(done), 3)

    def test_a_crashed_deploy_never_leaves_a_lying_manifest(self):
        ftp = FakeFTP()
        skip.sync(ftp, self.pairs, upload)
        self.write('assets/main-abc.js', b'js2')

        def dies(ftp_, local, remote):
            raise OSError('connection reset')
        with self.assertRaises(OSError):
            skip.sync(ftp, self.pairs, dies)
        # The entry about to change was dropped BEFORE the upload began.
        manifest = skip.parse_manifest(ftp.files[skip.REMOTE_MANIFEST].decode())
        self.assertNotIn('assets/main-abc.js', manifest)
        self.assertIn('ocr/eng.traineddata.gz', manifest)

    def test_manifest_forgets_deleted_routes_and_pruned_bundles(self):
        old = {'assets/main-old.js': {'sha256': 'a', 'size': 1}, 'Routes/gone.json': {'sha256': 'b', 'size': 1},
               'Routes/kept.json': {'sha256': 'c', 'size': 1}}
        local = {'assets/main-new.js': {'sha256': 'd', 'size': 2, 'local': '/x'}}
        nxt = skip.next_manifest(old, local, forget=['Routes/gone.json'], stale_prefixes=('assets/',))
        self.assertEqual(sorted(nxt), ['Routes/kept.json', 'assets/main-new.js'])
        self.assertEqual(sorted(skip.next_manifest(old, local, mirror=True)), ['assets/main-new.js'])

    def test_garbage_manifest_is_ignored(self):
        for raw in ('', 'nope', '[]', '{"version": 0, "files": {}}', '{"version": 1, "files": {"a": 3}}'):
            self.assertEqual(skip.parse_manifest(raw), {})

    def test_prune_removes_only_stale_files_under_the_root(self):
        ftp = FakeFTP({'assets/main-old.js': b'1', 'assets/main-new.js': b'2'})
        deleted = []
        ftp.delete = lambda rel: (deleted.append(rel), ftp.files.pop(rel))

        def listing(_ftp, path):
            prefix = path + '/'
            return [(k[len(prefix):], False) for k in ftp.files if k.startswith(prefix)]
        n = skip.prune(ftp, 'assets', {'assets/main-new.js'}, listing)
        self.assertEqual((n, deleted), (1, ['assets/main-old.js']))


if __name__ == '__main__':
    unittest.main()
