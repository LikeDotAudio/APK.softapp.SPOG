// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** src/domain/true-colour — signal content keeps its TRUE colour (ROAD-3456; owner, 2026-10-31).
 *
 *  Test patterns (TSG), video and scopes are what the operator is judging, so the chroma /
 *  vision modes never touch them; only the interface follows grey / mono / high / low. A
 *  drawing routine for signal content runs inside `withTrueColour(ctx, …)`: while the mark is
 *  on, src/ui/canvas-ink.ts hands that context palette references as their true hex and leaves
 *  every literal colour alone. A whole DOM subtree opts out with `data-true-colour`.
 *  Pure: a mark on the context object, no DOM. */

export const TRUE_COLOUR: unique symbol = Symbol('true-colour');
type Marked = { [TRUE_COLOUR]?: number };

/** Is `ctx` drawing signal content right now? */
export const isTrueColour = (ctx: object): boolean => ((ctx as Marked)[TRUE_COLOUR] ?? 0) > 0;

/** Run `draw` with `ctx` marked as painting signal content (nests). */
export function withTrueColour<T>(ctx: object | null | undefined, draw: () => T): T {
  if (!ctx) return draw();
  const c = ctx as Marked;
  c[TRUE_COLOUR] = (c[TRUE_COLOUR] ?? 0) + 1;
  try { return draw(); } finally { c[TRUE_COLOUR]! -= 1; }
}
