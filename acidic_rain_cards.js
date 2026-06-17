const HEROES = [
  {
    id: "sindragosa",
    name: "シンドラゴサ",
    emoji: "🐉",
    power: "凍結した酒場のカードは、次のターン開始時に +2/+2 を得る。育成前の仕込みが強い。",
    tag: "凍結育成",
    onTurnStart(state) {
      state.shop.forEach((card) => {
        if (card && card.frozen) {
          card.atk += 2;
          card.hp += 2;
        }
      });
    },
  },
  {
    id: "millhouse",
    name: "ミルハウス",
    emoji: "⚡",
    power: "リロールのたびに 1 コイン獲得。テンポを切らさず苗床を加速できる。",
    tag: "高速リロール",
    onReroll(state) {
      state.gold += 1;
    },
  },
  {
    id: "brann",
    name: "ブラン",
    emoji: "🦁",
    power: "雄叫びを持つカードを買うと、その効果が 2 回発動する。酸性降雨本体の伸び幅が大きい。",
    tag: "雄叫び倍化",
    battlecryMultiplier: 2,
  },
];

const EVOLUTION_STAGES = [
  { at: 0, name: "苗床", emoji: "🫧", text: "まだ弱いが、リロールに反応しはじめた。 " },
  { at: 3, name: "腐食胞子", emoji: "🦠", text: "育つたびに酸性降雨へ +1/+1。" },
  { at: 6, name: "毒雨核", emoji: "☣️", text: "育つたびに酸性降雨へ +2/+2。" },
  { at: 9, name: "終末菌床", emoji: "👁️", text: "育つたびに酸性降雨へ +3/+3。" },
];

