// src/domain/ocr/box-nav.test — arrow keys move by geometry, Tab by reading order (ROAD-3475).
import { describe, it, expect } from 'vitest';
import { getAdjacentBoxId, readingOrder, dirOfKey, type Box } from './box-nav.js';

// Two rows of a label, deliberately listed out of reading order:
//   a(10..60)  b(100..180)  c(220..300)        row 1, y 10..30
//   d(10..90)        e(150..260)               row 2, y 60..82 (slightly tilted)
const box = (id: string, x0: number, y0: number, x1: number, y1: number): Box => ({ id, x0, y0, x1, y1 });
const B = [box('e', 150, 62, 260, 84), box('c', 220, 12, 300, 32), box('a', 10, 10, 60, 30), box('d', 10, 58, 90, 80), box('b', 100, 11, 180, 31)];

describe('getAdjacentBoxId', () => {
  it('reads rows top to bottom, left to right, whatever order the list is in', () => {
    expect(readingOrder(B).map((b) => b.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('RIGHT / LEFT stay on the row', () => {
    expect(getAdjacentBoxId(B, 'a', 'right')).toBe('b');
    expect(getAdjacentBoxId(B, 'b', 'right')).toBe('c');
    expect(getAdjacentBoxId(B, 'e', 'left')).toBe('d');
  });
  it('DOWN / UP go to the nearest box below / above, not the next in the list', () => {
    expect(getAdjacentBoxId(B, 'a', 'down')).toBe('d');
    expect(getAdjacentBoxId(B, 'c', 'down')).toBe('e');
    expect(getAdjacentBoxId(B, 'e', 'up')).toBe('c');   // e (150..260) sits more under c than under b
    expect(getAdjacentBoxId(B, 'd', 'up')).toBe('a');
  });
  it('an arrow with nothing that way stays put', () => {
    expect(getAdjacentBoxId(B, 'c', 'right')).toBe('c');
    expect(getAdjacentBoxId(B, 'a', 'up')).toBe('a');
    expect(getAdjacentBoxId(B, 'd', 'down')).toBe('d');   // e is on d's row (tilted), not below it
  });
  it('Tab walks reading order and wraps; no selection starts at the first box; an empty page gives ""', () => {
    expect(getAdjacentBoxId(B, 'c', 'next')).toBe('d');
    expect(getAdjacentBoxId(B, 'e', 'next')).toBe('a');
    expect(getAdjacentBoxId(B, 'a', 'prev')).toBe('e');
    expect(getAdjacentBoxId(B, null, 'down')).toBe('a');
    expect(getAdjacentBoxId(B, 'gone', 'right')).toBe('a');
    expect(getAdjacentBoxId([], null, 'next')).toBe('');
  });
  it('maps keys', () => {
    expect(dirOfKey('ArrowDown', false)).toBe('down');
    expect(dirOfKey('Tab', true)).toBe('prev');
    expect(dirOfKey('a', false)).toBeNull();
  });
});
