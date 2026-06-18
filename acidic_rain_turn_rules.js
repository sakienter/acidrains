/* End-turn deathrattles, Reborn repeat, and tavern-tier generation limits. */
window.addEventListener("load", () => {
  function currentTierPool(gameState, pool) {
    return (pool || []).filter(card => Number(card?.tier || 0) <= Number(gameState.tavernTier || 1));
  }

  // Tier-capping now lives in the authoritative patch to avoid conflicts with
  // later card-module installs and final UI patches.

  const shellWhistler = MINIONS.find(card => card.id === "shell_whistler");
  if (shellWhistler) {
    shellWhistler.onPlay = function(gameState) {
      gainManyBeyondTier(gameState, SPELLS.filter(card => card.tier === 2), A(this, 1, 2), "Tier2スペルを得た。");
    };
  }

  const elise = MINIONS.find(card => card.id === "elise_minion");
  if (elise) {
    elise.onRerollCount = function(gameState) {
      this.rerollProgress = (this.rerollProgress || 0) + 1;
      while (this.rerollProgress >= 6) {
        this.rerollProgress -= 6;
        gainManyBeyondTier(gameState, MINIONS.filter(card => card.tier === 3), A(this, 1, 2), "エリーズがTier3カードを届けた。");
      }
    };
  }

  const arcadas = MINIONS.find(card => card.id === "arcadas");
  if (arcadas) {
    arcadas.battlecry = function(gameState) {
      gainManyBeyondTier(gameState, MINIONS.filter(card => card.tier === 2 && card.id !== this.id), A(this, 1, 2), "Tier2カードを得た。");
    };
  }

  const ghastcoiler = MINIONS.find(card => card.id === "ghastcoiler");
  if (ghastcoiler) {
    ghastcoiler.deathrattle = function(gameState) {
      gainManyBeyondTier(gameState, MINIONS.filter(card => card.tier <= 2), A(this, 3, 6), "ガストコイラーの断末魔。");
    };
  }

  const outlands = MINIONS.find(card => card.id === "outlands");
  if (outlands) {
    outlands.battlecry = function(gameState) {
      discoverCardsBeyondTier(gameState, SPELLS.filter(card => card.tier >= 1 && card.tier <= 3), A(this, 1, 2), "Tier1～3のスペルを発見");
    };
  }

  function triggerEndTurnEffects(gameState) {
    const triggerCount = gameState.drakkariActive ? 2 : 1;
    for (let i = 0; i < triggerCount; i += 1) {
      notifyBoard("onTurnEnd", gameState);
    }
    if (triggerCount > 1) log("ドラッカリにより、ターン終了時効果が2回発動した。");
  }

  function triggerEndTurnDeathrattles(gameState) {
    const deathrattles = gameState.board
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.index >= 2 && entry.card && typeof entry.card.deathrattle === "function");

    deathrattles.forEach(({ card, index }) => {
      const triggerCount = card.reborn ? 2 : 1;
      for (let i = 0; i < triggerCount; i += 1) card.deathrattle(gameState, index);
      log(card.reborn ? `${card.name} の断末魔が蘇りにより2回発動した。` : `${card.name} の断末魔が発動した。`);
    });
  }

  function fallbackBaseGold(turn) {
    return Math.min(10, Math.max(1, Number(turn || 1)) + 2);
  }

  function authoritativeEndTurn() {
    if (state.gameOver) return false;

    triggerEndTurnEffects(state);
    triggerEndTurnDeathrattles(state);

    state.brannSpellActive = false;
    state.drakkariActive = false;
    state.nextBattlecryMultiplier = 0;

    // Acidic Rain grows only through explicit card effects.
    state.turn += 1;
    if (state.turn > state.maxTurns) {
      finishRun();
      return true;
    }

    // The currently offered tavern-upgrade cost is discounted once per new turn.
    state.tavernUpgradeDiscount = Number(state.tavernUpgradeDiscount || 0) + 1;

    const nextTurnBonus = Number(state.nextTurnGoldBonus || 0);
    state.nextTurnGoldBonus = 0;
    state.startingGoldBonus = Math.max(0, Number(state.startingGoldBonus || 0));
    state.baseTurnGold = typeof window.getBaseGoldForTurn === "function"
      ? window.getBaseGoldForTurn(state.turn)
      : fallbackBaseGold(state.turn);
    state.maxGold = state.baseTurnGold + state.startingGoldBonus;
    state.gold = state.maxGold + nextTurnBonus;

    resetPerTurnCardState();
    if (state.hero?.onTurnStart) state.hero.onTurnStart(state);

    state.frozen = false;
    drawShop();
    updateAuras();
    notifyBoard("onTurnStart", state);

    const bonusText = nextTurnBonus > 0 ? `（追加${nextTurnBonus}ゴールド）` : "";
    log(`ターン ${state.turn}。初期ゴールド${state.maxGold}${bonusText}で新しい酒場が開いた。`);
    render();
    return true;
  }

  endTurn = authoritativeEndTurn;

  endTurnBtn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    authoritativeEndTurn();
  }, true);

  render();
}, { once: true });
