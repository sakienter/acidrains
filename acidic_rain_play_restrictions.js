/* Shared restrictions that must run before arrow targeting starts. */
(() => {
  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function isTurnLocked(card, gameState) {
    if (card?.lockedUntilTurn === undefined) return false;
    return num(gameState?.turn, 1) <= num(card.lockedUntilTurn);
  }

  window.canPlayAcidCard = (card, gameState = window.state) => {
    if (!card) return false;
    if (isTurnLocked(card, gameState)) return false;
    const unlockTier = Math.max(0, num(card.unlockTier));
    if (!unlockTier) return true;
    return num(gameState?.tavernTier, 1) >= unlockTier;
  };

  window.describeAcidCardLock = (card, gameState = window.state) => {
    if (isTurnLocked(card, gameState)) {
      return `${card.name} は獲得したターンには使用できない。`;
    }
    const unlockTier = Math.max(0, num(card?.unlockTier));
    if (!unlockTier || num(gameState?.tavernTier, 1) >= unlockTier) return '';
    return `${card.name} は酒場グレード${unlockTier}になるまで使用できない。`;
  };

  window.refreshAcidCardUnlocks = gameState => {
    (gameState?.hand || []).forEach(card => {
      if (!card) return;

      if (
        card.lockedUntilTurn !== undefined
        && num(gameState?.turn, 1) > num(card.lockedUntilTurn)
      ) {
        if (card.originalTextBeforeLock !== undefined) {
          card.text = card.originalTextBeforeLock;
          delete card.originalTextBeforeLock;
        }
        delete card.lockedUntilTurn;
      }

      if (!window.canPlayAcidCard(card, gameState)) return;
      if (card.originalTextBeforeUnlock !== undefined) {
        card.text = card.originalTextBeforeUnlock;
        delete card.originalTextBeforeUnlock;
      }
    });
  };

  window.addEventListener('load', () => {
    if (window.__acidPlayRestrictionsInstalled) return;
    window.__acidPlayRestrictionsInstalled = true;

    function handCardFromEvent(event) {
      const node = event.target.closest?.('.hand-card');
      if (!node) return null;
      let index = Number(node.dataset.handIndex);
      if (!Number.isInteger(index)) {
        index = [...(node.parentElement?.children || [])].indexOf(node);
      }
      if (index < 0) return null;
      return { node, index, card: state.hand?.[index] || null };
    }

    function stopLockedCard(event) {
      const entry = handCardFromEvent(event);
      if (!entry?.card || window.canPlayAcidCard(entry.card, state)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (typeof log === 'function') log(window.describeAcidCardLock(entry.card, state));
      if (typeof render === 'function') render();
    }

    document.addEventListener('pointerdown', stopLockedCard, true);
    document.addEventListener('click', stopLockedCard, true);
    window.refreshAcidCardUnlocks(state);
  }, { once: true });
})();