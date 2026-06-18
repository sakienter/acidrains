/* Tier 1 spell definitions, effects, and lifecycle hooks. */
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

  function addCard(gameState, template, message = '') {
    if (!template) return false;
    if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
      writeLog('手札がいっぱい。');
      return false;
    }
    if (typeof gainCardToHand === 'function') {
      return gainCardToHand(gameState, cloneTemplate(template), message) !== false;
    }
    gameState.hand.push(cloneTemplate(template));
    writeLog(message);
    return true;
  }

  function tierOneMinions() {
    return eligible(MINIONS).filter(card => number(card.tier) === 1);
  }

  function addTurnTime(gameState, seconds) {
    const gain = Math.max(0, number(seconds));
    if (!gain) return 0;

    const shouldResume = !gameState.isPaused
      && gameState.hasStarted
      && !gameState.gameOver
      && typeof window.pauseAcidTurnTimer === 'function'
      && typeof window.resumeAcidTurnTimer === 'function';

    if (shouldResume) window.pauseAcidTurnTimer();
    gameState.turnTimeRemaining = Math.max(0, number(gameState.turnTimeRemaining)) + gain;
    gameState.turnTimeLimit = Math.max(number(gameState.turnTimeLimit), gameState.turnTimeRemaining);
    if (shouldResume) window.resumeAcidTurnTimer();

    writeLog(`このターンの残り時間が${gain}秒増えた。`);
    return gain;
  }

  function applyEastWindToRightmost(gameState) {
    const target = [...(gameState.shop || [])].reverse().find(card => card && card.type !== 'spell');
    if (!target) return false;
    const stacks = Math.max(0, number(gameState.eastWindStacks));
    const applied = Math.max(0, number(target.eastWindAppliedStacks));
    const difference = stacks - applied;
    if (difference <= 0) return false;
    target.atk = number(target.atk) + 6 * difference;
    target.hp = number(target.hp) + 6 * difference;
    target.eastWindAppliedStacks = stacks;
    return true;
  }

  window.applyEastWindToRightmost = applyEastWindToRightmost;

  function createAwakeningReward() {
    if (typeof window.createAwakeningRewardSpell === 'function') {
      return window.createAwakeningRewardSpell();
    }
    return {
      id: 'awakening_reward',
      name: '覚醒報酬',
      emoji: '🌟',
      tier: 0,
      cost: 0,
      type: 'spell',
      token: true,
      shopEligible: false,
      text: '現在の酒場グレード+1のミニオンを1体発見する。（グレード6ではグレード6）',
      cast(gameState) {
        const tier = Math.min(6, Math.max(1, number(gameState.tavernTier, 1) + 1));
        const pool = eligible(MINIONS).filter(card => number(card.tier) === tier);
        if (typeof discoverCardsBeyondTier === 'function') {
          discoverCardsBeyondTier(gameState, pool, 1, `覚醒報酬：グレード${tier}のミニオンを発見`);
        } else if (typeof discoverCards === 'function') {
          discoverCards(gameState, pool, 1, `覚醒報酬：グレード${tier}のミニオンを発見`);
        }
      },
    };
  }

  let combiningFragments = false;
  function combineFragments(gameState) {
    if (combiningFragments || !Array.isArray(gameState?.hand)) return false;
    combiningFragments = true;
    let changed = false;
    try {
      while (true) {
        const indexes = gameState.hand
          .map((card, index) => card?.name === '円盤の破片' ? index : -1)
          .filter(index => index >= 0);
        if (indexes.length < 2) break;
        if (gameState.hand.length - 2 + 1 > handLimit()) break;
        gameState.hand.splice(indexes[1], 1);
        gameState.hand.splice(indexes[0], 1);
        gameState.hand.push(createAwakeningReward());
        writeLog('円盤の破片2枚が合体し、「覚醒報酬」になった。');
        changed = true;
      }
    } finally {
      combiningFragments = false;
    }
    return changed;
  }

  function fillTavernWithSpells(gameState) {
    const pool = eligible(SPELLS).filter(card => number(card.tier) <= Math.max(1, number(gameState.tavernTier, 1)));
    if (!pool.length) {
      writeLog('酒場に並べられる呪文がない。');
      return false;
    }

    const currentCount = Math.max(
      1,
      Array.isArray(gameState.shop) && gameState.shop.length
        ? gameState.shop.length
        : (typeof window.getBaseShopMinionSlots === 'function'
          ? window.getBaseShopMinionSlots(gameState.tavernTier) + 1
          : 4),
    );

    gameState.shop = Array.from({ length: currentCount }, () => {
      const card = cloneTemplate(randomCard(pool));
      if (card) card.frozen = false;
      return card;
    });
    gameState.frozen = false;
    writeLog('マジックエリアにより、酒場が呪文で満たされた。');
    return true;
  }

  const DEFINITIONS = [
    { id: 'coin', name: 'コイン', emoji: '🪙', cost: 1, text: '1ゴールド得る。' },
    { id: 'sprout', name: '新芽', emoji: '🌱', cost: 3, text: 'ティア1のミニオンを1枚発見する。' },
    { id: 'recruit', name: '召集', emoji: '📯', cost: 2, text: 'ティア1のミニオンを1枚得る。' },
    { id: 'disk_fragment', name: '円盤の破片', emoji: '💿', cost: 3, text: 'このカードは手札で2枚集めると、合体して消滅し「覚醒報酬」になる。' },
    { id: 'magic_area', name: 'マジックエリア', emoji: '🪄', cost: 2, text: '酒場に呪文を並べる。' },
    { id: 'muddy_water', name: 'どろみず', emoji: '🟤', cost: 1, text: 'このターンの残り時間を5秒追加する。' },
    {
      id: 'east_wind',
      name: '東からの風',
      emoji: '🌬️',
      cost: 1,
      text: 'このゲーム中、酒場の右端のカードは+6/+6を得る。',
      token: true,
      shopEligible: false,
    },
  ];

  modules.register({
    kind: 'spell',
    tier: 1,
    label: 'ティア1・スペル',
    definitions: DEFINITIONS,
    effects: {
      'コイン': () => ({
        cast(gameState) {
          gameState.gold = number(gameState.gold) + 1;
          gameState.goldGainEvents = number(gameState.goldGainEvents) + 1;
          if (typeof notifyBoard === 'function') notifyBoard('onGoldGained', gameState, 1);
          writeLog('コインで1ゴールド得た。');
          return true;
        },
      }),

      '新芽': () => ({
        cast(gameState) {
          const pool = tierOneMinions();
          if (typeof discoverCards === 'function') {
            discoverCards(gameState, pool, 1, '新芽：ティア1ミニオンを発見');
          } else {
            addCard(gameState, randomCard(pool), 'ティア1ミニオンを得た。');
          }
        },
      }),

      '召集': () => ({
        cast(gameState) {
          addCard(gameState, randomCard(tierOneMinions()), 'ランダムなティア1ミニオンを得た。');
        },
      }),

      '円盤の破片': () => ({
        unplayable: true,
        cast() {
          writeLog('円盤の破片は使用できない。手札に2枚集めると自動で合体する。');
          return false;
        },
      }),

      'マジックエリア': () => ({
        cast(gameState) {
          fillTavernWithSpells(gameState);
        },
      }),

      'どろみず': () => ({
        cast(gameState) {
          addTurnTime(gameState, 5);
        },
      }),

      '東からの風': () => ({
        cast(gameState) {
          gameState.eastWindStacks = number(gameState.eastWindStacks) + 1;
          applyEastWindToRightmost(gameState);
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.eastWindStacks = Math.max(0, number(state.eastWindStacks));
        combineFragments(state);
      }

      if (!window.__acidGeneratedCardShopFilterPatched) {
        window.__acidGeneratedCardShopFilterPatched = true;
        if (typeof createSpecificShopCard === 'function') {
          const previousSpecific = createSpecificShopCard;
          createSpecificShopCard = function(pool) {
            return previousSpecific(eligible(pool));
          };
        }
        if (typeof createWeightedMinionCard === 'function') {
          const previousWeighted = createWeightedMinionCard;
          createWeightedMinionCard = function(pool) {
            return previousWeighted(eligible(pool));
          };
        }
      }

      if (!window.__tier1SpellInitialStatePatched && typeof initialState === 'function') {
        window.__tier1SpellInitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          state.eastWindStacks = 0;
          return result;
        };
      }

      if (!window.__tier1SpellDrawShopPatched && typeof drawShop === 'function') {
        window.__tier1SpellDrawShopPatched = true;
        const previousDrawShop = drawShop;
        drawShop = function() {
          const result = previousDrawShop();
          applyEastWindToRightmost(state);
          return result;
        };
      }

      if (!window.__tier1FragmentPlayPatched && typeof playHandCardToSlot === 'function') {
        window.__tier1FragmentPlayPatched = true;
        const previousPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          combineFragments(state);
          const card = state.hand?.[index] || null;
          if (card?.name === '円盤の破片') {
            writeLog('円盤の破片は使用できない。もう1枚集めると「覚醒報酬」になる。');
            if (typeof render === 'function') render();
            return false;
          }
          return previousPlay(index, targetIndex);
        };
      }

      if (!window.__tier1FragmentGainPatched && typeof gainCardToHand === 'function') {
        window.__tier1FragmentGainPatched = true;
        const previousGain = gainCardToHand;
        gainCardToHand = function(gameState, card, message) {
          const result = previousGain(gameState, card, message);
          if (result !== false) combineFragments(gameState);
          return result;
        };
      }

      if (!window.__tier1FragmentRenderPatched && typeof render === 'function') {
        window.__tier1FragmentRenderPatched = true;
        const previousRender = render;
        render = function() {
          combineFragments(state);
          return previousRender();
        };
      }

      window.__tier1SpellEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();