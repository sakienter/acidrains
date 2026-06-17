/* End-turn deathrattles, Reborn repeat, and tavern-tier generation limits. */
window.addEventListener("load", () => {
  function currentTierPool(gameState, pool) {
    return (pool || []).filter(card => Number(card?.tier || 0) <= Number(gameState.tavernTier || 1));
  }

  // Generic Discover effects cannot offer cards above the current tavern tier.
  // Effects that explicitly name a higher tier use discoverCardsBeyondTier.
  const uiDiscoverCards = discoverCards;
  window.discoverCardsBeyondTier = function(gameState, pool, count, title) {
    return uiDiscoverCards(gameState, pool, count, title);
  };
  discoverCards = function(gameState, pool, count, title) {
    return uiDiscoverCards(gameState, currentTierPool(gameState, pool), count, title);
  };

  // Generic random generation follows the same tier restriction.
  const unrestrictedGainMany = gainMany;
  window.gainManyBeyondTier = function(gameState, pool, count, message) {
    return unrestrictedGainMany(gameState, pool, count, message);
  };
  gainMany = function(gameState, pool, count, message) {
    return unrestrictedGainMany(gameState, currentTierPool(gameState, pool), count, message);
  };

  const unrestrictedRandomSpell = gainRandomSpellToHand;
  gainRandomSpellToHand = function(gameState, predicate, message) {
    const cappedPredicate = card =>
      Number(card.tier || 0) <= Number(gameState.tavernTier || 1) && predicate(card);
    return unrestrictedRandomSpell(gameState, cappedPredicate, message);
  };

  const unrestrictedRandomCard = gainRandomCardToHand;
  gainRandomCardToHand = function(gameState, predicate, message) {
    const cappedPredicate = card =>
      Number(card.tier || 0) <= Number(gameState.tavernTier || 1) && predicate(card);
    return unrestrictedRandomCard(gameState, cappedPredicate, message);
  };

  // Explicit text that allows crossing the current tier uses unrestricted helpers.
  const shellWhistler = MINIONS.find(card => card.id === "shell_whistler");
  if (shellWhistler) {
    shellWhistler.onPlay = function(gameState) {
      gainManyBeyondTier(
        gameState,
        SPELLS.filter(card => card.tier === 2),
        A(this, 1, 2),
        "Tier2スペルを得た。"
      );
    };
  }

  const elise = MINIONS.find(card => card.id === "elise_minion");
  if (elise) {
    elise.onRerollCount = function(gameState) {
      this.rerollProgress = (this.rerollProgress || 0) + 1;
      while (this.rerollProgress >= 6) {
        this.rerollProgress -= 6;
        gainManyBeyondTier(
          gameState,
          MINIONS.filter(card => card.tier === 3),
          A(this, 1, 2),
          "エリーズがTier3カードを届けた。"
        );
      }
    };
  }

  const arcadas = MINIONS.find(card => card.id === "arcadas");
  if (arcadas) {
    arcadas.battlecry = function(gameState) {
      gainManyBeyondTier(
        gameState,
        MINIONS.filter(card => card.tier === 2 && card.id !== this.id),
        A(this, 1, 2),
        "Tier2カードを得た。"
      );
    };
  }

  const ghastcoiler = MINIONS.find(card => card.id === "ghastcoiler");
  if (ghastcoiler) {
    ghastcoiler.deathrattle = function(gameState) {
      gainManyBeyondTier(
        gameState,
        MINIONS.filter(card => card.tier <= 2),
        A(this, 3, 6),
        "ガストコイラーの断末魔。"
      );
    };
  }

  const outlands = MINIONS.find(card => card.id === "outlands");
  if (outlands) {
    outlands.battlecry = function(gameState) {
      discoverCardsBeyondTier(
        gameState,
        SPELLS.filter(card => card.tier >= 1 && card.tier <= 3),
        A(this, 1, 2),
        "Tier1～3のスペルを発見"
      );
    };
  }

  function triggerEndTurnDeathrattles(gameState) {
    const deathrattles = gameState.board
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.index >= 2 && entry.card && typeof entry.card.deathrattle === "function");

    deathrattles.forEach(({ card, index }) => {
      const triggerCount = card.reborn ? 2 : 1;
      for (let i = 0; i < triggerCount; i += 1) {
        card.deathrattle(gameState, index);
      }
      log(
        card.reborn
          ? `${card.name} の断末魔が蘇りにより2回発動した。`
          : `${card.name} の断末魔が発動した。`
      );
    });
  }

  function authoritativeEndTurn() {
    if (state.gameOver) return false;

    // Deathrattles resolve while the current turn/shop/board still exists.
    triggerEndTurnDeathrattles(state);

    buffRain(state, 1 + Math.floor(state.tavernTier / 2), 1);
    state.turn += 1;
    if (state.turn > state.maxTurns) {
      finishRun();
      return true;
    }

    const nextTurnBonus = Number(state.nextTurnGoldBonus || 0);
    state.nextTurnGoldBonus = 0;
    state.gold = 10 + nextTurnBonus;

    resetPerTurnCardState();
    if (state.hero?.onTurnStart) state.hero.onTurnStart(state);

    state.frozen = false;
    drawShop();
    updateAuras();
    notifyBoard("onTurnStart", state);

    log(`ターン ${state.turn}。断末魔の解決後、新しい酒場が開いた。`);
    render();
    return true;
  }

  endTurn = authoritativeEndTurn;

  // Older modules registered previous end-turn callbacks. Capture the button
  // event so exactly one authoritative end-turn sequence runs.
  endTurnBtn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    authoritativeEndTurn();
  }, true);

  render();
}, { once: true });
