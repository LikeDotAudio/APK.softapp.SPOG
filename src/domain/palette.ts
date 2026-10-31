// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/domain/palette — every UI colour SPOG spells, in ONE file (ROAD-3449, Colour Engine P2).
 *
 *  The brand accent and the three state tones are NOT here: they come from the contract
 *  (src/domain/brand.ts, src/domain/state.ts → src/vendor/apk-contracts/). Everything else a
 *  style string or a canvas paints is named below and read as `PAL.<name>`; no other source
 *  file under src/ spells a hex (src/domain/palette.test.ts holds that to a ceiling that only
 *  falls). Names say what the colour IS — hue family + HSL lightness % (`sky69` is a light sky
 *  blue), with the saturation or the hex appended only where two would collide — because they
 *  were swept from 2,800 literals mechanically.
 *  `PAL.<name>` reads `var(--pal-<name>)`: the Colour Engine writes every `--pal-*` onto <html>
 *  already seen through the chroma / vision modes (src/domain/colour-resolve.ts), so a style
 *  string follows the mode live, and src/ui/canvas-ink.ts reads the same values onto a canvas.
 *  `HEX.<name>` is the true colour, for what must stay a hex: data, parsers, colour inputs, and
 *  signal content (TSG, video, scopes), which never passes through the modes (ROAD-3456).
 *  Pure data: no DOM, no imports. */

