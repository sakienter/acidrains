/* Tier 1 spell data patches, effects, and tier-specific lifecycle hooks. */
(() => {
  const modules = window.AcidCardModules;
  const num = value => Number(value || 0);
  const maxHand = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;

  function say(message) {
    if (typeof log === 'function' && message) log(message);
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
    if (typeof gainCardToHand === 'function') {
      return gainCardToHand(gameState, card, message) !== false;
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

  function spellTribe(card) {
    if (!card?.tribe || card.tribe === 'なし' || card.tribe === '育成') return null;
    return card.tribe;
  }

  function chooseSpellTarget(entries, title) {
    if (!entries.length) return null;
    const lines = entries.map((entry, index) => {
      const location = entry.zone === 'shop' ? '酒場' : '盤面';
      return `${index + 1}. ${entry.card.name}［${entry.card.tribe} / ${location}］`;
    }).join('\n');
    const answer = window.prompt(`${title}\n${lines}\n番号を入力してください。`, '1');
    return entries[Number(answer) - 1] || entries[0];
  }

  function castChefRecommendation(gameState) {
    const entries = [];
    (gameState.shop || []).forEach((card, index) => {
      if (spellTribe(card)) entries.push({ card, index, zone: 'shop' });
    });
    (gameState.board || []).forEach((card, index) => {
      if (card && spellTribe(card)) entries.push({ card, index, zone: 'board' });
    });

    const selected = chooseSpellTarget(entries, 'シェフのおすすめ：対象を選択');
    if (!selected) {
      say('種族ありカードがないため、シェフのおすすめは不発だった。');
      return;
    }

    const pool = MINIONS.filter(card =>
      card.tribe === selected.card.tribe && card.id !== selected.card.id
    );
    if (!pool.length) {
      say('同じ種族の別名カードがないため、シェフのおすすめは不発だった。');
      return;
    }
    addToHand(gameState, pick(pool), `${selected.card.tribe}のカードを1枚得た。`);
  }

  function dominantBoardTribes(gameState) {
    const counts = new Map();
    (gameState.board || []).forEach(card => {
      const tribe = spellTribe(card);
      if (tribe) counts.set(tribe, (counts.get(tribe) || 0) + 1);
    });
    if (!counts.size) return [];
    const maximum = Math.max(...counts.values());
    return [...counts.entries()]
      .filter(([, count]) => count === maximum)
      .map(([tribe]) => tribe);
  }

  function discoverDominantTribeCard(gameState, tierThreeOnly) {
    const tribes = dominantBoardTribes(gameState);
    if (!tribes.length) {
      say('盤面に種族ありカードがないため、発見できなかった。');
      return;
    }

    const pool = MINIONS.filter(card =>
      tribes.includes(card.tribe) && (!tierThreeOnly || num(card.tier) === 3)
    );
    if (!pool.length) {
      say('条件に合うカードがないため、発見できなかった。');
      return;
    }

    const selected = typeof chooseFromCards === 'function'
      ? chooseFromCards(pool, tierThreeOnly ? '万華鏡：Tier3カードを発見' : '望遠鏡：カードを発見')
      : pick(pool);
    if (!selected) return;
    if (gameState.hand.length >= maxHand()) {
      say('手札がいっぱい。');
      return;
    }

    const gained = copyCard(selected);
    if (tierThreeOnly) {
      gained.lockedUntilTurn = gameState.turn;
      gained.originalTextBeforeLock = gained.text || '';
      gained.text = `${gained.originalTextBeforeLock}（このターンは使用不可）`;
    }
    gameState.hand.push(gained);
    say(`${gained.name} を獲得した。`);
  }

  function gainRandomTierOneCard(gameState) {
    const pool = [
      ...MINIONS.filter(card => num(card.tier) === 1),
      ...SPELLS.filter(card => num(card.tier) === 1),
    ];
    addToHand(gameState, pick(pool), 'ランダムなTier1カードを1枚得た。');
  }

  function applyEastWindToRightmost(gameState) {
    const target = [...(gameState.shop || [])].reverse().find(card => card && card.type !== 'spell');
    if (!target) return;
    const stacks = num(gameState.eastWindStacks);
    const applied = num(target.eastWindAppliedStacks);
    const difference = stacks - applied;
    if (difference <= 0) return;
    target.atk = num(target.atk) + 6 * difference;
    target.hp = num(target.hp) + 6 * difference;
    target.eastWindAppliedStacks = stacks;
  }

  window.applyEastWindToRightmost = applyEastWindToRightmost;

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
          withBeyondTierGeneration(gameState, () => {
            discoverCards(gameState, pool, 1, `覚醒報酬：ティア${rewardTier}ミニオンを発見`);
          });
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
      'シェフのおすすめ': () => ({
        cast(gameState) {
          castChefRecommendation(gameState);
        },
      }),

      '東からの風': () => ({
        cast(gameState) {
          gameState.eastWindStacks = num(gameState.eastWindStacks) + 1;
          applyEastWindToRightmost(gameState);
        },
      }),

      '慎重な投資': () => ({
        cast(gameState) {
          gameState.nextTurnGoldBonus = num(gameState.nextTurnGoldBonus) + 2;
        },
      }),

      '望遠鏡': () => ({
        cast(gameState) {
          discoverDominantTribeCard(gameState, false);
        },
      }),

      '万華鏡': () => ({
        cast(gameState) {
          discoverDominantTribeCard(gameState, true);
        },
      }),

      'カタログパラパラ': () => ({
        cast(gameState) {
          gameState.freeRerolls = num(gameState.freeRerolls) + 2;
        },
      }),

      'はずれくじ': () => ({
        cast(gameState) {
          gainRandomTierOneCard(gameState);
        },
      }),

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
        text: 'このゲーム中、初期ゴールドを1増やす。',
        cast(gameState) {
          if (typeof window.increaseStartingGold === 'function') {
            window.increaseStartingGold(gameState, 1, false);
          } else {
            gameState.startingGoldBonus = num(gameState.startingGoldBonus) + 1;
            gameState.maxGold = num(gameState.maxGold) + 1;
          }
          say(`このゲーム中の初期ゴールドが${gameState.maxGold}になった。`);
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.eastWindStacks = num(state.eastWindStacks);
        combineFragments(state);
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

      if (!window.__tier1SpellPlayPatched && typeof playHandCardToSlot === 'function') {
        window.__tier1SpellPlayPatched = true;
        const previousPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          const card = state.hand[index];
          if (card?.name === '未知の円盤の破片') {
            combineFragments(state);
            if (state.hand[index]?.name === '未知の円盤の破片') {
              say('このカードは使用できない。もう1枚集めると覚醒報酬になる。');
              render();
              return false;
            }
            render();
            return true;
          }
          if (card && card.lockedUntilTurn >= state.turn) {
            say(`${card.name} はこのターン使用できない。`);
            return false;
          }
          return previousPlay(index, targetIndex);
        };
      }

      if (!window.__tier1SpellEndTurnPatched && typeof endTurn === 'function') {
        window.__tier1SpellEndTurnPatched = true;
        const previousEndTurn = endTurn;
        endTurn = function() {
          const beforeTurn = state.turn;
          const result = previousEndTurn();
          if (state.turn > beforeTurn) {
            state.hand.forEach(card => {
              if (card && card.lockedUntilTurn < state.turn && card.originalTextBeforeLock !== undefined) {
                card.text = card.originalTextBeforeLock;
                delete card.originalTextBeforeLock;
                delete card.lockedUntilTurn;
              }
            });
          }
          return result;
        };
      }

      if (!window.__tier1FragmentRenderPatch && typeof render === 'function') {
        window.__tier1FragmentRenderPatch = true;
        const previousRender = render;
        render = function() {
          combineFragments(state);
          return previousRender();
        };
      }

      if (!window.__tier1FragmentGainPatch && typeof gainCardToHand === 'function') {
        window.__tier1FragmentGainPatch = true;
        const previousGain = gainCardToHand;
        gainCardToHand = function(gameState, card, message) {
          const result = previousGain(gameState, card, message);
          if (result !== false) combineFragments(gameState);
          return result;
        };
      }

      applyEastWindToRightmost(state);
      window.__tier1SpellEffectsImplemented = [
        'シェフのおすすめ',
        '東からの風',
        '慎重な投資',
        '望遠鏡',
        '万華鏡',
        'カタログパラパラ',
        'はずれくじ',
        'コイン',
        '新芽',
        '召集',
        '未知の円盤の破片',
        '石油',
      ];
    },
  });
})();
