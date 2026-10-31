// Luminance ramp — a smooth black→white sweep for banding / quantization checks.
import type { TsgPattern } from '../types.js';
import { PAL } from '../../palette.js';

const pattern: TsgPattern = {
  id: 'greyramp', label: 'GREY RAMP', name: 'Grey Ramp', group: 'SDR', order: 4,
  title: 'Luminance Ramp: Identifies 8-bit/10-bit quantization errors, visualizes color banding, and tests contrast transitions.',
  href: 'https://en.wikipedia.org/wiki/Colour_banding',
  draw(g, W, H) {
    const grad = g.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, PAL.black); grad.addColorStop(1, PAL.white);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
  },
};
export default pattern;
