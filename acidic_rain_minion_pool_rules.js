/*
 * Finite same-name minion pool.
 *
 * Each Tavern-tier minion starts with the configured number of copies.
 * Minions offered in the shop are removed from the pool, unbought shop minions
 * return on refresh, and sold minions return all pool copies they contain.
 */
(() => {
  if (window.__acidMinionPoolRulesApplied) return;
  window.__acidMinionPoolRulesApplied = true;

  const COPIES_BY_TIER = Object.freeze({
    1: 16,
    2: 15,
    3: 13,
    4: 11,
    5: 9,
    6: 7,
  });
  const HOLDINGS = "__minionPoolHoldings";
  const RETURNED = "__minionPoolReturned";
  const PENDING = "__minionPoolReservationPending";

  const tierOf = card => Math.max(1, Math.min(6, Number(card?.tier) || 1));
  const poolKeyOf = card => String(card?.poolKey || card?.name || card?.id || "").trim();
  const isMinion = card => Boolean(card && card.type !== "spell" && poolKeyOf(card));

  function canonicalTemplates() {
    const templates = new Map();
    (Array.isArray(MINIONS) ? MINIONS : []).forEach(card => {
      if (!isMinion(card)) return;
      templates.set(poolKeyOf(card), card);
    });
    return templates;
  }

  function initializePool(gameState = state) {
    const remaining = Object.create(null);
    const maximum = Object.create(null);
    canonicalTemplates().forEach((card, key) => {
      const copies = COPIES_BY_TIER[tierOf(card)] || 0;
      remaining[key] = copies;
      maximum[key] = copies;
    });
    gameState.minionPoolRemaining = remaining;
    gameState.minionPoolMaximum = maximum;
  }

  function ensurePool(gameState = state) {
    if (!gameState.minionPoolRemaining || !gameState.minionPoolMaximum) {
      initializePool(gameState);
    }
  }

  function availableCopies(card, gameState = state) {
    ensurePool(gameState);
    return Math.max(0, Number(gameState.minionPoolRemaining[poolKeyOf(card)]) || 0);
  }

  function holdingsOf(card) {
    const source = card?.[HOLDINGS];
    return source && typeof source === "object" ? source : null;
  }

  function markHolding(card, key, count = 1) {
    if (!card || !key || count <= 0) return card;
    const holdings = { ...(holdingsOf(card) || {}) };
    holdings[key] = (Number(holdings[key]) || 0) + count;
    card[HOLDINGS] = holdings;
    card[RETURNED] = false;
    return card;
  }

  function takeSpecificCopy(card, gameState = state, pendingForGain = false) {
    if (!isMinion(card)) return null;
    ensurePool(gameState);
    const key = poolKeyOf(card);
    const remaining = availableCopies(card, gameState);
    if (remaining <= 0) return null;
    gameState.minionPoolRemaining[key] = remaining - 1;
    const copy = markHolding(cloneCard(card), key, 1);
    if (pendingForGain) copy[PENDING] = true;
    return copy;
  }

  function takeRandomCopy(cards, gameState = state, pendingForGain = false) {
    ensurePool(gameState);
    const templates = new Map();
    (cards || []).forEach(card => {
      if (isMinion(card)) templates.set(poolKeyOf(card), card);
    });

    const entries = [...templates.entries()]
      .map(([key, card]) => ({ key, card, copies: availableCopies(card, gameState) }))
      .filter(entry => entry.copies > 0);
    const total = entries.reduce((sum, entry) => sum + entry.copies, 0);
    if (total <= 0) return null;

    let roll = Math.floor(Math.random() * total);
    let selected = entries[entries.length - 1];
    for (const entry of entries) {
      if (roll < entry.copies) {
        selected = entry;
        break;
      }
      roll -= entry.copies;
    }

    gameState.minionPoolRemaining[selected.key] -= 1;
    const copy = markHolding(cloneCard(selected.card), selected.key, 1);
    if (pendingForGain) copy[PENDING] = true;
    return copy;
  }

  function returnCardCopies(card, gameState = state) {
    if (!card || card[RETURNED]) return false;
    const holdings = holdingsOf(card);
    if (!holdings) return false;
    ensurePool(gameState);

    Object.entries(holdings).forEach(([key, count]) => {
      const maximum = Number(gameState.minionPoolMaximum[key]) || 0;
      const current = Number(gameState.minionPoolRemaining[key]) || 0;
      gameState.minionPoolRemaining[key] = Math.min(maximum, current + Math.max(0, Number(count) || 0));
    });
    card[RETURNED] = true;
    return true;
  }

  function returnShopCopies(gameState = state) {
    (gameState.shop || []).forEach(card => {
      if (isMinion(card)) returnCardCopies(card, gameState);
    });
  }

  function minionOnlyPool(pool) {
    return Array.isArray(pool) && pool.length > 0 && pool.every(isMinion);
  }

  const inheritedWeightedMinion = createWeightedMinionCard;
  createWeightedMinionCard = function(pool) {
    if (minionOnlyPool(pool)) return takeRandomCopy(pool, state);
    return inheritedWeightedMinion(pool);
  };

  const inheritedSpecificShopCard = createSpecificShopCard;
  createSpecificShopCard = function(pool) {
    if (minionOnlyPool(pool)) return takeRandomCopy(pool, state);
    return inheritedSpecificShopCard(pool);
  };

  const inheritedDrawShop = drawShop;
  drawShop = function() {
    ensurePool(state);
    if (!state.frozen) returnShopCopies(state);
    return inheritedDrawShop();
  };

  const inheritedSetupRun = setupRun;
  setupRun = function() {
    state.shop = [];
    initializePool(state);
    return inheritedSetupRun();
  };

  const inheritedSellBoardCard = sellBoardCard;
  sellBoardCard = function(index) {
    const sold = state.board?.[index] || null;
    const result = inheritedSellBoardCard(index);
    if (sold && state.board?.[index] !== sold) returnCardCopies(sold, state);
    return result;
  };

  if (typeof gainCardToHand === "function") {
    const inheritedGainCardToHand = gainCardToHand;
    gainCardToHand = function(gameState, card, message) {
      if (!isMinion(card)) {
        return inheritedGainCardToHand(gameState, card, message);
      }

      if (holdingsOf(card)) {
        const copy = { ...card };
        if (card[PENDING]) {
          delete copy[PENDING];
        } else {
          delete copy[HOLDINGS];
          delete copy[RETURNED];
        }
        return inheritedGainCardToHand(gameState, copy, message);
      }

      const reserved = takeSpecificCopy(card, gameState, true);
      if (!reserved) {
        if (typeof log === "function") log(`${card.name} はミニオンプールに残っていない。`);
        return false;
      }
      const result = inheritedGainCardToHand(gameState, reserved, message);
      if (!result) returnCardCopies(reserved, gameState);
      return result;
    };
  }

  if (typeof availablePool === "function") {
    const inheritedAvailablePool = availablePool;
    availablePool = function() {
      return inheritedAvailablePool().filter(card => !isMinion(card) || availableCopies(card, state) > 0);
    };
  }

  if (typeof discoverCards === "function") {
    const inheritedDiscoverCards = discoverCards;
    discoverCards = function(gameState, pool, count, title) {
      let completed = 0;
      for (let index = 0; index < count; index += 1) {
        const available = (pool || []).filter(card => !isMinion(card) || availableCopies(card, gameState) > 0);
        if (!available.length) break;
        inheritedDiscoverCards(gameState, available, 1, title);
        completed += 1;
      }
      return completed;
    };
  }

  if (typeof gainRandomMinionToHand === "function") {
    gainRandomMinionToHand = function(gameState, predicate, message) {
      const pool = MINIONS.filter(card =>
        card.tier <= Math.max(gameState.tavernTier, 1) &&
        predicate(card) &&
        availableCopies(card, gameState) > 0
      );
      if (!pool.length) return false;
      return gainCardToHand(gameState, takeRandomCopy(pool, gameState, true), message);
    };
  }

  if (typeof gainRandomCardToHand === "function") {
    gainRandomCardToHand = function(gameState, predicate, message) {
      const pool = availablePool().filter(card => predicate(card));
      if (!pool.length) return false;
      const minions = pool.filter(isMinion);
      const spells = pool.filter(card => !isMinion(card));
      const weighted = [
        ...minions.flatMap(card => Array(availableCopies(card, gameState)).fill(card)),
        ...spells,
      ];
      const selected = weighted[Math.floor(Math.random() * weighted.length)];
      return gainCardToHand(gameState, selected, message);
    };
  }

  if (typeof rerollShopByDominantTribe === "function") {
    rerollShopByDominantTribe = function(gameState, times) {
      const counts = {};
      gameState.board.filter(Boolean).forEach(card => {
        if (card.tribe && card.tribe !== "なし" && card.tribe !== "育成") {
          counts[card.tribe] = (counts[card.tribe] || 0) + 1;
        }
      });
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (!dominant) return drawShop();
      const pool = MINIONS.filter(card => card.tier <= gameState.tavernTier && card.tribe === dominant);
      const spellPool = SPELLS.filter(card => card.tier <= gameState.tavernTier);
      for (let roll = 0; roll < times; roll += 1) {
        returnShopCopies(gameState);
        gameState.shop = [];
        const count = typeof getBaseShopMinionSlots === "function"
          ? getBaseShopMinionSlots(gameState.tavernTier)
          : Math.min(6, 3 + gameState.tavernTier);
        for (let index = 0; index < count; index += 1) {
          gameState.shop.push(takeRandomCopy(pool, gameState));
        }
        gameState.shop.push(createSpecificShopCard(spellPool));
      }
      return gameState.shop;
    };
  }

  function ownedCards(gameState = state) {
    return [
      ...(gameState.hand || []).filter(Boolean),
      ...(gameState.board || []).slice(2).filter(Boolean),
    ];
  }

  function holdingTotals(cards) {
    const totals = Object.create(null);
    cards.forEach(card => {
      Object.entries(holdingsOf(card) || {}).forEach(([key, count]) => {
        totals[key] = (Number(totals[key]) || 0) + (Number(count) || 0);
      });
    });
    return totals;
  }

  function preserveAwakeningHoldings(beforeTotals, gameState = state) {
    const afterTotals = holdingTotals(ownedCards(gameState));
    const deficits = Object.create(null);
    Object.entries(beforeTotals).forEach(([key, before]) => {
      const missing = (Number(before) || 0) - (Number(afterTotals[key]) || 0);
      if (missing > 0) deficits[key] = missing;
    });

    const wildcard = (MINIONS || []).find(card => card.id === "surprise_elemental" || card.name === "意外精");
    const wildcardKey = wildcard ? poolKeyOf(wildcard) : "";
    const untrackedAwakened = ownedCards(gameState).filter(card => card.awakened && !holdingsOf(card));

    untrackedAwakened.forEach(card => {
      const targetKey = poolKeyOf(card);
      const holdings = {};
      const targetCopies = Math.min(3, Number(deficits[targetKey]) || 0);
      if (targetCopies > 0) {
        holdings[targetKey] = targetCopies;
        deficits[targetKey] -= targetCopies;
      }
      const missingSlots = 3 - targetCopies;
      const wildcardCopies = Math.min(missingSlots, Number(deficits[wildcardKey]) || 0);
      if (wildcardCopies > 0) {
        holdings[wildcardKey] = wildcardCopies;
        deficits[wildcardKey] -= wildcardCopies;
      }
      if (Object.keys(holdings).length) {
        card[HOLDINGS] = holdings;
        card[RETURNED] = false;
      }
    });
  }

  const inheritedRender = render;
  render = function() {
    const beforeTotals = holdingTotals(ownedCards(state));
    const result = inheritedRender();
    preserveAwakeningHoldings(beforeTotals, state);
    return result;
  };

  window.MINION_POOL_COPIES_BY_TIER = COPIES_BY_TIER;
  window.getRemainingMinionCopies = cardOrName => {
    ensurePool(state);
    const key = typeof cardOrName === "string" ? cardOrName : poolKeyOf(cardOrName);
    return Math.max(0, Number(state.minionPoolRemaining[key]) || 0);
  };
  window.returnMinionCopiesToPool = card => returnCardCopies(card, state);

  initializePool(state);
  state.shop = [];
  drawShop();
  render();
})();