const P = {
  amber09: '#1c1810', amber10: '#231f0f', amber13: '#2a2418', amber15: '#3a2f10', amber19: '#3a3428',
  amber26: '#5a4a2a', amber30: '#6a5a30', amber35: '#8a6a26', amber36: '#8a7530', amber44: '#9a8845',
  amber45: '#e69f00', amber47: '#c9a227', amber50: '#ffd400', amber50s100: '#ffaa00', amber55s73: '#e0b53a',
  amber60: '#ffcc33', amber61: '#f5c542', amber62s100: '#ffd43b', amber65: '#f2c15c', amber65s100: '#ffe14d',
  amber71: '#ffd76b', amber71s100: '#ffcf6b', amber72: '#e7c98a', amber85: '#ffe9b0', amber86: '#fff0b8',
  amber88: '#efe7d0', black: '#000000', blue04: '#03060f', blue09: '#0c1322', blue09s58: '#0a1326',
  blue12_0c1730: '#0c1730', blue12s14: '#1b1d24', blue13: '#111c31', blue13s100: '#000040', blue14: '#111e38',
  blue15: '#13233c', blue15s14: '#20202a', blue15s32: '#1a2333', blue17: '#1e293b', blue18s42: '#1a2440',
  blue19: '#1d2942', blue20s48: '#1a2b4a', blue21s35: '#223047', blue22: '#1d3354', blue23s39: '#233150',
  blue25: '#2a3a55', blue25s100: '#000080', blue27s36: '#2c3e5e', blue28s56: '#1f3a6e', blue29s21: '#3a4658',
  blue31: '#33486a', blue31s27: '#394a63', blue31s44: '#2c4370', blue32: '#37456a', blue34s39: '#35507a',
  blue37: '#0000bf', blue38: '#3f5a82', blue39: '#4a5c7d', blue40: '#475a86', blue44s20: '#5a6a86',
  blue44s25: '#546a8c', blue45: '#5a6a8c', blue47: '#64748b', blue49: '#0a46ee', blue50: '#0000ff',
  blue51: '#3a6acc', blue53: '#6b82a3', blue56: '#7d8ba0', blue59: '#2d6bff', blue60: '#646dcc',
  blue60s27: '#7e93b5', blue61: '#3786ff', blue65: '#4d94ff', blue65s20: '#94a3b8', blue65s82: '#5b8def',
  blue65s100: '#4d83ff', blue67: '#5c7cfa', blue68: '#5a9dff', blue75s76: '#8f9cf0', blue76: '#86acff',
  blue80: '#c2cad6', blue80s37: '#bcb9df', blue80s39: '#b9c9e0', blue81s100: '#9fb8ff', blue85: '#cdd6e6',
  blue87: '#cbd8ef', blue87s30: '#d4d4e8', blue92: '#dfe8f5', blue93: '#e8ecf2', blue96s24: '#f2f4f7',
  blue98: '#f4f8ff', cyan06: '#001b1d', cyan09: '#04222a', cyan12: '#0e2b31', cyan18: '#10444d',
  cyan25: '#008080', cyan37: '#00bfbf', cyan37s55: '#2a8b91', cyan50: '#00ffff', cyan50s100: '#00e5ff',
  cyan52: '#3fc1c9', cyan56: '#5cb8c4', cyan59: '#4dd0e1', cyan60: '#88aaaa', cyan68: '#5be0ff',
  cyan71: '#7fe3e9', cyan76: '#87eeff', cyan96: '#eaffff', green05: '#04140a', green05s50: '#0a1206',
  green07: '#03210c', green08: '#111a12', green09: '#12210f', green11: '#0f2a17', green14: '#1a3216',
  green14s66: '#0c3a18', green19: '#24401f', green24: '#1f5a3a', green27: '#0f7a39', green29: '#2c6a3c',
  green32: '#3a6a3a', green33: '#228833', green34: '#1f8f38', green37: '#00bf00', green44: '#19c54b',
  green45: '#46a06e', green48: '#1fd83a', green49: '#78a05a', green49s100: '#7cfc00', green50: '#00ff00',
  green52: '#28e04a', green53: '#39d353', green53s71: '#33dd66', green58: '#6cdf4a', green67: '#7fd6a0',
  green68: '#7de07d', green69: '#7fe0a0', green70: '#74ef8a', green72s57: '#8de0b0', green74: '#7cfc9a',
  green75: '#9fe0b0', green77: '#a6e2a6', green81_9effb0: '#9effb0', green81s100: '#9fffc0', green83: '#ccffaa',
  green90: '#caffd6', green93: '#daffe8', green96: '#eaffea', grey04s0: '#0a0a0a', grey07_131313: '#131313',
  grey08: '#151515', grey08s0: '#141414', grey12: '#1f1f1f', grey21: '#31343a', grey25: '#3a3d44',
  grey25s0: '#404040', grey33: '#555555', grey36: '#565a62', grey40: '#666666', grey40s12: '#5a6472',
  grey47: '#6b7686', grey50: '#808080', grey52: '#7d828c', grey53: '#888888', grey60: '#9a9a9a',
  grey64: '#9aa0aa', grey67: '#aaaaaa', grey75: '#bfbfbf', grey80: '#cccccc', grey81: '#c9ccd2',
  grey84: '#d6d6d6', grey90s0: '#e6e6e6', indigo04: '#0a080d', indigo05: '#0a0712', indigo06: '#0f0a17',
  indigo09: '#161020', indigo11: '#160f2a', indigo13s50: '#1a1030', indigo20: '#2a2440', indigo33: '#4a3a6e',
  indigo65: '#785ef0', indigo83: '#c3a8ff', indigo83s100: '#cba6ff', indigo89: '#d8c8ff', indigo92: '#e8d8ff',
  lime45: '#82c91e', lime55: '#b0d04a', lime56: '#a4c953', lime96: '#f6f7f4', orange05s54: '#140f06',
  orange06: '#1a1206', orange06s100: '#201400', orange07: '#241400', orange11: '#241a12', orange11s45: '#2a2110',
  orange20: '#663300', orange39: '#b36314', orange42: '#d55e00', orange44: '#c97a16', orange46: '#c67825',
  orange46s64: '#c1502a', orange50: '#ff9900', orange50_fe6100: '#fe6100', orange50s55: '#c67d3a',
  orange50s100: '#ff8a00', orange51: '#b28452', orange51s59: '#cc6a3a', orange52: '#b67a52', orange56: '#e6a13a',
  orange57: '#caa15a', orange57s85: '#ee7733', orange58: '#ff922b', orange62: '#f2b74b', orange62s85: '#f0a24a',
  orange62s87: '#f28c4b', orange63: '#ff9640', orange63s34: '#c19880', orange65: '#f2b25c',
  orange65_f2a25a: '#f2a25a', orange65s85: '#f2955c', orange65s100: '#ffa94d', orange69: '#ff9c63',
  orange72: '#e7b48a', orange75: '#ffd27f', orange81: '#ffd9a0', orange90: '#ffe5cc', pink11: '#25121a',
  pink27: '#7a1152', pink43: '#aa3377', pink47: '#97587b', pink50: '#e0219a', pink51: '#dc267f',
  pink55: '#ae697d', pink55s32: '#b0679b', pink59: '#ff2e97', pink64: '#cc79a7', pink68: '#ff5bd1',
  pink69: '#c19eb0', pink69s100: '#ff5fa2', pink75: '#f08fb0', purple07: '#160a18', purple11s43: '#241028',
  purple13: '#241a26', purple37: '#bf00bf', purple50: '#ff00ff', purple52: '#9c6b9c', purple59: '#c864c8',
  purple62: '#c678c6', purple70: '#cc99cc', purple75: '#e79ae7', purple96: '#ffe9ff', red05: '#150404',
  red12: '#2a1212', red13: '#3a0808', red15: '#3a1010', red20: '#660000', red21: '#5a1020', red30: '#7a1f2a',
  red37: '#bf0000', red38s84: '#b31038', red40: '#cc0000', red43: '#cc3311', red44: '#c02020',
  red44s60: '#b32d2d', red47: '#c8283c', red50: '#ff0000', red50s76: '#e01f1f', red51: '#cc3a3a',
  red52: '#b46757', red54: '#e03131', red57: '#ee3333', red58: '#ff2b2b', red58s71: '#e0524a',
  red59_ff5b2e: '#ff5b2e', red60: '#ff3344', red60_ff3355: '#ff3355', red60s100: '#ff3366', red62: '#ff3b3b',
  red62s100: '#ff5a3c', red65: '#ff4d4d', red67s40: '#cc8888', red68_ff5a6e: '#ff5a6e', red68s100: '#ff5a5a',
  red70: '#ff6677', red71: '#ff6a6a', red77: '#ff8a8a', red78: '#f0a0a0', red80: '#ff9a9a', red80s100: '#ff9aa6',
  red81: '#ff9db0', red90: '#ffcccc', red92: '#ffd7d7', sky05: '#001019', sky08: '#08131f', sky09s75: '#06202a',
  sky10: '#0d1a26', sky10s62: '#0a1a2b', sky12: '#12202a', sky13: '#0e2436', sky15: '#00214c',
  sky15s30: '#1a2530', sky18: '#22303a', sky18s38: '#1d3340', sky19: '#12324f', sky22: '#1d3a52',
  sky24: '#1d3a5c', sky27: '#21406a', sky30: '#2c4a6e', sky34: '#3a5573', sky35: '#4a5b66', sky35s22: '#46616e',
  sky40: '#41618a', sky43: '#4a678f', sky44s20: '#5a6f88', sky44s86: '#1084d0', sky47: '#4477aa',
  sky48: '#3f86b6', sky49: '#6d818d', sky52: '#4f86b8', sky55: '#6f88a8', sky56: '#6f8db0', sky56s29: '#6f92b0',
  sky59: '#2ec5ff', sky60: '#38bdf8', sky60s15: '#8a99a8', sky61: '#7f98b8', sky61s100: '#3aa0ff',
  sky63: '#8fa6b2', sky63s37: '#7f9ec4', sky63s77: '#56b4e9', sky64: '#7ea6c8', sky65: '#4ec0ff',
  sky66: '#7fa6d0', sky67: '#8fa9c8', sky69: '#6fc8f0', sky69s20: '#a0aec0', sky69s41: '#8fb0d0',
  sky71: '#9fb6cc', sky71s80: '#7ad0f0', sky72: '#74c0fc', sky74s42: '#9fb8d8', sky75: '#8fcdf0',
  sky75s100: '#7fd0ff', sky77s47: '#a8c0e0', sky80: '#99ccff', sky81: '#9fdcff', sky81s100: '#9fd6ff',
  sky84: '#bcd3ee', sky84s40: '#c4d3e6', sky84s100: '#aee0ff', sky87: '#bcd8ff', sky87s100: '#bfe0ff',
  sky88: '#cfe0f2', sky89: '#d6e6ef', sky91: '#cfe6ff', sky94s100: '#dff0ff', sky96_eaf4ff: '#eaf4ff',
  teal10: '#10241c', teal30: '#2a6f4f', teal31: '#009e73', teal49: '#21d8c0', teal51: '#05ffa1',
  teal54: '#39d98a', teal54s68: '#38d9a9', teal59: '#64c8a0', teal65: '#63e6be', violet11: '#1c1226',
  violet16: '#2a2030', violet17s26: '#2a2036', violet17s39: '#2c1a3b', violet18: '#2a0a52', violet22: '#3a2b46',
  violet23: '#3d2650', violet30: '#4a2d6b', violet34: '#5a3a72', violet42: '#6a5a7a', violet49: '#8a5aa0',
  violet57: '#a06eb4', violet60: '#9a86ac', violet65: '#b14eff', violet70: '#b79ccb', violet71: '#c46bff',
  violet75: '#c89ce0', violet78: '#c9b6d6', violet78s38: '#c9b3dd', violet80: '#c79bff', violet80s44: '#d8b4e2',
  violet82: '#d9b6ee', violet83: '#d8c6e2', violet85: '#e0c6ec', violet89: '#e7d6f2', violet93: '#f2d9ff',
  white: '#ffffff', yellow37: '#bfbf00', yellow38: '#8f8a35', yellow43: '#a89b35', yellow50: '#ffff00',
  yellow53: '#c2b74b', yellow53s57: '#ccbb44', yellow56: '#e6e23a', yellow60s77: '#e8d44a', yellow65: '#f1e05a',
  yellow75: '#ffff80', yellow97: '#ffffee', blue10s25: '#141821', blue15s18: '#20242e', blue21s21: '#2b3242',
  orange30: '#7a3b1f', orange33: '#7a4a2e', lime50: '#aaff00', violet50: '#aa00ff', sky08s100: '#001428',
  purple78: '#d9b3d9', purple55: '#b266b2', purple84: '#e0cce0', orange61: '#ed864c', amber48: '#f5ad00',
  sky35s100: '#0072b2', red08: '#2a0000', red32: '#8f1414', blue05_060c16: '#060c16', blue80s50: '#b4c8e6',
  red39: '#b21414', sky65s50: '#78a0d2', sky45s30: '#506e96', sky75s60: '#9bbee6', sky61s35: '#7896be',
  orange74s100: '#ffc878', sky73: '#96b4dc', amber69: '#ffe060', red74s100: '#ff7878', green62: '#5ae08c',
  green70s74: '#78eb96', sky34s47: '#2e5680', red63s100: '#ff4040', green63: '#40ff60', blue69: '#608cff',
  amber57: '#e6c83c', orange50s76: '#e08a1e', blue89: '#c8dcff', grey73: '#b4b4be', blue69s31: '#96aac8',
  sky75s36: '#aabed7', sky92: '#d7ebff', blue69s19: '#a0aabe', blue76s25: '#b4bed2', sky93s100: '#dcebff',
  green45s48: '#3caa5a', pink47s67: '#c82878', red54s70: '#dc3545', sky02: '#00060c', sky75s46: '#a0bedc',
  grey20s0: '#323232', indigo29: '#46286e', blue06_060c1a: '#060c1a', indigo18: '#281446', grey30: '#4d4d4d',
  orange56s73: '#e0963c', violet71s44: '#ba96d6', red62s68: '#e06e5a', amber91: '#fff0d2', sky50: '#0075ff',
} as const;

export type PalName = keyof typeof P;
/** The true colours, as spelled (a `#rrggbb` per name). */
export const HEX: { readonly [K in PalName]: `#${string}` } = P;
/** What the interface paints: the mode-resolved custom property for each name. */
export type PalVar = `var(--pal-${string})`;
export const PAL = Object.fromEntries(Object.keys(P).map((k) => [k, `var(--pal-${k})`])) as { readonly [K in PalName]: PalVar };

const VAR = /^var\(--pal-([A-Za-z0-9_]+)\)$/;
/** A palette reference back to its true hex (anything else comes back unchanged): for parsers and data. */
export const hexOf = (c: string): string => {
  const m = VAR.exec(c.trim());
  return m && m[1]! in P ? P[m[1] as PalName] : c;
};

/** A colour at `a` (0..1) opacity, alpha as a field rather than a spelled rgba(): works on a palette
 *  reference (follows the mode, in CSS and through src/ui/canvas-ink.ts) and on a literal colour. */
export const alpha = (c: string, a: number): string => `color-mix(in srgb, ${c} ${+(a * 100).toFixed(2)}%, transparent)`;
