import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import plugin from './index.js';
import { ingestManifest } from '../../platform/device/receiver.js';

describe('Universal Device Editor Plugin', () => {
  const oldDoc = globalThis.document;

  beforeAll(() => {
    function makeNode(tag: string): any {
      const children: any[] = [];
      const dataset: Record<string, string> = {};
      return {
        tagName: tag.toUpperCase(),
        dataset,
        style: { setProperty: () => {}, getPropertyValue: () => '' },
        children,
        append: (...args: any[]) => children.push(...args),
        appendChild: (c: any) => children.push(c),
        setAttribute: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => false },
        querySelector: (sel: string) => {
          if (sel === '.dev-title') return { textContent: 'Keithley 2000 DMM' };
          if (sel === '.dev-strip-name') return { textContent: 'DC Voltage' };
          return null;
        },
        querySelectorAll: (sel: string) => {
          if (sel === '.dev-group-card') return [{}, {}];
          return [];
        },
      };
    }

    globalThis.document = {
      createElement: makeNode,
      head: { appendChild: () => {} },
      getElementById: () => null,
    } as any;
  });

  afterAll(() => {
    globalThis.document = oldDoc;
  });

  it('matches generic device names and discovered device IDs', () => {
    expect(plugin.match('Device')).toBe(true);
    expect(plugin.match('Hardware Rack')).toBe(true);
    expect(plugin.match('Unit 1')).toBe(true);
    expect(plugin.match('gear')).toBe(true);

    ingestManifest({
      id: 'keithley-dmm',
      name: 'Keithley 2000 DMM',
      groups: [{ id: 'm', name: 'Measurement' }],
      inputs: [{ id: 'v', name: 'DC Voltage', type: 'readout', value: 4.99 }],
      outputs: [],
    });

    expect(plugin.match('keithley-dmm')).toBe(true);
  });

  it('renders device groups, inputs, and outputs into host container', () => {
    const host = document.createElement('div');
    const disposeList: Array<() => void> = [];
    const ctx: any = {
      twist: { name: 'keithley-dmm', config: { deviceId: 'keithley-dmm' } },
      sources: [],
      production: { id: 'test', name: 'TEST', color: '#ff9900' },
      siblings: [],
      can: () => true,
      services: {},
      dispose: {
        add: (fn: () => void) => disposeList.push(fn),
        interval: () => {},
        raf: () => {},
      },
    };

    plugin.render(host, ctx);

    expect(host.querySelector('.dev-title')?.textContent).toBe('Keithley 2000 DMM');
    expect(host.querySelectorAll('.dev-group-card').length).toBeGreaterThan(0);
    expect(host.querySelector('.dev-strip-name')?.textContent).toBe('DC Voltage');

    disposeList.forEach((d) => d());
  });
});
