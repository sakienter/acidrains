/* Triple-combine awakening rules and Surprise Elemental wildcard support. */
window.addEventListener("load", () => {
  const SURPRISE_ID = "surprise_elemental";
  let resolvingAwakening = false;

  const awakeningStyle = document.createElement("style");
  awakeningStyle.textContent = `
    .awakened-card {
      border-color: rgba(255, 220, 92, .98) !important;
      background:
        radial-gradient(circle at 50% 25%, rgba(255, 246, 166, .98), rgba(194, 137, 36, .96) 48%, rgba(73, 45, 12, .98) 76%) !important;
      box-shadow:
        0 0 18px rgba(255, 221, 77, .95),
        0 0 42px rgba(255, 184, 44, .58),
        0 18px 40px rgba(0, 0, 0, .44) !important;
    }

    .awakened-card::after {
      content: "覚醒";
      position: absolute;
      top: 7px;
      right: 7px;
      padding: 3px 7px;
      border: 1px solid rgba(255,255,210,.72);
      border-radius: 999px;
      color: #fff8c7;
      background: linear-gradient(180deg, #c98a12, #74480b);
      font-size: .62rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-shadow: 0 1px 2px rgba(0,0,0,.7);
      z-index: 3;
    }

    .awakened-card .card-tier,
    .awakened-card .cost {
      background: linear-gradient(180deg, #cf961d, #74470a) !important;
      color: #fff5af !important;
    }

    .awakened-card .card-name {
      color: #fff4a8 !important;
      text-shadow: 0 0 9px rgba(255, 219, 74, .82);
    }
  `;
  document.head.appendChild(awakeningStyle);

  function allNormalOwnedMinions() {
    const owned = [];
    state.hand.forEach((card, index) => {
      if (card && card.type !== "spell" && !card.awakened && !card.gift) {
        owned.push({ zone: "hand", index, card });
      }
    });
    state.board.forEach((card, index) => {
      if (index >= 2 && card && card.type !== "spell" && !card.awakened && !card.gift) {
        owned.push({ zone: "board", index, card });
      }
    });
    return owned;
  }

  function removeOwnedEntries(entries) {
    const handIndexes = entries.filter(entry => entry.zone === "hand").map(entry => entry.index).sort((a, b) => b - a);
    const boardIndexes = entries.filter(entry => entry.zone === "board").map(entry => entry.index);
    handIndexes.forEach(index => state.hand.splice(index, 1));
    boardIndexes.forEach(index => { state.board[index] = null; });
  }

  function awakenedCopyFrom(template, consumed) {
    const awakened = initializedClone(template);
    awakened.awakened = true;
    awakened.text = awakened.awakenedText || awakened.text;
    const realCopies = consumed.map(entry => entry.card).filter(card => card.id === template.id);
    if (realCopies.length) {
      awakened.atk = Math.max(...realCopies.map(card => Number(card.atk || 0)));
      awakened.hp = Math.max(...realCopies.map(card => Number(card.hp || 0)));
      awakened.baseAtk = Number(template.atk || awakened.atk || 0);
      awakened.baseHp = Number(template.hp || awakened.hp || 0);
      awakened.bonusAtk = Math.max(0, awakened.atk - awakened.baseAtk);
      awakened.bonusHp = Math.max(0, awakened.hp - awakened.baseHp);
    }
    return awakened;
  }

  function findExactTriple(entries) {
    const groups = new Map();
    entries.forEach(entry => {
      if (entry.card.id === SURPRISE_ID) return;
      if (!groups.has(entry.card.id)) groups.set(entry.card.id, []);
      groups.get(entry.card.id).push(entry);
    });
    for (const [id, group] of groups.entries()) {
      if (group.length >= 3) {
        const template = MINIONS.find(card => card.id === id);
        if (template) return { template, consumed: group.slice(0, 3) };
      }
    }
    return null;
  }

  function findElementalWildcardTriple(entries) {
    const surprises = entries.filter(entry => entry.card.id === SURPRISE_ID);
    if (!surprises.length) return null;
    const elementalGroups = new Map();
    entries.forEach(entry => {
      const card = entry.card;
      if (card.id === SURPRISE_ID || card.tribe !== "エレメンタル") return;
      if (!elementalGroups.has(card.id)) elementalGroups.set(card.id, []);
      elementalGroups.get(card.id).push(entry);
    });
    for (const [id, group] of elementalGroups.entries()) {
      if (group.length >= 2 && surprises.length >= 1) {
        const template = MINIONS.find(card => card.id === id);
        if (template) return { template, consumed: [group[0], group[1], surprises[0]] };
      }
    }
    if (surprises.length >= 2) {
      for (const [id, group] of elementalGroups.entries()) {
        if (group.length >= 1) {
          const template = MINIONS.find(card => card.id === id);
          if (template) return { template, consumed: [group[0], surprises[0], surprises[1]] };
        }
      }
    }
    return null;
  }

  function resolveAllAwakenings() {
    if (resolvingAwakening) return;
    resolvingAwakening = true;
    try {
      let combined = false;
      do {
        combined = false;
        if (state.hand.length >= HAND_LIMIT) break;
        const entries = allNormalOwnedMinions();
        const match = findExactTriple(entries) || findElementalWildcardTriple(entries);
        if (!match) break;
        const awakened = awakenedCopyFrom(match.template, match.consumed);
        removeOwnedEntries(match.consumed);
        state.hand.push(awakened);
        updateAuras();
        log(`✨ ${awakened.name} が覚醒した。`);
        combined = true;
      } while (combined);
    } finally {
      resolvingAwakening = false;
    }
  }

  function decorateAwakened(container, cards) {
    [...container.children].forEach((node, index) => {
      const card = cards[index];
      node.classList.toggle("awakened-card", Boolean(card && card.awakened));
    });
  }

  const priorRenderBoard = renderBoard;
  renderBoard = function() {
    priorRenderBoard();
    decorateAwakened(boardSlotsEl, state.board.slice(2));
  };

  const priorRenderShop = renderShop;
  renderShop = function() {
    priorRenderShop();
    decorateAwakened(shopGridEl, state.shop);
  };

  const priorRenderHand = renderHand;
  renderHand = function() {
    priorRenderHand();
    decorateAwakened(handGridEl, state.hand.slice(0, HAND_LIMIT));
  };

  const priorRender = render;
  render = function() {
    resolveAllAwakenings();
    priorRender();
  };

  const surprise = MINIONS.find(card => card.id === SURPRISE_ID);
  if (surprise) {
    surprise.text = "エレメンタルを覚醒させる際、同名カード1枚分として扱える。（「意外精」を除く）";
    surprise.awakenedText = "このカードは覚醒の代用素材として扱われる。";
    delete surprise.battlecry;
  }

  resolveAllAwakenings();
  render();
}, { once: true });