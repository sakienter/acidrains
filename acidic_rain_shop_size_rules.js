/* Shop display-slot counts by Tavern Tier. Card availability still follows Tavern Tier. */
window.addEventListener("load", () => {
  const BASE_MINION_SLOTS = {
    1: 3,
    2: 4,
    3: 4,
    4: 5,
    5: 5,
    6: 6,
  };

  window.getBaseShopMinionSlots = function(tier) {
    const normalizedTier = Math.max(1, Math.min(6, Number(tier || 1)));
    return BASE_MINION_SLOTS[normalizedTier];
  };

  drawShop = function() {
    if (state.frozen) {
      state.shop.forEach(card => {
        if (card) card.frozen = true;
      });
      return;
    }

    const minionPool = MINIONS.filter(card => Number(card.tier) <= Number(state.tavernTier));
    const spellPool = SPELLS.filter(card => Number(card.tier) <= Number(state.tavernTier));
    const elementalPool = minionPool.filter(card => card.tribe === "エレメンタル");

    const minionSlots = window.getBaseShopMinionSlots(state.tavernTier);
    const baseSpellSlots = 1;
    const extraSpellSlots = Math.max(0, Number(state.extraSpellShop || 0));
    const extraElementalSlots = Math.max(0, Number(state.extraElementalShop || 0));

    state.shop = [];

    for (let i = 0; i < minionSlots; i += 1) {
      state.shop.push(createWeightedMinionCard(minionPool));
    }

    for (let i = 0; i < baseSpellSlots; i += 1) {
      state.shop.push(createSpecificShopCard(spellPool));
    }

    for (let i = 0; i < extraSpellSlots; i += 1) {
      state.shop.push(createSpecificShopCard(spellPool));
    }

    for (let i = 0; i < extraElementalSlots; i += 1) {
      state.shop.push(createSpecificShopCard(elementalPool));
    }
  };

  if (state.hasStarted && !state.gameOver) {
    state.frozen = false;
    drawShop();
    render();
  }
}, { once: true });
