// SMPTE ST 2084 (PQ) luminance ramp — the non-linear PQ curve, weighted toward the
// shadows so near-black tone-mapping is easy to read.
import type { TsgPattern } from '../types.js';
import { PAL } from '../../palette.js';

const pattern: TsgPattern = {
  id: 'pqramp', label: 'PQ RAMP', name: 'PQ Ramp', group: 'HDR', order: 15,
  title: 'SMPTE ST 2084 (PQ) Ramp: Evaluates the display\'s ability to smoothly map non-linear luminance across extreme dynamic ranges without clipping near-black or near-white.',
  href: 'https://ieeexplore.ieee.org/document/7291452',
  draw(g, W, H) {
    const grad = g.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, PAL.black); grad.addColorStop(0.2, PAL.grey04s0);
    grad.addColorStop(0.5, PAL.grey20s0); grad.addColorStop(1, PAL.white);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
  },
};
export default pattern;
