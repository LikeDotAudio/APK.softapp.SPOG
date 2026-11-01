"""The deploy upload set carries every built asset — including the self-hosted
zxing-wasm decoder (ROAD-3476), which the SCAN panel fetches same-origin from
/assets/ and must never fall back to a CDN for.

Run: npm run test:deploy   (python3 -m unittest discover -s SETUP -p 'test_*.py')
"""

import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from deploy.build import collect_app_files  # noqa: E402


class UploadSet(unittest.TestCase):
    def test_wasm_asset_is_uploaded_beside_the_bundle(self):
        with tempfile.TemporaryDirectory() as dist:
            os.makedirs(os.path.join(dist, 'assets'))
            for rel in ('index.next.html', 'assets/main-abc123.js', 'assets/zxing_reader-Dq3f9.wasm', 'sw.js'):
                with open(os.path.join(dist, rel), 'wb') as f:
                    f.write(b'x')
            remotes = sorted(r for _, r in collect_app_files(dist, 'index.next.html', 'index.htm'))
        self.assertEqual(remotes, ['assets/main-abc123.js', 'assets/zxing_reader-Dq3f9.wasm', 'index.htm', 'sw.js'])


if __name__ == '__main__':
    unittest.main()
