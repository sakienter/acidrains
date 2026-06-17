/* Drag-arrow targeting for spells that require a specific card target. */
window.addEventListener("load", () => {
  const TARGETED_SPELLS = new Set([
    "chef_recommendation",
    "zerek",
    "awakening",
    "dream_essence",
  ]);

  let activeTargeting = null;
  let suppressClickUntil = 0;

  const style = document.createElement("style");
  style.textContent = `
    .targeting-valid {
      outline: 3px solid rgba(255, 213, 92, .98) !important;
      outline-offset: 4px;
      box-shadow: 0 0 24px rgba(255, 190, 58, .72) !important;
      transform: translateY(-3px);
    }
    .targeting-hover {
      outline-color: rgba(113, 255, 166, 1) !important;
      box-shadow: 0 0 30px rgba(92, 255, 151, .88) !important;
    }
    .targeting-source {
      outline: 3px solid rgba(125, 211, 255, .95) !important;
      outline-offset: 4px;
    }
    #targetingArrowLayer {
      position: fixed;
      inset: 0;
      z-index: 5000;
      pointer-events: none;
      overflow: visible;
    }
    #targetingArrowPath {
      fill: none;
      stroke: #ffd35a;
      stroke-width: 8;
      stroke-linecap: round;
      filter: drop-shadow(0 0 7px rgba(255, 174, 31, .9));
    }
    #targetingArrowHead {
      fill: #ffd35a;
      filter: drop-shadow(0 0 6px rgba(255, 174, 31, .9));
    }
  `;
  document.head.appendChild(style);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "targetingArrowLayer";
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.innerHTML = `
    <defs>
      <marker id="targetingArrowMarker" markerWidth="14" markerHeight="14" refX="11" refY="5" orient="auto" markerUnits="strokeWidth">
        <path id="targetingArrowHead" d="M 0 0 L 12 5 L 0 10 z"></path>
      </marker>
    </defs>
    <path id="targetingArrowPath" marker-end="url(#targetingArrowMarker)"></path>
  `;
  svg.style.display = "none";
  document.body.appendChild(svg);
  const arrowPath = svg.querySelector("#targetingArrowPath");

  function isTargetedSpell(card) {
    return Boolean(card && card.type === "spell" && TARGETED_SPELLS.has(card.id));
  }

  function isValidTarget(card, zone) {
    if (!activeTargeting || !card) return false;
    switch (activeTargeting.spell.id) {
      case "chef_recommendation":
        return (zone === "shop" || zone === "board") &&
          card.type !== "spell" &&
          card.tribe &&
          card.tribe !== "なし" &&
          card.tribe !== "育成" &&
          card.tribe !== "贈り物";
      case "zerek":
        return zone === "board" && card.type !== "spell";
      case "awakening":
        return zone === "board" &&
          card.type !== "spell" &&
          Number(card.tier) === 1 &&
          !card.awakened &&
          !card.gift;
      case "dream_essence":
        return zone === "board" && typeof card.battlecry === "function";
      default:
        return false;
    }
  }

  function getTargetFromElement(element) {
    const shopNode = element?.closest?.(".shop-card[data-shop-index]");
    if (shopNode) {
      const index = Number(shopNode.dataset.shopIndex);
      const card = state.shop[index];
      if (isValidTarget(card, "shop")) return { zone: "shop", index, card, node: shopNode };
    }

    const boardNode = element?.closest?.(".board-card[data-board-slot]");
    if (boardNode) {
      const index = Number(boardNode.dataset.boardSlot);
      const card = state.board[index];
      if (isValidTarget(card, "board")) return { zone: "board", index, card, node: boardNode };
    }
    return null;
  }

  function clearHighlights() {
    document.querySelectorAll(".targeting-valid, .targeting-hover, .targeting-source").forEach(node => {
      node.classList.remove("targeting-valid", "targeting-hover", "targeting-source");
    });
  }

  function refreshHighlights() {
    clearHighlights();
    if (!activeTargeting) return;
    activeTargeting.sourceNode.classList.add("targeting-source");
    document.querySelectorAll(".shop-card[data-shop-index]").forEach(node => {
      const card = state.shop[Number(node.dataset.shopIndex)];
      if (isValidTarget(card, "shop")) node.classList.add("targeting-valid");
    });
    document.querySelectorAll(".board-card[data-board-slot]").forEach(node => {
      const card = state.board[Number(node.dataset.boardSlot)];
      if (isValidTarget(card, "board")) node.classList.add("targeting-valid");
    });
  }

  function updateArrow(x, y) {
    if (!activeTargeting) return;
    const sx = activeTargeting.startX;
    const sy = activeTargeting.startY;
    const dx = x - sx;
    const dy = y - sy;
    const curve = Math.max(40, Math.abs(dx) * 0.25);
    const c1x = sx;
    const c1y = sy - curve * Math.sign(dy || -1);
    const c2x = x;
    const c2y = y + curve * Math.sign(dy || -1);
    arrowPath.setAttribute("d", `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`);
  }

  function beginTargeting(handIndex, sourceNode, event) {
    const spell = state.hand[handIndex];
    if (!isTargetedSpell(spell) || state.gameOver) return false;

    const rect = sourceNode.getBoundingClientRect();
    activeTargeting = {
      handIndex,
      spell,
      sourceNode,
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      hovered: null,
    };

    refreshHighlights();
    if (!document.querySelector(".targeting-valid")) {
      log(`${spell.name} の対象にできるカードがない。`);
      activeTargeting = null;
      clearHighlights();
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    sourceNode.setPointerCapture?.(event.pointerId);
    svg.style.display = "block";
    updateArrow(event.clientX, event.clientY);
    log(`${spell.name}：矢印を対象カードまで伸ばして離してください。`);
    return true;
  }

  function moveTargeting(event) {
    if (!activeTargeting) return;
    event.preventDefault();
    updateArrow(event.clientX, event.clientY);
    document.querySelectorAll(".targeting-hover").forEach(node => node.classList.remove("targeting-hover"));
    const target = getTargetFromElement(document.elementFromPoint(event.clientX, event.clientY));
    activeTargeting.hovered = target;
    if (target) target.node.classList.add("targeting-hover");
  }

  function finishTargeting(event) {
    if (!activeTargeting) return;
    event.preventDefault();
    event.stopPropagation();
    const targeting = activeTargeting;
    const target = getTargetFromElement(document.elementFromPoint(event.clientX, event.clientY));
    activeTargeting = null;
    svg.style.display = "none";
    arrowPath.setAttribute("d", "");
    clearHighlights();
    suppressClickUntil = Date.now() + 500;

    if (!target) {
      log(`${targeting.spell.name} の対象指定をキャンセルした。`);
      render();
      return;
    }

    state.forcedTargetContext = {
      spellId: targeting.spell.id,
      zone: target.zone,
      index: target.index,
      card: target.card,
    };
    try {
      playHandCardToSlot(targeting.handIndex, -1);
    } finally {
      delete state.forcedTargetContext;
    }
  }

  const oldRenderShop = renderShop;
  renderShop = function() {
    oldRenderShop();
    [...shopGridEl.children].forEach((node, index) => {
      node.dataset.shopIndex = index;
    });
  };

  const oldRenderHand = renderHand;
  renderHand = function() {
    oldRenderHand();
    [...handGridEl.children].forEach((node, index) => {
      node.dataset.handIndex = index;
      const card = state.hand[index];
      if (isTargetedSpell(card)) {
        node.draggable = false;
        node.title = "カードから対象へ矢印を伸ばして使用";
      }
    });
  };

  const originalChef = castChefRecommendation;
  castChefRecommendation = function(gameState) {
    const context = gameState.forcedTargetContext;
    if (!context || context.spellId !== "chef_recommendation") return originalChef(gameState);
    const selected = context.card;
    const pool = MINIONS.filter(card => card.tribe === selected.tribe && card.id !== selected.id);
    if (!pool.length) {
      log("同じ種族の別名カードがないため、シェフのおすすめは不発だった。");
      return;
    }
    gainCardToHand(gameState, randomFrom(pool), `${selected.tribe}のカードを1枚得た。`);
  };

  const originalZerek = castZerek;
  castZerek = function(gameState) {
    const context = gameState.forcedTargetContext;
    if (!context || context.spellId !== "zerek") return originalZerek(gameState);
    if (gameState.hand.length >= HAND_LIMIT) {
      log("手札がいっぱいのため、ゼレクは不発だった。");
      return;
    }
    const copy = typeof initializedClone === "function" ? initializedClone(context.card) : cloneCard(context.card);
    delete copy.frozen;
    gameState.hand.push(copy);
    log(`${context.card.name} のコピーを1枚得た。`);
  };

  const originalAwakening = castAwakeningSpell;
  castAwakeningSpell = function(gameState) {
    const context = gameState.forcedTargetContext;
    if (!context || context.spellId !== "awakening") return originalAwakening(gameState);
    const target = context.card;
    target.awakened = true;
    if (target.awakenedText) target.text = target.awakenedText;
    log(`✨ ${target.name} を覚醒させた。`);
  };

  const originalDreamEssence = castDreamEssence;
  castDreamEssence = function(gameState) {
    const context = gameState.forcedTargetContext;
    if (!context || context.spellId !== "dream_essence") return originalDreamEssence(gameState);
    if (typeof context.card.battlecry === "function") context.card.battlecry(gameState);
  };

  document.addEventListener("pointerdown", event => {
    const handNode = event.target.closest?.(".hand-card[data-hand-index]");
    if (!handNode) return;
    const index = Number(handNode.dataset.handIndex);
    if (isTargetedSpell(state.hand[index])) beginTargeting(index, handNode, event);
  }, true);

  document.addEventListener("pointermove", moveTargeting, true);
  document.addEventListener("pointerup", finishTargeting, true);
  document.addEventListener("pointercancel", finishTargeting, true);

  document.addEventListener("click", event => {
    const handNode = event.target.closest?.(".hand-card[data-hand-index]");
    if (!handNode) return;
    const card = state.hand[Number(handNode.dataset.handIndex)];
    if (isTargetedSpell(card) || Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  render();
}, { once: true });
