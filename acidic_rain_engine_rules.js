/* Correct Engine rule: after each future tavern reroll, buff the new rightmost minion. */
window.addEventListener("load", () => {
  const engine = MINIONS.find(card => card.id === "engine");
  if (engine) {
    engine.text = "雄叫び：この対戦中に酒場を入れ替えた後、その右端のミニオン1体に+7/+7を付与する。";
    engine.awakenedText = "雄叫び：この対戦中に酒場を入れ替えた後、その右端のミニオン1体に+14/+14を付与する。";
    engine.battlecry = function(gameState) {
      const amount = A(this, 7, 14);
      gameState.engineAfterRerollAtk = Number(gameState.engineAfterRerollAtk || 0) + amount;
      gameState.engineAfterRerollHp = Number(gameState.engineAfterRerollHp || 0) + amount;
      log(`エンジン効果を登録：以後、酒場入れ替え後に右端へ +${gameState.engineAfterRerollAtk}/+${gameState.engineAfterRerollHp}。`);
    };
  }

  function applyEngineAfterReroll(gameState) {
    const atk = Number(gameState.engineAfterRerollAtk || 0);
    const hp = Number(gameState.engineAfterRerollHp || 0);
    if (!atk && !hp) return;

    const target = getRightmostShopCard(gameState);
    if (!target || target.type === "spell") return;
    addStats(target, atk, hp);
    target.engineRerollBuffAtk = atk;
    target.engineRerollBuffHp = hp;
  }

  // This replaces the layered prototype reroll wrappers with one authoritative
  // sequence. Engine resolves after the new shop appears and before Acidic
  // Rain / Elise count the reroll, so Acidic Rain sees the buffed final stats.
  function correctedRerollShop() {
    if (state.gameOver) return false;

    const cost = getRerollCost(state);
    if (state.gold < cost) {
      log("コインが足りない。");
      render();
      return false;
    }

    if (state.freeRerolls > 0) {
      state.freeRerolls -= 1;
    } else if (state.firstRerollFree) {
      state.firstRerollFree = false;
    }

    state.gold -= cost;
    state.rerolls += 1;

    if (state.hero?.onReroll) {
      state.hero.onReroll(state);
    }

    const growthGain = 1 + Number(state.extraSeedGrowth || 0);
    growSeed(growthGain);
    state.frozen = false;
    drawShop();
    state.shop.forEach(card => {
      if (card && typeof ensureBaseStats === "function") ensureBaseStats(card);
    });
    updateAuras();

    applyEngineAfterReroll(state);
    notifyGoldSpent(cost);
    notifyBoard("onRerollCount", state);

    log(`酒場を入れ替えた。エンジン効果後、リロールカウントを進めた。`);
    render();
    return true;
  }

  rerollShop = correctedRerollShop;

  // Existing listeners captured older reroll functions. A capture listener
  // takes control while preserving the same visible button used by renderHud.
  rerollBtn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    correctedRerollShop();
  }, true);

  const previousSetupRun = setupRun;
  setupRun = function() {
    const result = previousSetupRun();
    state.engineAfterRerollAtk = 0;
    state.engineAfterRerollHp = 0;
    return result;
  };

  render();
}, { once: true });
