/* End-turn deathrattles, Reborn repeat, and tavern-tier generation limits. */
window.addEventListener("load", () => {
  // Earlier module wrappers are intentionally superseded by this authoritative
  // end-turn implementation. Keep module reinstalls from wrapping it again.
  window.__tier3EndTurnPatched = true;
  window.__tier4DrakkariPendingEffectsPatched = true;
  window.__tier5EndTurnPatched = true;

  function currentTierPool(gameState, pool) {
    return (pool || []).filter(card => Number(card?.tier || 0) <= Number(gameState.tavernTier || 1));
  }

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

  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function eligible(cards) {
    return (cards || []).filter(card => card && !card.token && card.shopEligible !== false);
  }

  function cloneCardInstance(card) {
    if (!card) return null;
    if (typeof initializedClone === "function") return initializedClone(card);
    if (typeof cloneCard === "function") return cloneCard(card);
    return { ...card };
  }

  function addCard(gameState, template, message = "") {
    if (!template) return false;
    if (gameState.hand.length >= HAND_LIMIT) {
      log("手札がいっぱい。");
      return false;
    }
    if (typeof gainCardToHand === "function") {
      return gainCardToHand(gameState, cloneCardInstance(template), message) !== false;
    }
    gameState.hand.push(cloneCardInstance(template));
    if (message) log(message);
    return true;
  }

  function randomFromPool(pool) {
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function endTurnMultiplier(gameState) {
    const temporary = gameState.drakkariActive ? 2 : 1;
    const permanent = Math.max(1, number(gameState.endTurnMultiplier, 1));
    return Math.max(temporary, permanent);
  }

  function resolveRebound(gameState, multiplier) {
    const pending = Math.max(0, Math.floor(number(gameState.reboundPending)));
    gameState.reboundPending = 0;
    if (!pending) return;

    const history = Array.isArray(gameState.spellHistoryThisTurn)
      ? gameState.spellHistoryThisTurn.filter(card => card?.type === "spell")
      : [];
    if (!history.length) {
      log("リバウンド：このターンに使ったスペルがない。");
      return;
    }

    const total = pending * multiplier * 3;
    let gained = 0;
    for (let index = 0; index < total; index += 1) {
      if (!addCard(gameState, randomFromPool(history), index === 0 ? `リバウンドでスペルを${total}枚得た。` : "")) break;
      gained += 1;
    }
    return gained;
  }

  function resolveSixthSense(gameState, multiplier) {
    const pending = Math.max(0, Math.floor(number(gameState.sixthSensePending)));
    gameState.sixthSensePending = 0;
    if (!pending) return;

    const tier = Math.max(1, Math.min(6, number(gameState.tavernTier, 1)));
    const minionPool = eligible(MINIONS).filter(card => number(card.tier) === tier);
    const spellPool = eligible(SPELLS).filter(card => number(card.tier) === tier);
    const total = pending * multiplier;

    for (let index = 0; index < total; index += 1) {
      addCard(gameState, randomFromPool(minionPool), index === 0 ? `第六感：ティア${tier}ミニオンを得た。` : "");
      addCard(gameState, randomFromPool(spellPool), index === 0 ? `第六感：ティア${tier}スペルを得た。` : "");
    }
  }

  function triggerEndTurnEffects(gameState, triggerCount) {
    for (let i = 0; i < triggerCount; i += 1) {
      notifyBoard("onTurnEnd", gameState);
    }
    if (triggerCount > 1) log(`ドラッカリにより、ターン終了時効果が${triggerCount}回発動した。`);
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

    const multiplier = endTurnMultiplier(state);
    resolveRebound(state, multiplier);
    resolveSixthSense(state, multiplier);
    triggerEndTurnEffects(state, multiplier);
    triggerEndTurnDeathrattles(state);

    state.brannSpellActive = false;
    state.drakkariActive = false;
    state.nextBattlecryMultiplier = 0;

    state.turn += 1;
    if (state.turn > state.maxTurns) {
      finishRun();
      return true;
    }

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