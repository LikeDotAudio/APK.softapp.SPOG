"""Deploy settings have no committed values and no guessed defaults (2026-10-30 audit).

Run: npm run test:deploy   (python3 -m unittest discover -s SETUP -p 'test_*.py')
"""

import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from deploy.env import load_env  # noqa: E402
from deploy.mqtt_stamp import stamp_target  # noqa: E402
from deploy.runtime_config import render  # noqa: E402

PROJECT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class Settings(unittest.TestCase):
    def test_env_file_then_environment(self):
        with tempfile.NamedTemporaryFile('w', suffix='.env', delete=False) as f:
            f.write('# comment\nFTP_HOST=file.example\nFTP_USER="u"\nFTP_PASS=\n')
        try:
            env = load_env(f.name, {'FTP_PASS': 'p', 'FTP_HOST': 'env.example', 'UNRELATED': 'x'})
        finally:
            os.unlink(f.name)
        self.assertEqual(env, {'FTP_HOST': 'env.example', 'FTP_USER': 'u', 'FTP_PASS': 'p'})

    def test_stamp_has_no_default_broker(self):
        self.assertIsNone(stamp_target({}))
        self.assertEqual(stamp_target({'TWIST_MQTT_HOST': 'b.example'}), ('b.example', 9001, None))
        self.assertEqual(stamp_target({'TWIST_MQTT_HOST': 'b', 'TWIST_MQTT_PORT': '8080',
                                       'TWIST_MQTT_USER': 'u', 'TWIST_MQTT_PASS': 'p'}),
                         ('b', 8080, {'username': 'u', 'password': 'p'}))

    def test_runtime_config(self):
        self.assertIsNone(render({}))
        self.assertIn('"broker": "b.example/mqtt"', render({'SPOG_BROKER': 'b.example/mqtt'}))

    def test_env_files_are_not_tracked(self):
        tracked = subprocess.run(['git', 'ls-files', '--', '*.env', '.env', 'SETUP/.env'], cwd=PROJECT,
                                 capture_output=True, text=True, check=True).stdout.split()
        self.assertEqual(tracked, [])
        with open(os.path.join(PROJECT, 'SETUP', '.env.example')) as f:
            values = [l.split('=', 1)[1].strip() for l in f if '=' in l and not l.startswith('#')]
        self.assertTrue(values and all(v == '' for v in values), '.env.example must hold names only')


if __name__ == '__main__':
    unittest.main()