const MINIONS = [
  {
    emoji: "🔭",
    tier: 1,
    cost: 3,
    id: "scout",
    name: "斥候",
    atk: 1,
    hp: 1,
    text: "売却時: 種族なしミニオンを1枚手札に加える。",
    tribe: "なし",
    onSell(state) {
      gainRandomMinionToHand(state, (card) => card.tribe === "なし" && card.id !== "scout", "斥候が種族なしカードを持ち帰った。");
    },
  },
  {
    id: "sakamaki",
    name: "坂巻風",
    emoji: "🌀",
    tier: 1,
    cost: 3,
    atk: 4,
    hp: 4,
    text: "雄叫び: ランダムなエレメンタルを1枚手札に加える。",
    tribe: "エレメンタル",
    battlecry(state) {
      gainRandomMinionToHand(state, (card) => card.tribe === "エレメンタル" && card.id !== "sakamaki", "坂巻風が新たなエレメンタルを呼び込んだ。");
    },
  },
  {
    id: "okamon",
    name: "おかもん",
    emoji: "🥛",
    tier: 1,
    cost: 3,
    atk: 3,
    hp: 4,
    text: "盤面にある間、酒場にスペルが1枚多く並ぶ。",
    tribe: "エレメンタル",
    aura(state) {
      state.extraSpellShop += 1;
    },
  },
  {
    id: "swapbody",
    name: "入れ替え異常体",
    emoji: "🔀",
    tier: 1,
    cost: 3,
    atk: 2,
    hp: 4,
    text: "雄叫び: 次の2回のリロールを無料にする。",
    tribe: "エレメンタル",
    battlecry(state) {
      state.freeRerolls += 2;
    },
  },
  {
    id: "engine",
    name: "エンジン",
    emoji: "⚙️",
    tier: 1,
    cost: 3,
    atk: 4,
    hp: 4,
    text: "雄叫び: 酒場の右端のカードに +7/+7。",
    tribe: "エレメンタル",
    battlecry(state) {
      const target = getRightmostShopCard(state);
      if (target) {
        target.atk = (target.atk || 0) + 7;
        target.hp = (target.hp || 0) + 7;
      }
    },
  },
  {
    id: "prophet",
    name: "不吉な預言者",
    emoji: "🌑",
    tier: 1,
    cost: 3,
    atk: 2,
    hp: 1,
    text: "雄叫び: 次に買うスペルのコストを1下げる。",
    tribe: "ナーガ",
    battlecry(state) {
      state.nextSpellDiscount += 1;
    },
  },
  {
    id: "snow_elemental",
    name: "雪のエレメンタル",
    emoji: "❄️",
    tier: 1,
    cost: 3,
    atk: 3,
    hp: 3,
    text: "盤面にある間、酒場にエレメンタルが1枚追加で並ぶ。",
    tribe: "エレメンタル",
    aura(state) {
      state.extraElementalShop += 1;
    },
  },
  {
    id: "drake",
    name: "ブルークロマドレイク",
    emoji: "🐲",
    tier: 1,
    cost: 3,
    atk: 3,
    hp: 3,
    text: "雄叫び: Tier1スペルを1枚手札に加える。",
    tribe: "ドラゴン",
    battlecry(state) {
      gainRandomSpellToHand(state, (card) => card.tier === 1, "ブルークロマドレイクが初級スペルを見つけた。");
    },
  },
  {
    id: "wavecaller",
    name: "雪崩のよびて",
    emoji: "🏔️",
    tier: 1,
    cost: 3,
    atk: 3,
    hp: 3,
    text: "雄叫び: 次に売るカードのスタッツを全ての酸性降雨に乗せる。",
    tribe: "エレメンタル",
    battlecry(state) {
      state.pendingSellRainAbsorb += 1;
    },
  },
  {
    id: "rodeo",
    name: "ロデオ名人",
    emoji: "🤠",
    tier: 1,
    cost: 3,
    atk: 4,
    hp: 4,
    text: "雄叫び: ランダムなスペルを1枚手札に加える。",
    tribe: "なし",
    battlecry(state) {
      gainRandomSpellToHand(state, () => true, "ロデオ名人がスペルを披露した。");
    },
  },
  {
    id: "beacon",
    name: "ビーコンオブホープ",
    emoji: "🕯️",
    tier: 1,
    cost: 3,
    atk: 5,
    hp: 5,
    text: "雄叫び: 現在の酒場Tierのカードを1枚手札に加える。",
    tribe: "なし",
    battlecry(state) {
      gainRandomCardToHand(state, (card) => card.tier === state.tavernTier && card.id !== "beacon", "希望の光が同格カードを呼び寄せた。");
    },
  },
  {
    id: "seedling",
    name: "胞子かき混ぜ屋",
    emoji: "🪵",
    tier: 1,
    cost: 3,
    atk: 2,
    hp: 3,
    text: "雄叫び: 苗床の育成値 +1。",
    tribe: "育成",
    battlecry(state) {
      state.seedGrowth += 1;
    },
  },
  {
    id: "recycle",
    name: "リサイクルレイス",
    emoji: "♻️",
    tier: 2,
    cost: 3,
    atk: 5,
    hp: 4,
    text: "盤面にある間、エレメンタルを出すたび次の1回のリロールが無料。",
    tribe: "エレメンタル",
    aura(state) {
      state.elementalRerollBonus += 1;
    },
  },
  {
    id: "seer",
    name: "リロール預言者",
    emoji: "🔮",
    tier: 2,
    cost: 3,
    atk: 2,
    hp: 5,
    text: "盤面にある間、リロール時に追加で苗床が +1 育つ。",
    tribe: "育成",
    aura(state) {
      state.extraSeedGrowth += 1;
    },
  },
  {
    id: "minion_brann",
    name: "ブラン",
    emoji: "🦁",
    tier: 2,
    cost: 3,
    atk: 2,
    hp: 4,
    text: "盤面にある間、自分の雄叫びが2回発動する。",
    tribe: "なし",
    aura(state) {
      state.battlecryMultiplier = Math.max(state.battlecryMultiplier, 2);
    },
  },
  {
    id: "elise_minion",
    name: "エリーズ",
    emoji: "🌿",
    tier: 2,
    cost: 3,
    atk: 5,
    hp: 5,
    text: "盤面にある間、6回リロールするたびTier3カードを1枚手札に加える。",
    tribe: "なし",
    aura(state) {
      state.eliseCopies = Math.max(state.eliseCopies, 1);
    },
  },
  {
    id: "acidic_rain_copy",
    name: "酸性降雨",
    emoji: "🌧️",
    tier: 3,
    cost: 3,
    atk: 6,
    hp: 6,
    text: "盤面にある間、4回リロールするたび酒場右端のスタッツを得る。",
    tribe: "エレメンタル",
    aura(state) {
      state.acidRainEchoMultiplier = Math.max(state.acidRainEchoMultiplier, 1);
    },
  },
];

const SPELLS = [
  {
    id: "fertilizer",
    name: "酸性肥料",
    emoji: "🧪",
    tier: 1,
    cost: 1,
    text: "苗床の育成値 +2。",
    type: "spell",
    cast(state) {
      state.seedGrowth += 2;
    },
  },
  {
    id: "forecast",
    name: "予報更新",
    emoji: "📜",
    tier: 1,
    cost: 1,
    text: "リロールを 1 回無料にする。",
    type: "spell",
    cast(state) {
      state.freeRerolls += 1;
    },
  },
  {
    id: "acidburst",
    name: "酸裂き",
    emoji: "💥",
    tier: 2,
    cost: 2,
    text: "酸性降雨に +4/+4。",
    type: "spell",
    cast(state) {
      buffRain(state, 4, 4);
    },
  },
  {
    id: "germinate",
    name: "培養暴走",
    emoji: "🫗",
    tier: 2,
    cost: 2,
    text: "苗床を即座に 1 段階進化させる。",
    type: "spell",
    cast(state) {
      const next = nextStageThreshold(state.seedGrowth);
      state.seedGrowth = Math.max(state.seedGrowth, next);
    },
  },
  {
    id: "tavernstorm",
    name: "暴風の酒場",
    emoji: "🌪️",
    tier: 3,
    cost: 3,
    text: "酒場の全カードに +3/+3。",
    type: "spell",
    cast(state) {
      state.shop.forEach((card) => {
        if (card) {
          card.atk = (card.atk || 0) + 3;
          card.hp = (card.hp || 0) + 3;
        }
      });
    },
  },
];
