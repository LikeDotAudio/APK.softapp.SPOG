/* spog-config.js — the deployment's runtime config (see src/platform/runtime-config.ts).
   This checked-in copy names nothing: the console then talks to the broker behind its own
   origin (`/mqtt`) and publishes plaintext. SETUP/deploy.py overwrites dist/spog-config.js
   from SPOG_BROKER / SPOG_BUS_KEY when they are set. Never commit a real key here. */
window.SPOG_CONFIG = window.SPOG_CONFIG || {};
