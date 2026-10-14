// src/editors/device/controls.ts — Factory for interactive device I/O widgets.
// Binds inputs and outputs to reactive two-way MQTT updates with Disposer cleanup.

import { el } from '../../ui/dom.js';
import { knob, fader, meter } from '../../ui/widgets.js';
import type { DeviceIO } from '../../platform/device/types.js';
import { onDeviceValue, publishDeviceValue } from '../../platform/device/receiver.js';
import type { Disposer } from '../../ui/timers.js';

export function createControlWidget(
  devId: string,
  io: DeviceIO,
  dispose: Disposer,
  accentColor = '#ff9900',
): HTMLElement {
  const strip = el('div', { class: 'dev-strip' });
  const label = el('div', { class: 'dev-strip-name', textContent: io.name, title: io.name });
  const valReadout = el('div', { class: 'dev-strip-val', textContent: formatVal(io.value, io.unit) });

  let widget: HTMLElement;
  const initial = typeof io.value === 'number' ? io.value : (io.min ?? 0);
  const min = io.min ?? 0;
  const max = io.max ?? 1;
  const norm = max > min ? Math.max(0, Math.min(1, (initial - min) / (max - min))) : 0.5;

  const type = String(io.type).toLowerCase();

  if (type === 'knob' || type === 'gain' || type === 'trim') {
    const k = knob('', norm, accentColor, (v) => {
      const real = min + v * (max - min);
      valReadout.textContent = formatVal(real, io.unit);
      publishDeviceValue(devId, io.id, real);
    });
    dispose.add(onDeviceValue(devId, io.id, (v) => {
      if (typeof v === 'number' && max > min) {
        k.setValue((v - min) / (max - min));
        valReadout.textContent = formatVal(v, io.unit);
      }
    }));
    widget = k;
  } else if (type === 'fader' || type === 'slider' || type === 'level') {
    const f = fader('', norm, accentColor, (v) => {
      const real = min + v * (max - min);
      valReadout.textContent = formatVal(real, io.unit);
      publishDeviceValue(devId, io.id, real);
    });
    dispose.add(onDeviceValue(devId, io.id, (v) => {
      if (typeof v === 'number' && max > min) {
        f.setValue((v - min) / (max - min));
        valReadout.textContent = formatVal(v, io.unit);
      }
    }));
    widget = f;
  } else if (type === 'meter' || type === 'vu' || type === 'peak') {
    const m = meter(dispose, norm);
    dispose.add(onDeviceValue(devId, io.id, (v) => {
      if (typeof v === 'number') valReadout.textContent = formatVal(v, io.unit);
    }));
    widget = m;
  } else if (type === 'switch' || type === 'toggle' || type === 'button') {
    const btn = el('button', {
      class: `dev-toggle-btn${io.value ? ' active' : ''}`,
      textContent: io.value ? 'ON' : 'OFF',
    });
    let curState = Boolean(io.value);
    btn.addEventListener('click', () => {
      curState = !curState;
      btn.classList.toggle('active', curState);
      btn.textContent = curState ? 'ON' : 'OFF';
      valReadout.textContent = curState ? 'ON' : 'OFF';
      publishDeviceValue(devId, io.id, curState);
    });
    dispose.add(onDeviceValue(devId, io.id, (v) => {
      curState = Boolean(v);
      btn.classList.toggle('active', curState);
      btn.textContent = curState ? 'ON' : 'OFF';
      valReadout.textContent = curState ? 'ON' : 'OFF';
    }));
    widget = btn;
  } else {
    // Readout / indicator / patch point
    const box = el('div', {
      class: 'dev-toggle-btn',
      style: 'background: #0b1322; border: 1px solid #1e293b; color: #38bdf8;',
      textContent: formatVal(io.value ?? '—', io.unit),
    });
    dispose.add(onDeviceValue(devId, io.id, (v) => {
      box.textContent = formatVal(v ?? '—', io.unit);
      valReadout.textContent = formatVal(v, io.unit);
    }));
    widget = box;
  }

  strip.append(label, widget, valReadout);
  return strip;
}

function formatVal(v: unknown, unit?: string): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'number') {
    const s = v % 1 === 0 ? v.toString() : v.toFixed(1);
    return unit ? `${s} ${unit}` : s;
  }
  if (typeof v === 'boolean') return v ? 'ON' : 'OFF';
  return String(v);
}
