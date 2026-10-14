// src/editors/device/index.ts — Universal Device Interface plugin for SPOG.
// Captures and displays user interfaces for any gear broadcasting inputs, outputs, types, and groups.

import type { EditorPlugin } from '../types.js';
import { renderDeviceEditor } from './render.js';
import { getDevice } from '../../platform/device/receiver.js';

const DEVICE_REGEX = /^(device|gear|hardware|hw|unit|rack|stage\s*box\s*8ch)/i;

const plugin: EditorPlugin = {
  id: 'device',
  title: 'DEVICE INTERFACE · UNIVERSAL SURFACE',
  order: 120,
  match(twistName: string): boolean {
    if (DEVICE_REGEX.test(twistName)) return true;
    if (getDevice(twistName)) return true;
    return false;
  },
  render(host, ctx) {
    renderDeviceEditor(host, ctx);
  },
};

export default plugin;
