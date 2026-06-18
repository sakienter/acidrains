/* Remove prototype-only starting cards without affecting cards earned in play. */
window.addEventListener('load', () => {
  if (window.__acidLegacyStartingCardsRemoved) return;
  window.__acidLegacyStartingCardsRemoved = true;

  function removeLegacyStartingCards() {
    if (!Array.isArray(state.board)) state.board = [];
    while (state.board.length < 9) state.board.push(null);

    // Slots 0 and 1 are retained as internal offsets because the existing board
    // renderer treats slots 2 through 8 as the seven playable positions.
    state.board[0] = null;
    state.board[1] = null;

    // The prototype granted Acidic Rain for free at the start of every run.
    // Acidic Rain is now a normal Tier 5 card and must be earned normally.
    state.hand = Array.isArray(state.hand)
      ? state.hand.filter(card => card?.id !== 'acidic_rain_copy')
      : [];

    state.seedGrowth = 0;
    state.extraSeedGrowth = 0;
    state.acidRainEchoMultiplier = 0;
  }

  const inheritedInitialState = initialState;
  initialState = function() {
    const result = inheritedInitialState();
    removeLegacyStartingCards();
    return result;
  };

  const inheritedSetupRun = setupRun;
  setupRun = function() {
    const result = inheritedSetupRun();
    removeLegacyStartingCards();
    if (typeof updateAuras === 'function') updateAuras();
    if (typeof render === 'function') render();
    return result;
  };

  removeLegacyStartingCards();
  if (typeof updateAuras === 'function') updateAuras();
  if (typeof render === 'function') render();
}, { once:true });