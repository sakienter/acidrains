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

  // Ensure the rightmost helper only returns a minion. A spell occupying the
  // visual right edge is skipped, so buffs and Acidic Rain always reference
  // the rightmost minion.
  getRightmostShopCard = function(gameState) {
    for (let i = gameState.shop.length - 1; i >= 0; i -= 1) {
      const card = gameState.shop[i];
      if (card && card.type !== "spell") return card;
    }
    return null;
  };

  render();
}, { once: true });
