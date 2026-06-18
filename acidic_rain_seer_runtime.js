(() => {
  if (window.__acidSeerRuntimeApplied) return;
  window.__acidSeerRuntimeApplied = true;

  const numberValue = value => Number(value || 0);
  const pending = () => Math.max(0, numberValue(state.nextFreeSpellPurchases)) > 0;

  if (typeof buyCard === 'function') {
    const previousBuyCard = buyCard;
    buyCard = function(index) {
      const card = state.shop?.[index] || null;
      if (card?.type !== 'spell' || !pending()) return previousBuyCard(index);
      const oldFlag = Boolean(state.spellDiscountCanReachZero);
      state.spellDiscountCanReachZero = true;
      try {
        return previousBuyCard(index);
      } finally {
        state.spellDiscountCanReachZero = oldFlag;
      }
    };
  }

  if (typeof renderShop === 'function') {
    const previousRenderShop = renderShop;
    renderShop = function() {
      if (!pending()) return previousRenderShop();
      const oldFlag = Boolean(state.spellDiscountCanReachZero);
      state.spellDiscountCanReachZero = true;
      try {
        return previousRenderShop();
      } finally {
        state.spellDiscountCanReachZero = oldFlag;
      }
    };
  }

  if (typeof setupRun === 'function') {
    const previousSetupRun = setupRun;
    setupRun = function() {
      state.nextFreeSpellPurchases = 0;
      const result = previousSetupRun();
      state.nextFreeSpellPurchases = 0;
      return result;
    };
  }

  state.nextFreeSpellPurchases = Math.max(0, numberValue(state.nextFreeSpellPurchases));
  if (typeof render === 'function') render();
})();
