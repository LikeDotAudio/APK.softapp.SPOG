"""Deploy settings: FTPS credentials, the deploy-stamp broker, the runtime config.

One reader for every deploy secret, in this order (later wins):

  1. SETUP/.env            -- a local, gitignored file; SETUP/.env.example lists the names
  2. the process environment -- what CI uses (the workflow maps its secrets to env vars)

Nothing here has a default value: a name that is unset stays unset, and each
caller decides what "unset" means (deploy.py refuses to log in, the build stamp
is skipped, no runtime config is written). SETUP/.env used to be tracked with
real values; it is untracked now and must never be committed again
(.gitignore lists `.env`).
"""

import os

# The names a deploy reads. Only these are taken from the environment, so an
# unrelated variable in CI never leaks into the deploy.
KEYS = (
    'FTP_HOST', 'FTP_USER', 'FTP_PASS', 'FTP_PORT',
    'TWIST_MQTT_HOST', 'TWIST_MQTT_PORT', 'TWIST_MQTT_USER', 'TWIST_MQTT_PASS',
    'SPOG_BROKER', 'SPOG_BUS_KEY',
)

ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')


def _read_file(path):
    out = {}
    if not os.path.exists(path):
        return out
    with open(path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            out[key.strip()] = value.strip().strip('"\'')
    return out


def load_env(path=ENV_FILE, environ=None):
    """SETUP/.env overlaid with the process environment; empty values are dropped."""
    environ = os.environ if environ is None else environ
    merged = _read_file(path)
    for key in KEYS:
        if environ.get(key):
            merged[key] = environ[key]
    return {k: v for k, v in merged.items() if v}
