/* Ensure one click produces exactly one canonical end-turn execution.
 * This document-level capture runs before older listeners attached directly to the button.
 */
(() => {
  if (window.__acidScoreControllerApplied) return;
  window.__acidScoreControllerApplied = true;

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#endTurnBtn');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (button.disabled || state.gameOver) return;
    window.endTurn();
  }, true);
})();