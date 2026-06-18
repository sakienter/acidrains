/* Clean rebuild layer: keep only the core Acid Rain loop and UI. */
window.addEventListener("load", () => {
  if (window.__acidRebuildApplied) return;
  window.__acidRebuildApplied = true;

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function rightmostShopMinion(gameState = state) {
    for (let i = (gameState.shop || []).length - 1; i >= 0; i -= 1) {
      const card = gameState.shop[i];
      if (card && card.type !== "spell") return card;
    }
    return null;
  }

  function syncRainCard(card) {
    if (!card || card.id !== "acidic_rain_copy") return;
    card.text = "盤面にある間、4回リロールするたび酒場右端のミニオンのスタッツを得る。";
    card.awakenedText = "盤面にある間、4回リロールするたび酒場右端のミニオンのスタッツを2倍得る。";
    card.rerollProgress = number(card.rerollProgress);
    card.onRerollCount = function(gameState) {
      this.rerollProgress = number(this.rerollProgress) + 1;
      while (this.rerollProgress >= 4) {
        this.rerollProgress -= 4;
        const target = rightmostShopMinion(gameState);
        const multiplier = this.awakened ? 2 : 1;
        if (!target) continue;
        this.atk = number(this.atk) + number(target.atk) * multiplier;
        this.hp = number(this.hp) + number(target.hp) * multiplier;
      }
    };
  }

  function syncAllRain() {
    (state.board || []).forEach(syncRainCard);
    (state.hand || []).forEach(syncRainCard);
  }

  window.discoverCardsBeyondTier = function(gameState, pool, count, title) {
    return discoverCards(gameState, Array.isArray(pool) ? pool : [], count, title);
  };

  window.gainManyBeyondTier = function(gameState, pool, count, message) {
    let gained = 0;
    const source = Array.isArray(pool) ? pool : [];
    for (let i = 0; i < number(count); i += 1) {
      const selected = source[Math.floor(Math.random() * source.length)];
      if (!selected) break;
      if (gainCardToHand(gameState, selected, gained === 0 ? message : "") === false) break;
      gained += 1;
    }
    return gained;
  };

  const previousInitialState = initialState;
  initialState = function() {
    previousInitialState();
    state.seedGrowth = 0;
    state.maxGold = 10;
    state.__resolvedRerolls = number(state.rerolls);
    syncAllRain();
  };

  growSeed = function() {
    state.seedGrowth = 0;
  };

  const previousSetupRun = setupRun;
  setupRun = function() {
    const result = previousSetupRun();
    state.seedGrowth = 0;
    state.maxGold = number(state.maxGold, 10);
    state.__resolvedRerolls = number(state.rerolls);
    syncAllRain();
    return result;
  };

  const previousPlayHandCardToSlot = playHandCardToSlot;
  playHandCardToSlot = function(index, targetIndex) {
    const source = state.hand?.[index];
    const result = previousPlayHandCardToSlot(index, targetIndex);
    if (result && source?.id === "acidic_rain_copy") {
      syncRainCard(state.board?.[targetIndex]);
    }
    return result;
  };

  function resolveRerollEffects() {
    syncAllRain();
    const resolved = number(state.__resolvedRerolls);
    const current = number(state.rerolls);
    if (current <= resolved) return;
    (state.board || []).forEach((card, index) => {
      if (!card || index < 1 || typeof card.onRerollCount !== "function") return;
      for (let tick = 0; tick < current - resolved; tick += 1) {
        card.onRerollCount(state);
      }
    });
    state.__resolvedRerolls = current;
  }

  rerollShop = function() {
    if (state.gameOver) return false;
    const cost = number(getRerollCost(state));
    if (state.freeRerolls > 0) {
      state.freeRerolls -= 1;
    } else if (state.firstRerollFree) {
      state.firstRerollFree = false;
    } else if (number(state.gold) < cost) {
      log("コインが足りない。");
      render();
      return false;
    }

    state.gold = number(state.gold) - cost;
    state.rerolls = number(state.rerolls) + 1;
    state.frozen = false;
    drawShop();
    updateAuras();
    resolveRerollEffects();
    log("酒場を入れ替えた。");
    render();
    return true;
  };

  finishRun = function() {
    state.gameOver = true;
    const rain = state.board[1];
    const boardCount = state.board.filter(Boolean).length;
    const score = number(rain?.atk) * 4 + number(rain?.hp) * 3 + number(state.rerolls) * 2 + boardCount * 3;
    resultBoxEl.classList.add("show");
    resultScoreEl.textContent = `${score} score`;
    resultTextEl.innerHTML = `最終酸性降雨: <strong>${number(rain?.atk)}/${number(rain?.hp)}</strong><br>総リロール: <strong>${number(state.rerolls)}</strong><br>酒場グレード: <strong>${number(state.tavernTier)}</strong>`;
    log("酒場閉店。酸性降雨の結果を集計した。");
    render();
  };

  const style = document.createElement("style");
  style.textContent = `
    #seedStageLabel, #seedStageHint { display:none !important; }
    .board-meta { min-height: 28px !important; }
    #acidRainStatus {
      display:inline-flex;
      align-items:center;
      padding:4px 10px;
      border-radius:999px;
      background:rgba(18,30,40,.58);
      border:1px solid rgba(125,211,255,.36);
      color:#dff7ff;
      font-size:.75rem;
      font-weight:850;
    }
  `;
  document.head.appendChild(style);

  function ensureRainStatus() {
    let chip = document.querySelector("#acidRainStatus");
    if (chip) return chip;
    chip = document.createElement("span");
    chip.id = "acidRainStatus";
    document.querySelector(".board-meta")?.appendChild(chip);
    return chip;
  }

  function remainingRerolls(card) {
    const progress = number(card?.rerollProgress) % 4;
    return progress === 0 ? 4 : 4 - progress;
  }

  function decorateProgress() {
    const handNodes = [...document.querySelectorAll("#handGrid .hand-card:not(.empty)")];
    handNodes.forEach((node, index) => {
      node.querySelector(".card-progress-badge")?.remove();
      const card = state.hand?.[index];
      if (!card || card.id !== "acidic_rain_copy") return;
      const badge = document.createElement("div");
      badge.className = "card-progress-badge";
      badge.textContent = `発動まで残り ${remainingRerolls(card)}回`;
      node.appendChild(badge);
    });
  }

  const previousRender = render;
  render = function() {
    syncAllRain();
    const result = previousRender();
    document.querySelector("#scoreChip")?.remove();
    const rain = state.board?.[1];
    const chip = ensureRainStatus();
    if (chip && rain) {
      chip.textContent = `酸性降雨 ${number(rain.atk)}/${number(rain.hp)} | 発動まで ${remainingRerolls(rain)}`;
    }
    decorateProgress();
    return result;
  };

  rerollBtn?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    rerollShop();
  }, true);

  syncAllRain();
  render();
}, { once: true });
