/* Gift cards: starting gift, no awakening, no sell gold, and six unique effects. */

window.GIFT_CARDS = [
  {
    id: "gift_brann", name: "贈り物のブラン", emoji: "🦁", tier: 0, cost: 0,
    atk: 1, hp: 1, tribe: "贈り物", gift: true,
    text: "このカードが自陣にいる限り、自分の雄叫びは2回発動する。",
    aura(gameState) {
      gameState.battlecryMultiplier = Math.max(2, Number(gameState.battlecryMultiplier || 1));
    },
  },
  {
    id: "gift_surfing_finley", name: "贈り物サーフィンレー", emoji: "🏄", tier: 0, cost: 0,
    atk: 1, hp: 1, tribe: "贈り物", gift: true,
    text: "自分がカードを5枚売るたび、贈り物カードを1枚発見する。",
    init(card) { card.sellProgress = Number(card.sellProgress || 0); },
    onAnySell(gameState) {
      this.sellProgress = Number(this.sellProgress || 0) + 1;
      while (this.sellProgress >= 5) {
        this.sellProgress -= 5;
        const pool = window.GIFT_CARDS.filter(card => card.id !== this.id);
        discoverCardsBeyondTier(gameState, pool, 1, "贈り物サーフィンレー：贈り物を発見");
      }
    },
  },
  {
    id: "gift_elise", name: "贈り物エリーズ", emoji: "🗺️", tier: 0, cost: 0,
    atk: 1, hp: 1, tribe: "贈り物", gift: true,
    text: "このカードが自陣にいる限り、自分が6回リロールすると、ランダムなTier 3のカードを1枚得る。",
    init(card) { card.rerollProgress = Number(card.rerollProgress || 0); },
    onRerollCount(gameState) {
      this.rerollProgress = Number(this.rerollProgress || 0) + 1;
      while (this.rerollProgress >= 6) {
        this.rerollProgress -= 6;
        const pool = [
          ...MINIONS.filter(card => Number(card.tier) === 3),
          ...SPELLS.filter(card => Number(card.tier) === 3),
        ];
        gainCardToHand(gameState, randomFrom(pool), "贈り物エリーズがランダムなTier 3カードを届けた。");
      }
    },
  },
  {
    id: "gift_reno", name: "贈り物レノ", emoji: "🎩", tier: 0, cost: 0,
    atk: 1, hp: 1, tribe: "贈り物", gift: true,
    text: "雄叫び：Tier 1、Tier 2、Tier 3のスペルを2枚ずつランダムに得る。",
    battlecry(gameState) {
      [1, 2, 3].forEach(tier => {
        for (let i = 0; i < 2; i += 1) {
          if (gameState.hand.length >= HAND_LIMIT) return;
          const pool = SPELLS.filter(card => Number(card.tier) === tier);
          if (pool.length) gainCardToHand(gameState, randomFrom(pool), `Tier ${tier}スペルを得た。`);
        }
      });
    },
  },
  {
    id: "gift_lantern_larva", name: "贈り物ランタンラーバ", emoji: "🏮", tier: 0, cost: 0,
    atk: 1, hp: 1, tribe: "贈り物", gift: true,
    text: "自分がエレメンタルを売った時、そのカードの未強化コピーを獲得する。（1ターンに1度）",
    onAnySell(gameState, soldCard) {
      if (!soldCard || soldCard.tribe !== "エレメンタル" || this.usedTurn === gameState.turn) return;
      const template = MINIONS.find(card => card.id === soldCard.id);
      if (!template) return;
      if (gainCardToHand(gameState, initializedClone(template), `${soldCard.name} の未強化コピーを得た。`)) {
        this.usedTurn = gameState.turn;
      }
    },
  },
  {
    id: "gift_magicfin", name: "贈り物マジックフィン", emoji: "🐟", tier: 0, cost: 0,
    atk: 1, hp: 1, tribe: "贈り物", gift: true,
    text: "このカードが自陣にいる限り、自分がスペルを買うと、『雄叫び：買ったスペルを発動する。』を持つトークンカードを獲得する。（1ターンに1度）",
    onSpellBought(gameState, boughtSpell) {
      if (!boughtSpell || this.usedTurn === gameState.turn || gameState.hand.length >= HAND_LIMIT) return;
      const storedSpell = initializedClone(boughtSpell);
      const token = {
        id: `magicfin_token_${boughtSpell.id}_${Date.now()}`,
        name: `${boughtSpell.name}のトークン`, emoji: "🪄", tier: 0, cost: 0,
        atk: 1, hp: 1, tribe: "なし", token: true,
        text: `雄叫び：${boughtSpell.name}を発動する。`,
        battlecry(state) {
          if (typeof storedSpell.cast === "function") storedSpell.cast(state);
        },
      };
      if (gainCardToHand(gameState, token, `${boughtSpell.name}を発動するトークンを得た。`)) {
        this.usedTurn = gameState.turn;
      }
    },
  },
];

function addRandomStartingGift(gameState) {
  if (!gameState || gameState.hand.some(card => card && card.gift)) return;
  const gift = initializedClone(randomFrom(window.GIFT_CARDS));
  if (gameState.hand.length < HAND_LIMIT) {
    gameState.hand.push(gift);
    log(`🎁 開始時の贈り物として「${gift.name}」を得た。`);
  }
}

window.addEventListener("load", () => {
  const oldInitialState = initialState;
  initialState = function() {
    oldInitialState();
    addRandomStartingGift(state);
  };

  const oldSellBoardCard = sellBoardCard;
  sellBoardCard = function(index) {
    const card = state.board[index];
    if (!card) return;
    const beforeGold = Number(state.gold || 0);
    const isGift = Boolean(card.gift);
    const result = oldSellBoardCard(index);
    if (isGift) {
      state.gold = beforeGold;
      log("贈り物カードを売ってもコインは得られない。");
      render();
    }
    return result;
  };

  addRandomStartingGift(state);
  updateAuras();
  render();
}, { once: true });
