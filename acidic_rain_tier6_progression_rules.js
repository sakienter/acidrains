/* Tavern tiers 1-6, turn-based upgrade discounts, and Awakening Reward. */
window.addEventListener("load", () => {
  const MAX_TAVERN_TIER = 6;
  const BASE_UPGRADE_COSTS = {
    1: 5,
    2: 7,
    3: 8,
    4: 9,
    5: 10,
  };

  function getUpgradeBaseCost(tier = state.tavernTier) {
    return BASE_UPGRADE_COSTS[Number(tier)] ?? null;
  }

  function getUpgradeCost(gameState = state) {
    if (Number(gameState.tavernTier) >= MAX_TAVERN_TIER) return 0;
    const base = getUpgradeBaseCost(gameState.tavernTier);
    if (base == null) return 0;
    return Math.max(0, base - Number(gameState.tavernUpgradeDiscount || 0));
  }

  window.getTavernUpgradeCost = getUpgradeCost;

  function createAwakeningReward() {
    return {
      id: `awakening_reward_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: "覚醒報酬",
      emoji: "🏆",
      tier: 0,
      cost: 0,
      type: "spell",
      token: true,
      text: "現在の自分のTier+1のミニオンを1枚発見する。Tier 6ではTier 6ミニオンを発見する。",
      cast(gameState) {
        const rewardTier = Math.min(MAX_TAVERN_TIER, Number(gameState.tavernTier || 1) + 1);
        const pool = MINIONS.filter(card => Number(card.tier) === rewardTier);
        if (!pool.length) {
          log(`Tier ${rewardTier}のミニオンがカードプールにないため、覚醒報酬は不発だった。`);
          return;
        }
        if (typeof discoverCardsBeyondTier === "function") {
          discoverCardsBeyondTier(gameState, pool, 1, `覚醒報酬：Tier ${rewardTier}ミニオンを発見`);
        } else {
          discoverCards(gameState, pool, 1, `覚醒報酬：Tier ${rewardTier}ミニオンを発見`);
        }
      },
    };
  }

  function grantAwakeningReward(gameState) {
    if (gameState.hand.length >= HAND_LIMIT) {
      log("手札がいっぱいのため、覚醒報酬を受け取れなかった。");
      return false;
    }
    gameState.hand.push(createAwakeningReward());
    log("🏆 覚醒報酬を1枚得た。");
    return true;
  }

  const oldInitialState = initialState;
  initialState = function() {
    oldInitialState();
    state.tavernTier = 1;
    state.tavernUpgradeDiscount = 0;
  };

  if (typeof state.tavernUpgradeDiscount !== "number") {
    state.tavernUpgradeDiscount = 0;
  }

  function authoritativeUpgradeTavern() {
    if (state.gameOver) return false;
    if (state.tavernTier >= MAX_TAVERN_TIER) {
      log("酒場Tierは最大です。");
      return false;
    }

    const cost = getUpgradeCost(state);
    if (state.gold < cost) {
      log(`酒場アップには${cost}コイン必要です。`);
      return false;
    }

    state.gold -= cost;
    state.tavernTier += 1;
    state.tavernUpgradeDiscount = 0;
    state.frozen = false;
    drawShop();
    updateAuras();
    log(`酒場をTier ${state.tavernTier}に上げた。次のアップグレード費用は基本値に戻った。`);
    render();
    return true;
  }

  upgradeTavern = authoritativeUpgradeTavern;

  // The original click listener captured an older function reference.
  upgradeBtn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    authoritativeUpgradeTavern();
  }, true);

  const oldEndTurn = endTurn;
  endTurn = function() {
    const beforeTurn = state.turn;
    const beforeTier = state.tavernTier;
    const result = oldEndTurn();
    if (state.turn > beforeTurn && !state.gameOver && state.tavernTier === beforeTier && state.tavernTier < MAX_TAVERN_TIER) {
      state.tavernUpgradeDiscount = Number(state.tavernUpgradeDiscount || 0) + 1;
      render();
    }
    return result;
  };

  const oldPlayHandCardToSlot = playHandCardToSlot;
  playHandCardToSlot = function(index, targetIndex) {
    const card = state.hand[index];
    const wasAwakenedMinion = Boolean(card && card.type !== "spell" && card.awakened);
    const result = oldPlayHandCardToSlot(index, targetIndex);
    if (result && wasAwakenedMinion) {
      grantAwakeningReward(state);
      render();
    }
    return result;
  };

  const oldRenderHud = renderHud;
  renderHud = function() {
    oldRenderHud();
    tavernTierValueEl.textContent = state.tavernTier;

    if (state.tavernTier >= MAX_TAVERN_TIER) {
      upgradeBtn.disabled = true;
      upgradeBtn.textContent = "酒場 最大（Tier 6）";
      upgradeBtn.title = "これ以上アップグレードできません。";
    } else {
      const nextTier = state.tavernTier + 1;
      const baseCost = getUpgradeBaseCost(state.tavernTier);
      const cost = getUpgradeCost(state);
      upgradeBtn.disabled = state.gameOver;
      upgradeBtn.textContent = `酒場 ${state.tavernTier} → ${nextTier} (${cost})`;
      upgradeBtn.title = `基本コスト ${baseCost} / ターン割引 ${state.tavernUpgradeDiscount || 0}`;
    }
  };

  render();
}, { once: true });
