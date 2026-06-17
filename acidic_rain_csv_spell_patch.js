/* Apply authoritative spell definitions from acidcards.csv after the Excel card pool is ready. */
(() => {
  const DEFINITIONS = [
    {
      id: 'chef_recommendation',
      name: 'シェフのおすすめ',
      emoji: '🍽️',
      tier: 2,
      cost: 2,
      text: '酒場または、自分の盤面の種族ありカードに打てる。同名ではない同じ種族のカードをランダムに1枚得る。',
      cast(gameState) {
        /* The arrow-targeting layer resolves the selected target. */
        if (gameState.forcedTargetContext && typeof castChefRecommendation === 'function') {
          castChefRecommendation(gameState);
        }
      }
    },
    {
      id: 'losing_ticket',
      name: 'はずれくじ',
      emoji: '🎟️',
      tier: 2,
      cost: 2,
      text: 'ランダムなティア1カードを1枚得る。',
      cast(gameState) {
        const pool = [
          ...(typeof MINIONS !== 'undefined' ? MINIONS : []),
          ...(typeof SPELLS !== 'undefined' ? SPELLS : [])
        ].filter(card => Number(card?.tier) === 1 && card?.name !== this.name);
        if (!pool.length) {
          log('ティア1カードがないため、はずれくじは不発だった。');
          return;
        }
        const selected = typeof randomFrom === 'function'
          ? randomFrom(pool)
          : pool[Math.floor(Math.random() * pool.length)];
        if (typeof gainCardToHand === 'function') {
          gainCardToHand(gameState, selected, 'ランダムなティア1カードを1枚得た。');
        }
      }
    },
    {
      id: 'careful_investment',
      name: '慎重な投資',
      emoji: '💼',
      tier: 2,
      cost: 1,
      text: '次のターン、2コイン得る。',
      cast(gameState) {
        gameState.nextTurnGoldBonus = Number(gameState.nextTurnGoldBonus || 0) + 2;
      }
    },
    {
      id: 'burst_coin_pouch',
      name: '弾けたコインポーチ',
      emoji: '👛',
      tier: 2,
      cost: 1,
      text: '3ゴールド得る。次のターンの開始時2ゴールド失う。',
      cast(gameState) {
        const cap = Math.max(10, Number(gameState.maxGold || 10));
        gameState.gold = Math.min(cap, Number(gameState.gold || 0) + 3);
        gameState.nextTurnGoldPenalty = Number(gameState.nextTurnGoldPenalty || 0) + 2;
      }
    },
    {
      id: 'catalog_flip',
      name: 'カタログパラパラ',
      emoji: '📖',
      tier: 2,
      cost: 1,
      text: '2回分のリロールコストを0にする。',
      cast(gameState) {
        gameState.freeRerolls = Number(gameState.freeRerolls || 0) + 2;
      }
    }
  ];

  function applyDefinition(definition) {
    let card = SPELLS.find(entry => entry.name === definition.name || entry.id === definition.id);
    if (!card) {
      card = { type: 'spell' };
      SPELLS.push(card);
    }
    Object.assign(card, definition, { type: 'spell' });
  }

  function applyCsvDefinitions() {
    if (typeof SPELLS === 'undefined' || !Array.isArray(SPELLS)) return false;
    DEFINITIONS.forEach(applyDefinition);

    if (typeof state !== 'undefined' && state) {
      const sync = card => {
        if (!card) return;
        const definition = DEFINITIONS.find(entry => entry.name === card.name || entry.id === card.id);
        if (definition) Object.assign(card, definition, { type: 'spell' });
      };
      (state.shop || []).forEach(sync);
      (state.hand || []).forEach(sync);
    }
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const excelReady = typeof MINIONS !== 'undefined' && Array.isArray(MINIONS) &&
      MINIONS.some(card => String(card?.id || '').startsWith('excel_'));
    if (!excelReady && attempts < 200) return;
    clearInterval(timer);
    applyCsvDefinitions();
    if (typeof render === 'function') render();
  }, 25);
})();
