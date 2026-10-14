// src/platform/device/types.ts — Device Manifest & I/O Contract.
// Strongly typed schema for devices broadcasting inputs, outputs, types, and groups.

export type IOType =
  | 'fader'
  | 'knob'
  | 'meter'
  | 'switch'
  | 'toggle'
  | 'select'
  | 'indicator'
  | 'readout'
  | 'audio'
  | 'video'
  | string;

export interface DeviceIO {
  id: string;
  name: string;
  type: IOType;
  group?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  value?: unknown;
  writable?: boolean;
  topic?: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  order?: number;
  direction?: 'in' | 'out' | 'both';
  icon?: string;
}

export interface DeviceManifest {
  id: string;
  name: string;
  category?: string;
  color?: string;
  groups: DeviceGroup[];
  inputs: DeviceIO[];
  outputs: DeviceIO[];
  types?: Record<string, string>;
  ts?: number;
}
