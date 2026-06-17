/* Tier 1 spell implementations. */

function spellRuleTribe(card) {
  if (!card || !card.tribe) return null;
  if (card.tribe === "なし" || card.tribe === "育成") return null;
  return card.tribe;
}

function chooseSpellTarget(entries, title) {
  if (!entries.length) return null;
  const lines = entries.map((entry, index) => {
    const location = entry.zone === "shop" ? "酒場" : "盤面";
    return `${index + 1}. ${entry.card.name}［${entry.card.tribe} / ${location}］`;
  }).join("\n");
  const answer = window.prompt(`${title}\n${lines}\n番号を入力してください。`, "1");
  return entries[Number(answer) - 1] || entries[0];
}

function castChefRecommendation(gameState) {
  const entries = [];
  gameState.shop.forEach((card, index) => {
    if (spellRuleTribe(card)) entries.push({ card, index, zone: "shop" });
  });
  gameState.board.forEach((card, index) => {
    if (card && spellRuleTribe(card)) entries.push({ card, index, zone: "board" });
  });

  const selected = chooseSpellTarget(entries, "シェフのおすすめ：対象を選択");
  if (!selected) {
    log("種族ありカードがないため、シェフのおすすめは不発だった。");
    return;
  }

  const pool = MINIONS.filter(card =>
    card.tribe === selected.card.tribe && card.id !== selected.card.id
  );
  if (!pool.length) {
    log("同じ種族の別名カードがないため、シェフのおすすめは不発だった。");
    return;
  }
  gainCardToHand(gameState, randomFrom(pool), `${selected.card.tribe}のカードを1枚得た。`);
}

function dominantBoardTribes(gameState) {
  const counts = new Map();
  gameState.board.forEach(card => {
    const tribe = spellRuleTribe(card);
    if (tribe) counts.set(tribe, (counts.get(tribe) || 0) + 1);
  });
  if (!counts.size) return [];
  const maximum = Math.max(...counts.values());
  return [...counts.entries()].filter(([, count]) => count === maximum).map(([tribe]) => tribe);
}

function discoverDominantTribeCard(gameState, tierThreeOnly) {
  const tribes = dominantBoardTribes(gameState);
  if (!tribes.length) {
    log("盤面に種族ありカードがないため、発見できなかった。");
    return;
  }

  const pool = MINIONS.filter(card =>
    tribes.includes(card.tribe) && (!tierThreeOnly || card.tier === 3)
  );
  if (!pool.length) {
    log("条件に合うカードがないため、発見できなかった。");
    return;
  }

  const selected = chooseFromCards(
    pool,
    tierThreeOnly ? "万華鏡：Tier3カードを発見" : "望遠鏡：カードを発見"
  );
  if (!selected || gameState.hand.length >= HAND_LIMIT) {
    if (gameState.hand.length >= HAND_LIMIT) log("手札がいっぱい。");
    return;
  }

  const gained = initializedClone(selected);
  if (tierThreeOnly) {
    gained.lockedUntilTurn = gameState.turn;
    gained.originalTextBeforeLock = gained.text || "";
    gained.text = `${gained.originalTextBeforeLock}（このターンは使用不可）`;
  }
  gameState.hand.push(gained);
  log(`${gained.name} を獲得した。`);
}

function gainRandomTierOneCard(gameState) {
  const pool = [
    ...MINIONS.filter(card => card.tier === 1),
    ...SPELLS.filter(card => card.tier === 1),
  ];
  if (!pool.length) return;
  gainCardToHand(gameState, randomFrom(pool), "ランダムなTier1カードを1枚得た。");
}

function applyEastWindToRightmost(gameState) {
  const target = getRightmostShopCard(gameState);
  if (!target) return;
  const stacks = gameState.eastWindStacks || 0;
  const applied = target.eastWindAppliedStacks || 0;
  const difference = stacks - applied;
  if (difference <= 0) return;
  target.atk = (target.atk || 0) + 6 * difference;
  target.hp = (target.hp || 0) + 6 * difference;
  target.eastWindAppliedStacks = stacks;
}

function installTierOneSpellRules() {
  const oldInitialState = initialState;
  initialState = function() {
    oldInitialState();
    state.eastWindStacks = 0;
  };
  if (typeof state.eastWindStacks !== "number") state.eastWindStacks = 0;

  const oldDrawShop = drawShop;
  drawShop = function() {
    const result = oldDrawShop();
    applyEastWindToRightmost(state);
    return result;
  };

  const oldPlayHandCardToSlot = playHandCardToSlot;
  playHandCardToSlot = function(index, targetIndex) {
    const card = state.hand[index];
    if (card && card.lockedUntilTurn >= state.turn) {
      log(`${card.name} はこのターン使用できない。`);
      return false;
    }
    return oldPlayHandCardToSlot(index, targetIndex);
  };

  const oldEndTurn = endTurn;
  endTurn = function() {
    const beforeTurn = state.turn;
    const result = oldEndTurn();
    if (state.turn > beforeTurn) {
      state.hand.forEach(card => {
        if (card && card.lockedUntilTurn < state.turn && card.originalTextBeforeLock !== undefined) {
          card.text = card.originalTextBeforeLock;
          delete card.originalTextBeforeLock;
          delete card.lockedUntilTurn;
        }
      });
      render();
    }
    return result;
  };

  applyEastWindToRightmost(state);
  render();
}

window.addEventListener("load", installTierOneSpellRules, { once: true });
