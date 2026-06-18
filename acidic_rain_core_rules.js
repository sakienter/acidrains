/* Authoritative core rules for the clean rebuild. */
window.addEventListener('load', () => {
  if (window.__acidCoreRulesApplied) return;
  window.__acidCoreRulesApplied = true;

  const SHOP_MINION_SLOTS = Object.freeze({
    1: 3,
    2: 4,
    3: 4,
    4: 5,
    5: 5,
    6: 6,
  });
  const UPGRADE_COSTS = Object.freeze({ 1: 5, 2: 7, 3: 8, 4: 9, 5: 10 });

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  window.getBaseShopMinionSlots = tier => SHOP_MINION_SLOTS[Math.max(1, Math.min(6, num(tier, 1)))] || 3;
  window.getTavernUpgradeCost = gameState => {
    const base = UPGRADE_COSTS[num(gameState?.tavernTier, 1)] || 0;
    return Math.max(0, base - num(gameState?.tavernUpgradeDiscount));
  };

  window.calculateBoardScore = gameState => (gameState?.board || []).reduce((total, card, index) => {
    if (index < 2 || !card || card.type === 'spell') return total;
    return total + num(card.atk) + num(card.hp);
  }, 0);

  function applyCoreState(gameState) {
    gameState.turn = Math.max(1, num(gameState.turn, 1));
    gameState.tavernTier = Math.max(1, Math.min(6, num(gameState.tavernTier, 1)));
    gameState.gold = 3;
    gameState.maxGold = 3;
    gameState.score = 0;
    gameState.lastTurnScore = 0;
    gameState.tavernUpgradeDiscount = 0;
    gameState.frozen = false;
    gameState.endlessMode = Boolean(gameState.endlessMode);
    gameState.maxTurns = gameState.endlessMode ? Number.MAX_SAFE_INTEGER : 8;
  }

  const inheritedInitialState = initialState;
  initialState = function() {
    const endlessMode = Boolean(state.endlessMode);
    const result = inheritedInitialState();
    state.endlessMode = endlessMode;
    applyCoreState(state);
    return result;
  };

  const inheritedSetupRun = setupRun;
  setupRun = function() {
    const endlessMode = Boolean(state.endlessMode);
    const result = inheritedSetupRun();
    state.endlessMode = endlessMode;
    state.maxTurns = endlessMode ? Number.MAX_SAFE_INTEGER : 8;
    state.gold = 3;
    state.maxGold = 3;
    state.score = 0;
    state.lastTurnScore = 0;
    state.tavernTier = 1;
    state.tavernUpgradeDiscount = 0;
    state.frozen = false;
    drawShop();
    updateAuras();
    render();
    return result;
  };

  drawShop = function() {
    if (state.frozen) {
      (state.shop || []).forEach(card => { if (card) card.frozen = true; });
      return state.shop;
    }

    const tier = Math.max(1, Math.min(6, num(state.tavernTier, 1)));
    const minionPool = MINIONS.filter(card => num(card.tier) <= tier);
    const spellPool = SPELLS.filter(card => num(card.tier) <= tier);
    const minionCount = getBaseShopMinionSlots(tier);
    const nextShop = [];

    for (let index = 0; index < minionCount; index += 1) {
      nextShop.push(createWeightedMinionCard(minionPool));
    }
    nextShop.push(createSpecificShopCard(spellPool));

    for (let index = 0; index < num(state.extraSpellShop); index += 1) {
      nextShop.push(createSpecificShopCard(spellPool));
    }
    const elementalPool = minionPool.filter(card => card.tribe === 'エレメンタル');
    for (let index = 0; index < num(state.extraElementalShop); index += 1) {
      nextShop.push(createSpecificShopCard(elementalPool));
    }

    state.shop = nextShop;
    if (typeof applyEastWindToRightmost === 'function') applyEastWindToRightmost(state);
    return state.shop;
  };

  rerollShop = function() {
    if (state.gameOver) return false;
    const cost = num(getRerollCost(state));
    if (state.freeRerolls > 0) {
      state.freeRerolls -= 1;
    } else if (state.firstRerollFree) {
      state.firstRerollFree = false;
    } else if (num(state.gold) < cost) {
      log('コインが足りない。');
      render();
      return false;
    }

    state.gold = num(state.gold) - cost;
    state.rerolls = num(state.rerolls) + 1;
    state.frozen = false;
    if (state.hero?.onReroll) state.hero.onReroll(state);
    drawShop();
    updateAuras();
    if (typeof notifyGoldSpent === 'function') notifyGoldSpent(cost);
    if (typeof notifyBoard === 'function') notifyBoard('onRerollCount', state);
    state.__resolvedRerolls = num(state.rerolls);
    log('酒場を入れ替えた。');
    render();
    return true;
  };

  upgradeTavern = function() {
    if (state.gameOver) return false;
    if (num(state.tavernTier) >= 6) {
      log('酒場グレードは最大です。');
      render();
      return false;
    }
    const cost = getTavernUpgradeCost(state);
    if (num(state.gold) < cost) {
      log(`酒場アップには${cost}コイン必要です。`);
      render();
      return false;
    }

    state.gold = num(state.gold) - cost;
    state.tavernTier = num(state.tavernTier) + 1;
    state.tavernUpgradeDiscount = 0;
    if (typeof notifyGoldSpent === 'function') notifyGoldSpent(cost);
    if (typeof notifyBoard === 'function') {
      notifyBoard('onTavernUpgrade', state);
      notifyBoard('onTierUp', state);
    }
    updateAuras();
    log(`酒場をグレード${state.tavernTier}に上げた。酒場のカードは入れ替わらない。`);
    render();
    return true;
  };

  let freezeBtn = document.querySelector('#freezeBtn');
  if (!freezeBtn) {
    freezeBtn = document.createElement('button');
    freezeBtn.type = 'button';
    freezeBtn.id = 'freezeBtn';
    freezeBtn.className = 'reroll-chip';
    document.querySelector('.board-actions')?.insertBefore(freezeBtn, endTurnBtn || null);
  }

  function paintFreezeButton() {
    if (!freezeBtn) return;
    freezeBtn.textContent = state.frozen ? 'フリーズ解除' : 'フリーズ';
    freezeBtn.classList.toggle('active-freeze', Boolean(state.frozen));
    freezeBtn.disabled = Boolean(state.gameOver);
  }

  function toggleCoreFreeze() {
    if (state.gameOver) return false;
    state.frozen = !state.frozen;
    (state.shop || []).forEach(card => { if (card) card.frozen = state.frozen; });
    log(state.frozen ? '酒場をフリーズした。次のターンも同じ酒場を保持する。' : 'フリーズを解除した。');
    render();
    return true;
  }

  const inheritedEndTurn = endTurn;
  endTurn = function() {
    if (state.gameOver) return false;
    const beforeTurn = num(state.turn);
    const keepShop = Boolean(state.frozen);
    const frozenShop = keepShop
      ? (state.shop || []).map(card => card ? { ...card, frozen: false } : null)
      : null;

    if (!state.endlessMode && beforeTurn < num(state.maxTurns) && num(state.maxGold) < 10) {
      state.maxGold = num(state.maxGold) + 1;
    } else if (state.endlessMode && num(state.maxGold) < 10) {
      state.maxGold = num(state.maxGold) + 1;
    }

    const result = inheritedEndTurn();
    const advanced = num(state.turn) > beforeTurn;
    if (advanced) {
      const gained = calculateBoardScore(state);
      state.lastTurnScore = gained;
      state.score = num(state.score) + gained;
    }

    if (keepShop && !state.gameOver) {
      state.shop = frozenShop;
      state.frozen = false;
      updateAuras();
      log(`ターン${state.turn}。フリーズした酒場を保持した。`);
    }

    if (state.gameOver) paintFinalResult();
    render();
    return result;
  };

  function paintFinalResult() {
    resultBoxEl.classList.add('show');
    resultScoreEl.textContent = `${num(state.score)} score`;
    resultTextEl.innerHTML = `累計スコア: <strong>${num(state.score)}</strong><br>最終ターン加算: <strong>${num(state.lastTurnScore)}</strong><br>総リロール: <strong>${num(state.rerolls)}</strong><br>酒場グレード: <strong>${num(state.tavernTier)}</strong>`;
  }

  finishRun = function() {
    state.gameOver = true;
    paintFinalResult();
    log('酒場閉店。盤面の攻撃力と体力の合計を集計した。');
    render();
  };

  const inheritedRenderHud = renderHud;
  renderHud = function() {
    const result = inheritedRenderHud();
    const tier = num(state.tavernTier, 1);
    const cost = getTavernUpgradeCost(state);
    upgradeBtn.disabled = Boolean(state.gameOver) || tier >= 6;
    upgradeBtn.textContent = tier >= 6 ? '酒場 最大' : `酒場 ${tier} → ${tier + 1} (${cost})`;
    paintFreezeButton();
    return result;
  };

  function ensureScoreChip() {
    let value = document.querySelector('#scoreValue');
    if (value) return value;
    const chip = document.createElement('span');
    chip.className = 'inline-stat score-stat';
    chip.innerHTML = '<span class="icon">⭐</span><span class="hud-label">スコア</span><strong id="scoreValue">0</strong>';
    document.querySelector('.board-stats')?.appendChild(chip);
    return chip.querySelector('#scoreValue');
  }

  const inheritedRender = render;
  render = function() {
    const result = inheritedRender();
    const scoreValue = ensureScoreChip();
    if (scoreValue) scoreValue.textContent = num(state.score);
    paintFreezeButton();
    return result;
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#upgradeBtn, #rerollBtn, #endTurnBtn, #freezeBtn');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (button.id === 'upgradeBtn') upgradeTavern();
    if (button.id === 'rerollBtn') rerollShop();
    if (button.id === 'endTurnBtn') endTurn();
    if (button.id === 'freezeBtn') toggleCoreFreeze();
  }, true);

  const startPanel = document.querySelector('#gameStartOverlay .game-start-panel');
  const startButton = document.querySelector('#gameStartBtn');
  if (startPanel && startButton && !document.querySelector('#gameModeSelect')) {
    const modeRow = document.createElement('label');
    modeRow.style.display = 'block';
    modeRow.style.margin = '0 auto 20px';
    modeRow.style.color = 'rgba(255,239,205,.86)';
    modeRow.innerHTML = `モード　<select id="gameModeSelect" style="font:inherit;padding:8px 12px;border-radius:10px"><option value="limit">8ターン</option><option value="endless">エンドレス</option></select>`;
    startPanel.insertBefore(modeRow, startButton);
    startButton.addEventListener('click', () => {
      state.endlessMode = modeRow.querySelector('select').value === 'endless';
      state.maxTurns = state.endlessMode ? Number.MAX_SAFE_INTEGER : 8;
      log(state.endlessMode ? 'エンドレスモードを開始しました。' : '8ターンモードを開始しました。');
      render();
    });
  }

  state.gold = 3;
  state.maxGold = 3;
  state.score = num(state.score);
  state.lastTurnScore = 0;
  state.tavernTier = Math.max(1, Math.min(6, num(state.tavernTier, 1)));
  drawShop();

  // Tier 1 installs a drawShop wrapper. Reinstall after the authoritative shop
  // implementation exists so its reroll buffs target the final shop layout.
  window.__tier1DuneDrawShopPatched = false;
  if (window.AcidCardModules?.installed) window.AcidCardModules.reinstall();

  render();
}, { once: true });
