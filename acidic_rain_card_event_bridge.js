/*
 * Shared bridge between the authoritative game actions and card event hooks.
 * Individual card effects stay in cards/minions/* and cards/spells/*.
 */
window.addEventListener('load', () => {
  if (window.__acidCardEventBridgeInstalled) return;
  window.__acidCardEventBridgeInstalled = true;

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const canPlay = card => {
    if (!card) return false;
    if (typeof window.canPlayAcidCard === 'function') {
      return window.canPlayAcidCard(card, state);
    }
    return num(card.unlockTier) <= num(state.tavernTier, 1);
  };

  const explainLock = card => {
    if (typeof window.describeAcidCardLock === 'function') {
      return window.describeAcidCardLock(card, state);
    }
    return `${card.name} は酒場グレード${num(card.unlockTier)}まで使用できない。`;
  };

  if (typeof buyCard === 'function') {
    const inheritedBuyCard = buyCard;
    buyCard = function(index) {
      const card = state.shop?.[index] || null;
      const beforeGold = num(state.gold);
      const result = inheritedBuyCard(index);
      if (result === false) return result;

      const spent = Math.max(0, beforeGold - num(state.gold));
      if (typeof notifyGoldSpent === 'function') notifyGoldSpent(spent);
      if (card?.type === 'spell' && typeof notifyBoard === 'function') {
        notifyBoard('onSpellBought', state, card);
      }
      if (typeof updateAuras === 'function') updateAuras();
      if (typeof render === 'function') render();
      return result;
    };
  }

  if (typeof playHandCardToSlot === 'function') {
    const inheritedPlayHandCardToSlot = playHandCardToSlot;
    playHandCardToSlot = function(index, targetIndex) {
      const card = state.hand?.[index] || null;
      if (!card) return false;
      if (!canPlay(card)) {
        if (typeof log === 'function') log(explainLock(card));
        if (typeof render === 'function') render();
        return false;
      }

      const wasSpell = card.type === 'spell';
      const doubleCast = wasSpell && num(state.doubleSpellCharges) > 0;
      const result = inheritedPlayHandCardToSlot(index, targetIndex);
      if (!result) return result;

      if (wasSpell) {
        if (doubleCast && typeof card.cast === 'function') {
          state.doubleSpellCharges = Math.max(0, num(state.doubleSpellCharges) - 1);
          card.cast(state);
        }
        if (typeof notifyBoard === 'function') notifyBoard('onSpellCast', state, card);
      } else {
        const played = state.board?.[targetIndex] || null;
        if (played && typeof played.onPlay === 'function') played.onPlay(state);
        if (played?.tribe === 'エレメンタル' && typeof notifyBoard === 'function') {
          notifyBoard('onElementalPlayed', state, played);
        }
      }

      if (typeof updateAuras === 'function') updateAuras();
      if (typeof render === 'function') render();
      return result;
    };
  }

  if (typeof sellBoardCard === 'function') {
    const inheritedSellBoardCard = sellBoardCard;
    sellBoardCard = function(index) {
      const sold = state.board?.[index] || null;
      if (!sold) return false;
      const result = inheritedSellBoardCard(index);

      if (typeof notifyBoard === 'function') {
        notifyBoard('onAnySell', state, sold);
        if (sold.tribe === 'エレメンタル') {
          notifyBoard('onElementalSold', state, sold);
        }
      }
      if (typeof updateAuras === 'function') updateAuras();
      if (typeof render === 'function') render();
      return result;
    };
  }
}, { once: true });
