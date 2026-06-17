/* acidcards.csv: Tier 1 spell effects. */
(() => {
  const modules = window.AcidCardModules;
  const num = value => Number(value || 0);
  const maxHand = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;

  function say(message) {
    if (typeof log === 'function') log(message);
  }

  function copyCard(card) {
    if (typeof initializedClone === 'function') return initializedClone(card);
    if (typeof cloneCard === 'function') return cloneCard(card);
    return { ...card };
  }

  function addToHand(gameState, card, message = '') {
    if (!card) return false;
    if (gameState.hand.length >= maxHand()) {
      say('手札がいっぱい。');
      return false;
    }
    gameState.hand.push(copyCard(card));
    if (message) say(message);
    return true;
  }

  function pick(pool) {
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function tierOneMinions() {
    return MINIONS.filter(card => num(card.tier) === 1);
  }

  function makeReward() {
    return {
      id: `awakening_reward_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: '覚醒報酬',
      emoji: '🏆',
      tier: 0,
      cost: 0,
      type: 'spell',
      token: true,
      text: '現在の自分のティア+1のミニオンを1枚発見する。ティア6ではティア6ミニオンを発見する。',
      cast(gameState) {
        const rewardTier = Math.min(6, Math.max(1, num(gameState.tavernTier)) + 1);
        const pool = MINIONS.filter(card => num(card.tier) === rewardTier);
        if (!pool.length) {
          say(`ティア${rewardTier}のミニオンが見つからない。`);
          return;
        }
        if (typeof discoverCardsBeyondTier === 'function') {
          discoverCardsBeyondTier(gameState, pool, 1, `覚醒報酬：ティア${rewardTier}ミニオンを発見`);
        } else if (typeof withBeyondTierGeneration === 'function') {
          withBeyondTierGeneration(gameState, () => discoverCards(gameState, pool, 1, `覚醒報酬：ティア${rewardTier}ミニオンを発見`));
        } else {
          discoverCards(gameState, pool, 1, `覚醒報酬：ティア${rewardTier}ミニオンを発見`);
        }
      },
    };
  }

  let combining = false;
  function combineFragments(gameState) {
    if (combining || !gameState?.hand) return false;
    combining = true;
    let changed = false;
    try {
      while (true) {
        const indexes = gameState.hand
          .map((card, index) => card?.name === '未知の円盤の破片' ? index : -1)
          .filter(index => index >= 0);
        if (indexes.length < 2) break;
        gameState.hand.splice(indexes[1], 1);
        gameState.hand.splice(indexes[0], 1);
        gameState.hand.push(makeReward());
        say('未知の円盤の破片2枚が合体し、覚醒報酬になった。');
        changed = true;
      }
    } finally {
      combining = false;
    }
    return changed;
  }

  modules.register({
    kind: 'spell',
    tier: 1,
    label: 'ティア1・スペル',
    effects: {
      'コイン': () => ({
        cast(gameState) {
          const before = num(gameState.gold);
          const limit = num(gameState.maxGold) || 10;
          gameState.gold = Math.min(limit, before + 1);
          const gained = gameState.gold - before;
          if (gained > 0 && typeof notifyBoard === 'function') {
            gameState.goldGainEvents = num(gameState.goldGainEvents) + 1;
            notifyBoard('onGoldGained', gameState, gained);
          }
        },
      }),

      '新芽': () => ({
        cast(gameState) {
          const pool = tierOneMinions();
          if (typeof discoverCards === 'function') {
            discoverCards(gameState, pool, 1, 'ティア1ミニオンを発見');
          } else {
            addToHand(gameState, pick(pool), 'ティア1ミニオンを得た。');
          }
        },
      }),

      '召集': () => ({
        cast(gameState) {
          addToHand(gameState, pick(tierOneMinions()), 'ランダムなティア1ミニオンを得た。');
        },
      }),

      '未知の円盤の破片': () => ({
        unplayable: true,
        cast() {
          say('このカードは使用できない。手札に2枚集めると自動で合体する。');
          return false;
        },
      }),

      '石油': () => ({
        cast(gameState) {
          gameState.maxGold = (num(gameState.maxGold) || 10) + 1;
          say(`ゴールド上限が${gameState.maxGold}になった。`);
        },
      }),
    },

    apply() {
      if (!window.__tier1FragmentRenderPatch && typeof render === 'function') {
        window.__tier1FragmentRenderPatch = true;
        const oldRender = render;
        render = function() {
          combineFragments(state);
          return oldRender();
        };
      }

      if (!window.__tier1FragmentPlayPatch && typeof playHandCardToSlot === 'function') {
        window.__tier1FragmentPlayPatch = true;
        const oldPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          const card = state.hand[index];
          if (card?.name !== '未知の円盤の破片') return oldPlay(index, targetIndex);
          combineFragments(state);
          if (state.hand[index]?.name === '未知の円盤の破片') {
            say('このカードは使用できない。もう1枚集めると覚醒報酬になる。');
            render();
            return false;
          }
          render();
          return true;
        };
      }

      if (!window.__tier1FragmentGainPatch && typeof gainCardToHand === 'function') {
        window.__tier1FragmentGainPatch = true;
        const oldGain = gainCardToHand;
        gainCardToHand = function(gameState, card, message) {
          const result = oldGain(gameState, card, message);
          if (result !== false) combineFragments(gameState);
          return result;
        };
      }

      if (typeof state !== 'undefined') combineFragments(state);
      window.__tier1SpellEffectsImplemented = ['コイン', '新芽', '召集', '未知の円盤の破片', '石油'];
    },
  });
})();