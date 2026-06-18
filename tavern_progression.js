(() => {
  const MAX_TAVERN_TIER = 6;
  const MAX_GOLD = 10;
  const TAVERN_UPGRADE_BASE_COSTS = Object.freeze({
    1: 5,
    2: 7,
    3: 8,
    4: 9,
    5: 10,
  });

  function getTurnGold(turn) {
    return Math.min(MAX_GOLD, Math.max(1, turn) + 2);
  }

  function getBaseUpgradeCost(tier) {
    return TAVERN_UPGRADE_BASE_COSTS[tier] ?? 0;
  }

  function initializeTavernProgression() {
    state.gold = getTurnGold(state.turn);
    state.tavernUpgradeCost = state.tavernTier < MAX_TAVERN_TIER
      ? getBaseUpgradeCost(state.tavernTier)
      : 0;
  }

  function getCurrentUpgradeCost() {
    if (state.tavernTier >= MAX_TAVERN_TIER) return 0;
    if (!Number.isFinite(state.tavernUpgradeCost)) {
      state.tavernUpgradeCost = getBaseUpgradeCost(state.tavernTier);
    }
    return Math.max(0, state.tavernUpgradeCost);
  }

  function syncTavernHud() {
    const atMaxTier = state.tavernTier >= MAX_TAVERN_TIER;
    const nextTier = Math.min(MAX_TAVERN_TIER, state.tavernTier + 1);
    const upgradeCost = getCurrentUpgradeCost();

    goldValueEl.textContent = state.gold;
    tavernTierValueEl.textContent = state.tavernTier;
    upgradeBtn.disabled = state.gameOver || atMaxTier || state.gold < upgradeCost;
    upgradeBtn.textContent = atMaxTier
      ? "酒場 最大"
      : `酒場 ${state.tavernTier} → ${nextTier} (${upgradeCost})`;
  }

  const originalRender = render;
  render = function renderWithTavernProgression() {
    originalRender();
    syncTavernHud();
  };

  function handleUpgrade(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (state.gameOver) return;
    if (state.tavernTier >= MAX_TAVERN_TIER) {
      log("酒場グレードは最大。");
      render();
      return;
    }

    const cost = getCurrentUpgradeCost();
    if (state.gold < cost) {
      log(`酒場アップには ${cost} ゴールド必要。`);
      render();
      return;
    }

    state.gold -= cost;
    state.tavernTier += 1;
    state.tavernUpgradeCost = state.tavernTier < MAX_TAVERN_TIER
      ? getBaseUpgradeCost(state.tavernTier)
      : 0;

    // 本家と同様、グレードアップだけでは酒場を入れ替えない。
    updateAuras();
    log(`酒場をグレード ${state.tavernTier} に上げた。`);
    render();
  }

  function handleEndTurn(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (state.gameOver) return;

    state.turn += 1;
    if (state.turn > state.maxTurns) {
      finishRun();
      return;
    }

    state.gold = getTurnGold(state.turn);

    if (state.tavernTier < MAX_TAVERN_TIER) {
      state.tavernUpgradeCost = Math.max(0, getCurrentUpgradeCost() - 1);
    }

    if (state.hero?.onTurnStart) {
      state.hero.onTurnStart(state);
    }

    drawShop();
    updateAuras();
    log(`ターン ${state.turn}。所持ゴールドは ${state.gold}。`);
    render();
  }

  function handleRestart(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    setupRun();
    initializeTavernProgression();
    render();
  }

  upgradeBtn.addEventListener("click", handleUpgrade, true);
  endTurnBtn.addEventListener("click", handleEndTurn, true);
  restartBtn.addEventListener("click", handleRestart, true);

  initializeTavernProgression();
  render();
})();
