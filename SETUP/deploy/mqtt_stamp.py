"""Publish a retained SPOG/system/build stamp after a successful deploy (audit §8 W4a).

Every open console learns a new build exists (the app pulses its version badge).
BEST-EFFORT ONLY: a down broker must never fail a deploy. The house broker
speaks WebSockets (no raw-TCP 1883 listener), so paho must use the websockets
transport.

The broker comes from the deploy settings only (SETUP/.env or the CI secrets
TWIST_MQTT_HOST / _PORT / _USER / _PASS, read by deploy.env). There is no
default host and no default login: with TWIST_MQTT_HOST unset the stamp is
skipped, never sent to a guessed LAN address with guest/guest.
"""

import os
import json

from deploy.constants import DIST_DIR
from deploy.env import load_env
from deploy.routes import routes_hash


def stamp_target(env):
    """(host, port, auth) from the deploy settings, or None when no host is set."""
    host = env.get('TWIST_MQTT_HOST')
    if not host:
        return None
    port = int(env.get('TWIST_MQTT_PORT') or 9001)
    user = env.get('TWIST_MQTT_USER')
    auth = {'username': user, 'password': env.get('TWIST_MQTT_PASS', '')} if user else None
    return host, port, auth


def publish_build_stamp(project_dir, env=None):
    target = stamp_target(load_env() if env is None else env)
    if target is None:
        print("TWIST_MQTT_HOST not set — skipping MQTT build stamp.")
        return
    host, port, auth = target
    build_id = None
    try:
        with open(os.path.join(project_dir, DIST_DIR, 'build-id.json')) as f:
            build_id = json.load(f)
    except OSError:
        pass
    if not build_id:
        print("No dist/build-id.json — skipping MQTT build stamp.")
        return
    payload = json.dumps({
        'buildId': build_id,
        'routesHash': routes_hash(project_dir),
        'ts': int(__import__('time').time() * 1000),
    })
    try:
        import paho.mqtt.publish as mqtt_publish
        mqtt_publish.single(
            'SPOG/system/build', payload, retain=True, qos=0,
            hostname=host, port=port, transport='websockets', auth=auth,
        )
        print(f"MQTT build stamp published → SPOG/system/build ({build_id.get('short', '?')})")
    except Exception as e:   # noqa: BLE001 — best-effort by design
        print(f"MQTT build stamp skipped ({e.__class__.__name__}: {e}) — consoles won't auto-announce this deploy.")
