/* Tier 5 spell definitions, effects, and lifecycle hooks. */
(() => {
  const modules = window.AcidCardModules;
  const number = value => Number(value || 0);
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;

  function writeLog(message) {
    if (typeof log === 'function' && message) log(message);
  }

  function cloneTemplate(template) {
    if (!template) return null;
    if (typeof initializedClone === 'function') return initializedClone(template);
    if (typeof cloneCard === 'function') return cloneCard(template);
    return { ...template };
  }

  function randomCard(pool) {
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function eligible(cards) {
    return (cards || []).filter(card => card && !card.token && card.shopEligible !== false);
  }

  function addCard(gameState, template, message = '', extra = {}) {
    if (!template) return false;
    if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
      writeLog('手札がいっぱい。');
      return false;
    }

    const copy = { ...cloneTemplate(template), ...extra };
    if (copy.lockedUntilTurn !== undefined && copy.originalTextBeforeLock === undefined) {
      copy.originalTextBeforeLock = copy.text || '';
      copy.text = `${copy.originalTextBeforeLock}（このターンは使用不可）`;
    }

    if (typeof gainCardToHand === 'function') {
      return gainCardToHand(gameState, copy, message) !== false;
    }
    gameState.hand.push(copy);
    writeLog(message);
    return true;
  }

  function discover(gameState, pool, count, title) {
    const candidates = eligible(pool);
    if (!candidates.length) {
      writeLog(`${title}：候補がない。`);
      return 0;
    }
    if (typeof discoverCardsBeyondTier === 'function') {
      discoverCardsBeyondTier(gameState, candidates, count, title);
      return count;
    }
    if (typeof discoverCards === 'function') {
      discoverCards(gameState, candidates, count, title);
      return count;
    }
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, randomCard(candidates), index === 0 ? title : '')) break;
      gained += 1;
    }
    return gained;
  }

  function discoverGrowthScroll(gameState) {
    const tier = Math.max(1, Math.min(6, number(gameState.tavernTier, 1)));
    discover(
      gameState,
      MINIONS.filter(card => number(card.tier) === tier),
      1,
      `成長のスクロール：ティア${tier}ミニオンを発見`,
    );
    discover(
      gameState,
      SPELLS.filter(card => number(card.tier) === tier && card.name !== '成長のスクロール'),
      1,
      `成長のスクロール：ティア${tier}スペルを発見`,
    );
  }

  function discoverKaleidoscope(gameState) {
    const pool = eligible(MINIONS).filter(card => number(card.tier) === 6);
    if (!pool.length) {
      writeLog('万華鏡：ティア6ミニオンが見つからない。');
      return false;
    }

    const selected = typeof chooseFromCards === 'function'
      ? chooseFromCards(pool, '万華鏡：ティア6ミニオンを発見')
      : randomCard(pool);
    if (!selected) return false;
    return addCard(gameState, selected, `${selected.name} を獲得した。`, {
      lockedUntilTurn: number(gameState.turn),
    });
  }

  function gainNamedMinion(gameState, name, message = '') {
    const template = MINIONS.find(card => card?.name === name);
    if (!template) {
      writeLog(`${name} がミニオンプールに見つからない。`);
      return false;
    }
    return addCard(gameState, template, message || `${name} を得た。`);
  }

  function resolveRebound(gameState) {
    let pending = Math.max(0, Math.floor(number(gameState.reboundPending)));
    gameState.reboundPending = 0;
    if (!pending) return 0;
    if (gameState.drakkariActive) pending *= 2;

    const history = Array.isArray(gameState.spellHistoryThisTurn)
      ? gameState.spellHistoryThisTurn.filter(card => card?.type === 'spell')
      : [];
    if (!history.length) {
      writeLog('リバウンド：このターンに使ったスペルがない。');
      return 0;
    }

    let gained = 0;
    const total = pending * 3;
    for (let index = 0; index < total; index += 1) {
      if (!addCard(gameState, randomCard(history), index === 0 ? `リバウンドでスペルを${total}枚得た。` : '')) break;
      gained += 1;
    }
    return gained;
  }

  function triggerDreamEssence(gameState) {
    const predicate = card => card && typeof card.battlecry === 'function';
    if (typeof selectBoardCard === 'function') {
      return selectBoardCard(
        gameState,
        predicate,
        card => card.battlecry(gameState),
        '夢のエッセンス：雄叫びを発動するミニオンを選択',
      );
    }

    const entries = (gameState.board || [])
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.index >= 2 && predicate(entry.card));
    const selected = entries[0];
    if (!selected) {
      writeLog('雄叫びミニオンがいないため、夢のエッセンスは不発だった。');
      return null;
    }
    selected.card.battlecry(gameState);
    return selected.card;
  }

  function highTeaReroll(gameState) {
    const minionPool = eligible(MINIONS).filter(card => number(card.tier) === 5);
    const spellPool = eligible(SPELLS).filter(card => number(card.tier) === 5);
    const minionCount = typeof window.getBaseShopMinionSlots === 'function'
      ? window.getBaseShopMinionSlots(gameState.tavernTier)
      : 5;
    const spellCount = 1 + Math.max(0, number(gameState.extraSpellShop));
    const nextShop = [];

    for (let index = 0; index < minionCount; index += 1) {
      nextShop.push(minionPool.length ? cloneTemplate(randomCard(minionPool)) : null);
    }
    for (let index = 0; index < spellCount; index += 1) {
      nextShop.push(spellPool.length ? cloneTemplate(randomCard(spellPool)) : null);
    }

    gameState.shop = nextShop;
    gameState.frozen = false;
    gameState.rerolls = number(gameState.rerolls) + 1;
    if (gameState.hero?.onReroll) gameState.hero.onReroll(gameState);
    if (typeof notifyBoard === 'function') notifyBoard('onRerollCount', gameState);
    gameState.__resolvedRerolls = number(gameState.rerolls);
    if (typeof applyEastWindToRightmost === 'function') applyEastWindToRightmost(gameState);
    if (typeof applyHallelujahAfterRefresh === 'function') applyHallelujahAfterRefresh(gameState);
    if (typeof updateAuras === 'function') updateAuras();
    writeLog('ハイティー：ティア5カードだけの酒場に入れ替えた。');
    return true;
  }

  const DEFINITIONS = [
    { id: 'growth_scroll', name: '成長のスクロール', emoji: '📜', cost: 4, text: '自分のグレードのミニオン1枚とスペル1枚を発見する。' },
    { id: 'kaleidoscope', name: '万華鏡', emoji: '🔮', cost: 3, text: 'ティア6のミニオンを発見する。それはこのターン使えない。' },
    { id: 'marimo_portrait', name: 'マリモの肖像画', emoji: '🖼️', cost: 5, text: '「酸性降雨」と「エンジン」を1枚ずつ得る。' },
    { id: 'rebound', name: 'リバウンド', emoji: '↩️', cost: 2, text: 'ターンの終了時：このターンに使ったスペルをランダムに3枚得る。' },
    { id: 'dream_essence', name: '夢のエッセンス', emoji: '💭', cost: 3, text: '自陣の雄叫びミニオンを選ぶ。その雄叫びを発動する。' },
    { id: 'flash', name: '閃光', emoji: '⚡', cost: 1, text: '6回分のリロールコストを0にする。' },
    { id: 'high_tea', name: 'ハイティー', emoji: '🫖', cost: 4, text: '酒場をリロールする。そのリロールには、ティア5のカードしか並ばない。' },
  ];

  modules.register({
    kind: 'spell',
    tier: 5,
    label: 'ティア5・スペル',
    definitions: DEFINITIONS,
    effects: {
      '成長のスクロール': () => ({
        cast(gameState) {
          discoverGrowthScroll(gameState);
        },
      }),

      '万華鏡': () => ({
        cast(gameState) {
          discoverKaleidoscope(gameState);
        },
      }),

      'マリモの肖像画': () => ({
        cast(gameState) {
          gainNamedMinion(gameState, '酸性降雨');
          gainNamedMinion(gameState, 'エンジン');
        },
      }),

      'リバウンド': () => ({
        cast(gameState) {
          gameState.reboundPending = number(gameState.reboundPending) + 1;
          writeLog('このターンの終了時に、使用したスペルをランダムに3枚得る。');
        },
      }),

      '夢のエッセンス': () => ({
        cast(gameState) {
          triggerDreamEssence(gameState);
        },
      }),

      '閃光': () => ({
        cast(gameState) {
          gameState.freeRerolls = number(gameState.freeRerolls) + 6;
          writeLog('次の6回のリロールコストが0になった。');
        },
      }),

      'ハイティー': () => ({
        cast(gameState) {
          highTeaReroll(gameState);
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.reboundPending = 0;
        state.spellHistoryThisTurn = [];
      }

      if (!window.__tier5InitialStatePatched && typeof initialState === 'function') {
        window.__tier5InitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          state.reboundPending = 0;
          state.spellHistoryThisTurn = [];
          return result;
        };
      }

      if (!window.__tier5SpellHistoryPatched && typeof playHandCardToSlot === 'function') {
        window.__tier5SpellHistoryPatched = true;
        const previousPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          const source = state.hand?.[index]?.type === 'spell'
            ? cloneTemplate(state.hand[index])
            : null;
          const result = previousPlay(index, targetIndex);
          if (result && source) {
            state.spellHistoryThisTurn = Array.isArray(state.spellHistoryThisTurn)
              ? state.spellHistoryThisTurn
              : [];
            state.spellHistoryThisTurn.push(source);
          }
          return result;
        };
      }

      if (!window.__tier5EndTurnPatched && typeof endTurn === 'function') {
        window.__tier5EndTurnPatched = true;
        const previousEndTurn = endTurn;
        endTurn = function() {
          if (!state.gameOver) resolveRebound(state);
          return previousEndTurn();
        };
      }

      if (!window.__tier5PerTurnResetPatched && typeof resetPerTurnCardState === 'function') {
        window.__tier5PerTurnResetPatched = true;
        const previousReset = resetPerTurnCardState;
        resetPerTurnCardState = function() {
          const result = previousReset();
          state.spellHistoryThisTurn = [];
          return result;
        };
      }

      window.__tier5SpellEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();