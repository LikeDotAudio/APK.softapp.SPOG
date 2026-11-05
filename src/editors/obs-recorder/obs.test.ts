import { describe, it, expect } from 'vitest';
import { authString, applyEvent, emptyState } from './obs.js';
import { pluginFor } from '../registry.js';

describe('obs-recorder', () => {
  it('the v5 auth string is the documented double SHA-256', async () => {
    // obs-websocket protocol.md: password "supersecretpassword", salt + challenge as given
    const a = await authString('supersecretpassword', 'lM1GncleQOaCu9lT1yeUZhFYnqhsLLP1G5lAGo3ixaI=', '+IxH4CnCiqpX1rM9scsNynZzbOe4KhDeYcTNS3PDaeY=');
    expect(a).toBe('1Ct943GAT+6YQUUX47Ia/ncufilbe6+oD6lY+5kaCu4=');
  });
  it('record / stream / scene events fold into the state', () => {
    let s = applyEvent(emptyState(), 'RecordStateChanged', { outputActive: true, outputState: 'OBS_WEBSOCKET_OUTPUT_STARTED' });
    expect(s.recording).toBe(true);
    s = applyEvent(s, 'RecordStateChanged', { outputActive: true, outputState: 'OBS_WEBSOCKET_OUTPUT_PAUSED' });
    expect(s.paused).toBe(true);
    s = applyEvent(s, 'StreamStateChanged', { outputActive: true });
    s = applyEvent(s, 'CurrentProgramSceneChanged', { sceneName: 'Wide' });
    expect([s.streaming, s.scene]).toEqual([true, 'Wide']);
    expect(applyEvent(s, 'SomethingElse', {})).toBe(s);
  });
  it('an OBS twist opens the OBS recorder; an encoder twist still opens the encoder', () => {
    expect(pluginFor('OBS Recorder')?.id).toBe('obs-recorder');
    expect(pluginFor('Encoder')?.id).not.toBe('obs-recorder');
  });
});
