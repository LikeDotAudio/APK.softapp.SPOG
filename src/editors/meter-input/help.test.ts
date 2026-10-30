// Meter Input's hover-help rides the shared src/ui/tip panel, which HTML-escapes
// every field — so the help tables must be plain text, never pre-escaped HTML.
import { describe, it, expect } from 'vitest';
import { helpTip, INTRO_TIP } from './help.js';

const CARDS = ['video', 'wave', 'chroma', 'parade', 'rgba', 'stack', 'vec', 'cie', 'diamond',
  'hsl', 'aud', 'meter', 'vu', 'gonio', 'rec', 'loud', 'lumin', 'editlog'];

describe('meter-input help → shared tip', () => {
  it('maps every card to a titled tip', () => {
    for (const k of CARDS) {
      const t = helpTip(k);
      expect(t, k).toBeDefined();
      expect(t!.title).toBeTruthy();
      expect(t!.lead).toBeTruthy();
    }
  });

  it('has no tip for an unknown card', () => {
    expect(helpTip('nope')).toBeUndefined();
  });

  it('carries no HTML entities or tags (the shared tip escapes them)', () => {
    for (const t of [INTRO_TIP, ...CARDS.map(helpTip)]) {
      const text = [t!.title, t!.lead, t!.good, t!.bad].filter(Boolean).join(' ');
      expect(text).not.toMatch(/&[a-z]+;|<\/?[a-z]/i);
    }
  });
});
