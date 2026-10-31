// Dynamic noise / plasma — three drifting radial washes to exercise adjacent
// pixels (motion smear + OLED image-retention mitigation). `t` drives the drift.
import type { TsgPattern } from '../types.js';
import { PAL, alpha } from '../../palette.js';

const pattern: TsgPattern = {
  id: 'plasma', label: 'PLASMA (BURN-IN)', name: 'Plasma / Burn-in', group: 'SDR', order: 10,
  title: 'Dynamic Noise Pattern: Exercises adjacent pixels to test motion smearing and helps mitigate temporary image retention (burn-in) on OLED panels.',
  href: 'https://en.wikipedia.org/wiki/Image_persistence',
  draw(g, W, H, t) {
    g.fillStyle = PAL.black; g.fillRect(0, 0, W, H);
    const s = t / 2600;
    const blobs: Array<[number, number, string]> = [
      [0.2 + 0.15 * Math.sin(s), 0.3 + 0.15 * Math.cos(s * 1.3), alpha(PAL.red50, .8)],
      [0.8 + 0.15 * Math.cos(s * 0.9), 0.7 + 0.15 * Math.sin(s * 1.1), alpha(PAL.blue50, .8)],
      [0.5 + 0.2 * Math.sin(s * 0.7), 0.5 + 0.2 * Math.cos(s), alpha(PAL.purple50, .8)],
    ];
    g.globalCompositeOperation = 'lighter';
    for (const [fx, fy, col] of blobs) {
      const cx = fx * W, cy = fy * H, r = Math.max(W, H) * 0.5;
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, col); grad.addColorStop(0.5, alpha(PAL.black, 0));
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
    }
    g.globalCompositeOperation = 'source-over';
  },
};
export default pattern;
