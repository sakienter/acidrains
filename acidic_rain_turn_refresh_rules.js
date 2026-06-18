/*
 * A new tavern shown at the start of the next turn counts as one tavern
 * replacement when the previous tavern was not frozen.
 */
window.addEventListener('load', () => {
  if (window.__acidTurnRefreshRulesInstalled) return;
  window.__acidTurnRefreshRulesInstalled = true;

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const inheritedEndTurn = endTurn;
  endTurn = function() {
    if (state.gameOver) return false;

    const beforeTurn = num(state.turn, 1);
    const beforeRerolls = num(state.rerolls);
    const wasFrozen = Boolean(state.frozen);
    const willOpenNextTurn = Boolean(
      state.endlessMode || beforeTurn < num(state.maxTurns, beforeTurn)
    );
    const shouldCountRefresh = !wasFrozen && willOpenNextTurn;

    // Increment before the inherited end-turn flow draws the next tavern.
    // This lets drawShop wrappers apply persistent rightmost buffs to the
    // newly opened tavern itself.
    if (shouldCountRefresh) {
      state.rerolls = beforeRerolls + 1;
    }

    const result = inheritedEndTurn();
    const advanced = num(state.turn, beforeTurn) > beforeTurn;

    if (!advanced && shouldCountRefresh) {
      state.rerolls = beforeRerolls;
      return result;
    }

    if (advanced && shouldCountRefresh && !state.gameOver) {
      if (state.hero?.onReroll) state.hero.onReroll(state);
      if (typeof notifyBoard === 'function') notifyBoard('onRerollCount', state);
      state.__resolvedRerolls = num(state.rerolls);
      if (typeof updateAuras === 'function') updateAuras();
      if (typeof log === 'function') {
        log('ターン開始時の新しい酒場を、入替1回として数えた。');
      }
      if (typeof render === 'function') render();
    }

    return result;
  };
}, { once: true });
