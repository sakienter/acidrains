/* Final stat rules: spells have no stats; tavern buffs persist on card instances. */
window.addEventListener("load", () => {
  // Disable the prototype's global 4-reroll milestone. Each Acidic Rain now
  // owns its own persistent reroll counter and reads the current rightmost
  // minion exactly when that individual counter reaches four.
  resolveRerollMilestones = function() {};

  function removeSpellStats(container, cards) {
    [...container.children].forEach((node, index) => {
      const card = cards[index];
      if (!card || card.type !== "spell") return;
      node.querySelector(".stats")?.remove();
      node.querySelector(".stat-bonus")?.remove();
    });
  }

  const previousRenderShop = renderShop;
  renderShop = function() {
    previousRenderShop();
    removeSpellStats(shopGridEl, state.shop);
  };

  const previousRenderHand = renderHand;
  renderHand = function() {
    previousRenderHand();
    removeSpellStats(handGridEl, state.hand.slice(0, HAND_LIMIT));
  };

  // "Rightmost" means the fixed last minion slot for the current tavern grade.
  // When that card is bought, the effect does not move to the card on its left.
  getRightmostShopCard = function(gameState) {
    const tier = Math.max(1, Math.min(6, Number(gameState?.tavernTier || 1)));
    const fallbackSlots = { 1:3, 2:4, 3:4, 4:5, 5:5, 6:6 };
    const slotCount = typeof window.getBaseShopMinionSlots === "function"
      ? window.getBaseShopMinionSlots(tier)
      : fallbackSlots[tier];
    const card = gameState?.shop?.[Math.max(0, Number(slotCount) - 1)] || null;
    return card && card.type !== "spell" ? card : null;
  };

  render();
}, { once: true });