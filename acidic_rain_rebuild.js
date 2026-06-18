/* Clean rebuild layer: keep only the core Acid Rain loop and UI. */
window.addEventListener("load", () => {
  if (window.__acidRebuildApplied) return;
  window.__acidRebuildApplied = true;

  const RAIN_TRIGGER_REROLLS = 4;
  let nextRainInstanceId = 1;

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

  function isAcidRain(card) {
    return Boolean(card && card.id === "acidic_rain_copy");
  }

  function removeLegacyHiddenRain(gameState = state) {
    if (isAcidRain(gameState.board?.[1])) {
      gameState.board[1] = null;
    }
  }

  function syncRainCard(card) {
    if (!isAcidRain(card)) return card;

    card.text = "盤面にある間、4回リロールするたび酒場右端のミニオンのスタッツを得る。";
    card.awakenedText = "盤面にある間、4回リロールするたび酒場右端のミニオンのスタッツを2倍得る。";
    card.rerollThreshold = RAIN_TRIGGER_REROLLS;
    card.rerollProgress = Math.max(0, Math.floor(number(card.rerollProgress))) % RAIN_TRIGGER_REROLLS;

    if (!card.rainInstanceId) {
      card.rainInstanceId = `acid-rain-${nextRainInstanceId}`;
      nextRainInstanceId += 1;
    }

    card.onRerollCount = function(gameState) {
      const threshold = Math.max(1, Math.floor(number(this.rerollThreshold, RAIN_TRIGGER_REROLLS)));
      this.rerollProgress = Math.max(0, Math.floor(number(this.rerollProgress))) + 1;

      while (this.rerollProgress >= threshold) {
        this.rerollProgress -= threshold;
        const target = rightmostShopMinion(gameState);
        const multiplier = this.awakened ? 2 : 1;
        if (!target) continue;

        const gainedAtk = number(target.atk) * multiplier;
        const gainedHp = number(target.hp) * multiplier;
        this.atk = number(this.atk) + gainedAtk;
        this.hp = number(this.hp) + gainedHp;
        this.lastRerollTriggerAt = Date.now();
        this.lastRerollGain = { atk: gainedAtk, hp: gainedHp };

        if (typeof log === "function") {
          log(`${this.name} が入替4回に反応し、+${gainedAtk}/+${gainedHp}を得た。`);
        }
      }
    };

    return card;
  }

  function syncVisibleBoardRain() {
    (state.board || []).forEach((card, index) => {
      if (index < 2) return;
      syncRainCard(card);
    });
  }

  function syncAllRain() {
    removeLegacyHiddenRain(state);
    syncVisibleBoardRain();
    (state.hand || []).forEach(syncRainCard);
  }

  window.syncAcidRainInstance = syncRainCard;
  window.getAcidRainProgress = card => Math.max(0, Math.floor(number(card?.rerollProgress))) % RAIN_TRIGGER_REROLLS;
  window.getAcidRainThreshold = card => Math.max(1, Math.floor(number(card?.rerollThreshold, RAIN_TRIGGER_REROLLS)));

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
    removeLegacyHiddenRain(state);
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
    removeLegacyHiddenRain(state);
    syncAllRain();
    return result;
  };

  const previousPlayHandCardToSlot = playHandCardToSlot;
  playHandCardToSlot = function(index, targetIndex) {
    const source = state.hand?.[index];
    const result = previousPlayHandCardToSlot(index, targetIndex);
    if (result && isAcidRain(source)) {
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
      if (!card || index < 2 || typeof card.onRerollCount !== "function") return;
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
    const visibleRain = (state.board || []).find((card, index) => index >= 2 && isAcidRain(card));
    const boardCount = state.board.filter((card, index) => index >= 2 && Boolean(card)).length;
    const score = number(visibleRain?.atk) * 4 + number(visibleRain?.hp) * 3 + number(state.rerolls) * 2 + boardCount * 3;
    resultBoxEl.classList.add("show");
    resultScoreEl.textContent = `${score} score`;
    resultTextEl.innerHTML = `最終酸性降雨: <strong>${number(visibleRain?.atk)}/${number(visibleRain?.hp)}</strong><br>総リロール: <strong>${number(state.rerolls)}</strong><br>酒場グレード: <strong>${number(state.tavernTier)}</strong>`;
    log("酒場閉店。酸性降雨の結果を集計した。");
    render();
  };

  const style = document.createElement("style");
  style.textContent = `
    #seedStageLabel,
    #seedStageHint,
    #acidRainStatus,
    .board-meta {
      display: none !important;
    }

    .card-reroll-progress-badge {
      position: absolute !important;
      top: 7px !important;
      left: 7px !important;
      z-index: 42 !important;
      min-width: 42px !important;
      height: 23px !important;
      padding: 0 7px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      border: 1px solid rgba(128, 226, 244, .68) !important;
      border-radius: 999px !important;
      background: linear-gradient(180deg, rgba(20, 64, 76, .97), rgba(11, 39, 48, .98)) !important;
      color: #cff7ff !important;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
      font-size: .61rem !important;
      font-weight: 950 !important;
      font-variant-numeric: tabular-nums !important;
      line-height: 1 !important;
      letter-spacing: .02em !important;
      box-shadow: 0 4px 10px rgba(0, 0, 0, .36), 0 0 10px rgba(118, 213, 232, .12) !important;
      pointer-events: none !important;
    }

    .card-reroll-progress-badge::before {
      content: "↻";
      color: #7edcf0;
      font-size: .75rem;
    }

    .card-reroll-progress-badge.awakened {
      border-color: rgba(255, 217, 125, .72) !important;
      background: linear-gradient(180deg, rgba(91, 66, 31, .98), rgba(56, 38, 19, .99)) !important;
      color: #ffe6a7 !important;
    }

    .card-reroll-progress-badge.awakened::before {
      color: #ffd777;
    }

    .card-reroll-progress-badge.just-triggered {
      animation: acid-rain-instance-trigger .72s ease-out both !important;
    }

    @keyframes acid-rain-instance-trigger {
      0% {
        transform: scale(.82);
        filter: brightness(1.8);
        box-shadow: 0 0 0 0 rgba(126, 220, 240, .7), 0 0 22px rgba(126, 220, 240, .65);
      }
      45% {
        transform: scale(1.14);
        box-shadow: 0 0 0 7px rgba(126, 220, 240, .12), 0 0 26px rgba(126, 220, 240, .52);
      }
      100% {
        transform: scale(1);
        filter: brightness(1);
        box-shadow: 0 4px 10px rgba(0, 0, 0, .36), 0 0 10px rgba(118, 213, 232, .12);
      }
    }
  `;
  document.head.appendChild(style);

  function decorateBoardProgress() {
    const nodes = [...document.querySelectorAll("#boardSlots .board-card")];
    nodes.forEach(node => {
      node.querySelector(".card-reroll-progress-badge")?.remove();
      const boardIndex = Number(node.dataset.boardSlot);
      if (!Number.isInteger(boardIndex) || boardIndex < 2) return;

      const card = state.board?.[boardIndex];
      if (!isAcidRain(card)) return;

      syncRainCard(card);
      const badge = document.createElement("div");
      badge.className = "card-reroll-progress-badge";
      if (card.awakened) badge.classList.add("awakened");
      if (Date.now() - number(card.lastRerollTriggerAt) < 900) {
        badge.classList.add("just-triggered");
      }
      badge.textContent = `${getAcidRainProgress(card)}/${getAcidRainThreshold(card)}`;
      badge.title = `${card.name}固有の入替カウント`;
      node.appendChild(badge);
    });
  }

  const previousRender = render;
  render = function() {
    syncAllRain();
    const result = previousRender();
    document.querySelector("#acidRainStatus")?.remove();
    decorateBoardProgress();
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
