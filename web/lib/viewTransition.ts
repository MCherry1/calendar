/**
 * View Transitions API helper.
 *
 * Wraps a state-mutating callback in `document.startViewTransition()`
 * so the browser captures the before/after DOM and cross-fades (or
 * morphs named elements) between them. Falls back to plain execution
 * on browsers without support (no animation, no error).
 *
 * Named morphs: elements that should smoothly translate / resize
 * between renders need `view-transition-name: <unique-name>` in CSS.
 * For our case the "today" cell outline and the today-card date label
 * carry names so they morph instead of cross-fading.
 *
 * Browser support (late 2025): Chrome / Edge / Safari / Opera. Firefox
 * shipping behind a flag in current channel.
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 */

type StartViewTransition = (cb: () => void | Promise<void>) => unknown;

export function withViewTransition(update: () => void): void {
  const fn = (document as unknown as { startViewTransition?: StartViewTransition })
    .startViewTransition;
  if (typeof fn === 'function') {
    fn.call(document, update);
  } else {
    update();
  }
}
