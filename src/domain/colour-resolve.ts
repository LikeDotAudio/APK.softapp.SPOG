// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/domain/colour-resolve — a colour seen through the chroma / vision modes (ROAD-3456).
 *
 *  The same maths lcars.css's root filter did (`filter: <chroma> <vision>`), as a pure function,
 *  so the Colour Engine can write each palette colour already resolved instead of filtering the
 *  whole page (which also re-coloured signal content: TSG, video, scopes stay TRUE colour).
 *  Each step is the Filter Effects colour matrix for its CSS function, applied in sRGB to
 *  un-premultiplied channels and clamped to 0..1 after every step, as the browser does;
 *  alpha passes through. Pure: no DOM. */

export type Chroma = 'full' | 'grey' | 'mono';
export type Vision = 'low' | 'normal' | 'high';
export interface Mode { chroma: Chroma; vision: Vision; monoHue?: number }

type M = readonly number[];   // 3×3 row-major + a 3-vector offset (12 numbers)
const lin = (m: readonly number[], o = 0): M => [...m.slice(0, 3), o, ...m.slice(3, 6), o, ...m.slice(6, 9), o];
const grayscale = (): M => lin([0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722]);
const sepia = (): M => lin([0.393, 0.769, 0.189, 0.349, 0.686, 0.168, 0.272, 0.534, 0.131]);
const saturate = (s: number): M => lin([
  0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
  0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
  0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s]);
const hueRotate = (deg: number): M => {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return lin([
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072]);
};
const brightness = (b: number): M => lin([b, 0, 0, 0, b, 0, 0, 0, b]);
const contrast = (k: number): M => lin([k, 0, 0, 0, k, 0, 0, 0, k], 0.5 - 0.5 * k);

/** The filter chain a mode stands for — the order lcars.css composed it in (chroma, then vision). */
export function chain(m: Mode): M[] {
  const out: M[] = [];
  if (m.chroma === 'grey') out.push(grayscale());
  if (m.chroma === 'mono') out.push(grayscale(), sepia(), saturate(3.2), hueRotate(m.monoHue ?? -8), brightness(1.06));
  if (m.vision === 'high') out.push(contrast(1.14), brightness(1.1));
  if (m.vision === 'low') out.push(brightness(0.72), contrast(0.96), saturate(0.9));
  return out;
}

const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Apply a chain to one 0..1 RGB triple. */
export function applyChain(rgb: readonly [number, number, number], steps: readonly M[]): [number, number, number] {
  let [r, g, b] = rgb;
  for (const m of steps) {
    [r, g, b] = [
      clamp(m[0]! * r + m[1]! * g + m[2]! * b + m[3]!),
      clamp(m[4]! * r + m[5]! * g + m[6]! * b + m[7]!),
      clamp(m[8]! * r + m[9]! * g + m[10]! * b + m[11]!)];
  }
  return [r, g, b];
}

/** Parse `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()` (comma or space syntax) → 0..255 channels + alpha. */
export function parseColour(s: string): [number, number, number, number] | null {
  const t = s.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(t);
  if (m) return [...m[1]!].map((c) => parseInt(c + c, 16)).concat(1) as [number, number, number, number];
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(t);
  if (m) {
    const n = parseInt(m[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, m[2] ? parseInt(m[2], 16) / 255 : 1];
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+)(%?)\s*)?\)$/.exec(t);
  if (m) {
    const a = m[4] === undefined ? 1 : Number(m[4]) / (m[5] ? 100 : 1);
    return [Number(m[1]), Number(m[2]), Number(m[3]), a];
  }
  return null;
}

const hex2 = (v: number): string => Math.round(v).toString(16).padStart(2, '0');
/** Format 0..255 channels + alpha the way a canvas reads a colour back: `#rrggbb`, or `rgba(r, g, b, a)` when translucent. */
export function formatColour(r: number, g: number, b: number, a = 1): string {
  return a >= 1 ? `#${hex2(r)}${hex2(g)}${hex2(b)}` : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})`;
}

/** A COMPUTED colour (data, a hue sweep, a lerp) as a literal the modes can read: `hsl` → `formatColour`.
 *  `h` in degrees, `s`/`l` in % (0..100). Spelled here so no drawing file spells rgba()/hsl() (ROAD-3463). */
export function hslColour(h: number, s: number, l: number, a = 1): string {
  const S = Math.max(0, Math.min(100, s)) / 100, L = Math.max(0, Math.min(100, l)) / 100;
  const H = ((h % 360) + 360) % 360;
  const k = (n: number): number => (n + H / 30) % 12, q = S * Math.min(L, 1 - L);
  const f = (n: number): number => 255 * (L - q * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)));
  return formatColour(f(0), f(8), f(4), a);
}

/** A data colour carried as an "r,g,b" triple, at `a`, as a literal (`formatColour`). */
export function tripleColour(rgb: string, a = 1): string {
  const [r = 0, g = 0, b = 0] = rgb.split(',').map(Number);
  return formatColour(r, g, b, a);
}

/** One colour through a mode. Unparseable input (a name, a gradient, `var(…)`) comes back unchanged. */
export function resolveColour(colour: string, mode: Mode): string {
  const steps = chain(mode);
  if (!steps.length) return colour;
  const c = parseColour(colour);
  if (!c) return colour;
  const [r, g, b] = applyChain([c[0] / 255, c[1] / 255, c[2] / 255], steps);
  return formatColour(r * 255, g * 255, b * 255, c[3]);
}
