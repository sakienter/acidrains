/* Persistent rightmost-tavern buffs and visible per-card progress counters. */
window.addEventListener("load", () => {
  const style = document.createElement("style");
  style.textContent = `
    .card-progress-badge {
      position: absolute;
      left: 50%;
      bottom: 42px;
      transform: translateX(-50%);
      z-index: 5;
      min-width: 84px;
      padding: 4px 8px;
      border: 1px solid rgba(255, 241, 167, .72);
      border-radius: 999px;
      color: #fff5b5;
      background: rgba(34, 25, 13, .86);
      box-shadow: 0 0 10px rgba(255, 206, 78, .3);
      font-size: .67rem;
      font-weight: 900;
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
    }

    .shop-rightmost-buff {
      outline: 3px solid rgba(255, 209, 76, .88) !important;
      outline-offset: 3px;
    }

    .shop-rightmost-buff::before {
      content: attr(data-rightmost-buff);
      position: absolute;
      left: 50%;
      bottom: -25px;
      transform: translateX(-50%);
      z-index: 6;
      padding: 4px 9px;
      border-radius: 999px;
      color: #fff0a3;
      background: rgba(69, 43, 8, .94);
      font-size: .7rem;
      font-weight: 900;
      white-space: nowrap;
      box-shadow: 0 0 10px rgba(255, 201, 48, .46);
    }
  `;
  document.head.appendChild(style);

  if (state.rightmostBuffAtk == null) state.rightmostBuffAtk = 0;
  if (state.rightmostBuffHp == null) state.rightmostBuffHp = 0;

  function applyPersistentRightmostBuff() {
    const target = getRightmostShopCard(state);
    if (!target || target.type === "spell") return;

    const desiredAtk = Number(state.rightmostBuffAtk || 0);
    const desiredHp = Number(state.rightmostBuffHp || 0);
    const appliedAtk = Number(target.persistentRightmostBuffAtk || 0);
    const appliedHp = Number(target.persistentRightmostBuffHp || 0);
    const gainAtk = desiredAtk - appliedAtk;
    const gainHp = desiredHp - appliedHp;

    if (gainAtk || gainHp) {
      addStats(target, gainAtk, gainHp);
      target.persistentRightmostBuffAtk = desiredAtk;
      target.persistentRightmostBuffHp = desiredHp;
    }
  }

  function addPersistentRightmostBuff(atk, hp) {
    state.rightmostBuffAtk = Number(state.rightmostBuffAtk || 0) + Number(atk || 0);
    state.rightmostBuffHp = Number(state.rightmostBuffHp || 0) + Number(hp || 0);
    applyPersistentRightmostBuff();
  }

  window.addPersistentRightmostBuff = addPersistentRightmostBuff;

  const engine = MINIONS.find(card => card.id === "engine");
  if (engine) {
    engine.battlecry = function() {
      const amount = A(this, 7, 14);
      addPersistentRightmostBuff(amount, amount);
    };
  }

  const waverling = MINIONS.find(card => card.id === "waverling");
  if (waverling) {
    waverling.onSpellCast = function() {
      const amount = A(this, 3, 6);
      addPersistentRightmostBuff(amount, amount);
    };
  }

  const previousDrawShop = drawShop;
  drawShop = function() {
    const result = previousDrawShop();
    applyPersistentRightmostBuff();
    return result;
  };

  function remainingText(card) {
    if (!card) return "";
    if (card.id === "acidic_rain_copy") {
      const progress = Number(card.rerollProgress || 0) % 4;
      return `発動まで残り ${progress === 0 ? 4 : 4 - progress}回`;
    }
    if (card.id === "elise_minion") {
      const progress = Number(card.rerollProgress || 0) % 6;
      return `獲得まで残り ${progress === 0 ? 6 : 6 - progress}回`;
    }
    if (card.id === "air_revenant") {
      const progress = Number(card.goldProgress || 0) % 7;
      return `発動まで残り ${progress === 0 ? 7 : 7 - progress}G`;
    }
    return "";
  }

  function decorateProgress(container, cards) {
    [...container.children].forEach((node, index) => {
      const card = cards[index];
      node.querySelector(".card-progress-badge")?.remove();
      const text = remainingText(card);
      if (!text) return;
      const badge = document.createElement("div");
      badge.className = "card-progress-badge";
      badge.textContent = text;
      node.appendChild(badge);
    });
  }

  function decorateRightmostShop() {
    [...shopGridEl.children].forEach(node => {
      node.classList.remove("shop-rightmost-buff");
      node.removeAttribute("data-rightmost-buff");
    });

    const target = getRightmostShopCard(state);
    if (!target) return;
    const index = state.shop.indexOf(target);
    const node = shopGridEl.children[index];
    if (!node) return;

    const atk = Number(state.rightmostBuffAtk || 0);
    const hp = Number(state.rightmostBuffHp || 0);
    if (atk || hp) {
      node.classList.add("shop-rightmost-buff");
      node.dataset.rightmostBuff = `永続 +${atk}/+${hp}`;
    }
  }

  const previousRenderBoard = renderBoard;
  renderBoard = function() {
    previousRenderBoard();
    decorateProgress(boardSlotsEl, state.board.slice(2));
  };

  const previousRenderHand = renderHand;
  renderHand = function() {
    previousRenderHand();
    decorateProgress(handGridEl, state.hand.slice(0, HAND_LIMIT));
  };

  const previousRenderShop = renderShop;
  renderShop = function() {
    applyPersistentRightmostBuff();
    previousRenderShop();
    decorateRightmostShop();
  };

  const previousSetupRun = setupRun;
  setupRun = function() {
    const result = previousSetupRun();
    state.rightmostBuffAtk = 0;
    state.rightmostBuffHp = 0;
    applyPersistentRightmostBuff();
    return result;
  };

  applyPersistentRightmostBuff();
  render();
}, { once: true });
