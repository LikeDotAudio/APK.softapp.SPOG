// EBU Tech 3219 colour bars — seven 75%-amplitude vertical bars.
import type { TsgPattern } from '../types.js';
import { PAL } from '../../palette.js';

const BARS = [PAL.white, PAL.yellow37, PAL.cyan37, PAL.green37, PAL.purple37, PAL.red37, PAL.blue37];

const pattern: TsgPattern = {
  id: 'ebubars', label: 'EBU BARS', name: 'EBU Colour Bars', group: 'SDR', order: 2,
  title: 'EBU Tech 3219: Colour Bar Pattern. Evaluates color accuracy, 75% amplitude saturation limits, and checks for broadcast signal phase errors.',
  href: 'https://tech.ebu.ch/docs/tech/tech3219.pdf',
  draw(g, W, H) {
    const bw = W / BARS.length;
    BARS.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * bw, 0, bw + 1, H); });
  },
};
export default pattern;
