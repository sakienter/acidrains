/* Tier 3 spell definitions, effects, and lifecycle hooks. */
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

  function gainNamedSpell(gameState, name, message = '') {
    const template = SPELLS.find(card => card?.name === name);
    if (!template) {
      writeLog(`${name} がカードプールに見つからない。`);
      return false;
    }
    return addCard(gameState, template, message || `${name} を得た。`);
  }

  function addGold(gameState, amount) {
    const gain = Math.max(0, number(amount));
    gameState.gold = number(gameState.gold) + gain;
    if (gain > 0) {
      gameState.goldGainEvents = number(gameState.goldGainEvents) + 1;
      if (typeof notifyBoard === 'function') notifyBoard('onGoldGained', gameState, gain);
    }
    return gain;
  }

  function adjustTurnTime(gameState, delta) {
    const change = number(delta);
    if (!change) return 0;

    const shouldResume = !gameState.isPaused
      && gameState.hasStarted
      && !gameState.gameOver
      && typeof window.pauseAcidTurnTimer === 'function'
      && typeof window.resumeAcidTurnTimer === 'function';

    if (shouldResume) window.pauseAcidTurnTimer();
    const before = Math.max(0, number(gameState.turnTimeRemaining));
    gameState.turnTimeRemaining = Math.max(0, before + change);
    gameState.turnTimeLimit = Math.max(number(gameState.turnTimeLimit), gameState.turnTimeRemaining);
    if (shouldResume) window.resumeAcidTurnTimer();
    return gameState.turnTimeRemaining - before;
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

  function resolveSixthSense(gameState) {
    const count = Math.max(0, Math.floor(number(gameState.sixthSensePending)));
    gameState.sixthSensePending = 0;
    if (!count) return;

    const tier = Math.max(1, Math.min(6, number(gameState.tavernTier, 1)));
    const minionPool = eligible(MINIONS).filter(card => number(card.tier) === tier);
    const spellPool = eligible(SPELLS).filter(card => number(card.tier) === tier);

    for (let index = 0; index < count; index += 1) {
      addCard(gameState, randomCard(minionPool), index === 0 ? `第六感：ティア${tier}ミニオンを得た。` : '');
      addCard(gameState, randomCard(spellPool), index === 0 ? `第六感：ティア${tier}スペルを得た。` : '');
    }
  }

  function destroyPirates(gameState) {
    const targets = (gameState.board || [])
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.index >= 2 && entry.card?.tribe === '海賊');

    targets.forEach(({ card, index }) => {
      if (typeof card.deathrattle === 'function') {
        const triggerCount = card.reborn ? 2 : 1;
        for (let trigger = 0; trigger < triggerCount; trigger += 1) {
          card.deathrattle(gameState, index);
        }
      }
      gameState.board[index] = null;
    });

    if (targets.length) writeLog(`自陣の海賊${targets.length}体を破壊した。`);
    else writeLog('自陣に海賊はいなかった。');
    if (typeof updateAuras === 'function') updateAuras();
    return targets.length;
  }

  function gainRandomSpells(gameState, count) {
    const pool = eligible(SPELLS).filter(card =>
      number(card.tier) <= Math.max(1, number(gameState.tavernTier, 1))
    );
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, randomCard(pool), index === 0 ? `ランダムなスペルを${count}枚得た。` : '')) break;
      gained += 1;
    }
    return gained;
  }

  function halveUpgradeCost(gameState) {
    if (typeof window.getTavernUpgradeCost !== 'function') return false;
    const current = Math.max(0, number(window.getTavernUpgradeCost(gameState)));
    const halved = Math.ceil(current / 2);
    const additionalDiscount = Math.max(0, current - halved);
    gameState.tavernUpgradeDiscount = number(gameState.tavernUpgradeDiscount) + additionalDiscount;
    writeLog(`酒場グレードアップのコストを${current}から${halved}にした。`);
    return true;
  }

  function rightmostShopMinion(gameState) {
    return [...(gameState.shop || [])].reverse().find(card => card && card.type !== 'spell') || null;
  }

  function applyHallelujahAfterRefresh(gameState) {
    const currentRerolls = Math.max(0, number(gameState.rerolls));
    const lastApplied = Math.max(0, number(gameState.hallelujahLastAppliedReroll));
    if (currentRerolls <= lastApplied) return false;

    const target = rightmostShopMinion(gameState);
    const refreshCount = currentRerolls - lastApplied;
    gameState.hallelujahLastAppliedReroll = currentRerolls;
    if (!target) return false;

    const stacks = Math.max(0, number(gameState.hallelujahStacks));
    const cardsPlayed = Math.max(0, number(gameState.cardsPlayedThisTurn));
    const buff = stacks * cardsPlayed * refreshCount;
    if (buff <= 0) return false;

    target.atk = number(target.atk) + buff;
    target.hp = number(target.hp) + buff;
    writeLog(`ハレルヤ：酒場右端の${target.name}に+${buff}/+${buff}を付与した。`);
    return true;
  }

  window.applyHallelujahAfterRefresh = applyHallelujahAfterRefresh;

  const DEFINITIONS = [
    { id: 'sixth_sense', name: '第六感', emoji: '👁️', cost: 4, text: 'このターンの終了時：自分のグレードと同じティアのミニオンとスペルを1枚ずつ得る。' },
    { id: 'burnt_pirate_flag', name: '燃えた海賊旗', emoji: '🏴', cost: 2, text: '自陣の海賊を破壊する。ランダムなスペルを2枚得る。' },
    { id: 'step_away_from_cliff', name: '崖から遠ざかる', emoji: '🧗', cost: 1, text: '次のターン、1ゴールド得て、時間が15秒増える。' },
    { id: 'pilfering', name: 'ちょろまかし', emoji: '🫳', cost: 2, text: '次に発動する、ミニオンを売った時の効果は2回発動する。' },
    { id: 'beat_check', name: 'ビートチェック', emoji: '🎧', cost: 3, text: '酒場グレードアップのコストを半分にする。（小数点は切り上げ）' },
    { id: 'east_wind', name: '東からの風', emoji: '🌬️', cost: 1, text: 'このゲーム中、酒場の右端のカードは+6/+6を得る。' },
    { id: 'desperate_reach', name: '喉から手がでる', emoji: '✋', cost: 1, text: '残り時間を30秒減らす。4ゴールド得る。' },
    { id: 'hallelujah', name: 'ハレルヤ', emoji: '🎶', cost: 1, text: 'この対戦中に酒場を入れ替えた後、酒場の右端のミニオン1体に+X/+Xを付与する。（Xはこのターン使用したカードの数）' },
    { id: 'info_product', name: '情報商材', emoji: '💻', cost: 3, text: '「石油」を1枚得る。「慎重な投資」を1枚得る。' },
  ];

  modules.register({
    kind: 'spell',
    tier: 3,
    label: 'ティア3・スペル',
    definitions: DEFINITIONS,
    effects: {
      '第六感': () => ({
        cast(gameState) {
          gameState.sixthSensePending = number(gameState.sixthSensePending) + 1;
          writeLog('このターンの終了時に、現在のグレードと同じティアのミニオンとスペルを得る。');
        },
      }),

      '燃えた海賊旗': () => ({
        cast(gameState) {
          destroyPirates(gameState);
          gainRandomSpells(gameState, 2);
        },
      }),

      '崖から遠ざかる': () => ({
        cast(gameState) {
          gameState.nextTurnGoldBonus = number(gameState.nextTurnGoldBonus) + 1;
          gameState.nextTurnTimeBonus = number(gameState.nextTurnTimeBonus) + 15;
          gameState.nextTurnTimeBonusTurn = number(gameState.turn, 1) + 1;
          writeLog('次のターン、1ゴールドと15秒を追加で得る。');
        },
      }),

      'ちょろまかし': () => ({
        cast(gameState) {
          gameState.doubleNextSellEffects = number(gameState.doubleNextSellEffects) + 1;
          writeLog('次に発動するミニオン自身の売却時効果が2回発動する。');
        },
      }),

      'ビートチェック': () => ({
        cast(gameState) {
          halveUpgradeCost(gameState);
        },
      }),

      '東からの風': () => ({
        cast(gameState) {
          gameState.eastWindStacks = number(gameState.eastWindStacks) + 1;
          applyEastWindToRightmost(gameState);
        },
      }),

      '喉から手がでる': () => ({
        cast(gameState) {
          adjustTurnTime(gameState, -30);
          addGold(gameState, 4);
          writeLog('残り時間を30秒減らし、4ゴールド得た。');
        },
      }),

      'ハレルヤ': () => ({
        cast(gameState) {
          gameState.hallelujahStacks = number(gameState.hallelujahStacks) + 1;
          writeLog('この対戦中、酒場入替後に使用カード数に応じて右端のミニオンを強化する。');
        },
      }),

      '情報商材': () => ({
        cast(gameState) {
          gainNamedSpell(gameState, '石油');
          gainNamedSpell(gameState, '慎重な投資');
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.sixthSensePending = 0;
        state.nextTurnTimeBonus = 0;
        state.nextTurnTimeBonusTurn = 0;
        state.doubleNextSellEffects = 0;
        state.hallelujahStacks = 0;
        state.hallelujahLastAppliedReroll = number(state.rerolls);
        state.cardsPlayedThisTurn = 0;
        state.eastWindStacks = Math.max(0, number(state.eastWindStacks));
      }

      if (!window.__tier3SpellInitialStatePatched && typeof initialState === 'function') {
        window.__tier3SpellInitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          state.sixthSensePending = 0;
          state.nextTurnTimeBonus = 0;
          state.nextTurnTimeBonusTurn = 0;
          state.doubleNextSellEffects = 0;
          state.hallelujahStacks = 0;
          state.hallelujahLastAppliedReroll = number(state.rerolls);
          state.cardsPlayedThisTurn = 0;
          state.eastWindStacks = 0;
          return result;
        };
      }

      if (!window.__tier3CardCountPatched && typeof playHandCardToSlot === 'function') {
        window.__tier3CardCountPatched = true;
        const previousPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          const result = previousPlay(index, targetIndex);
          if (result) state.cardsPlayedThisTurn = number(state.cardsPlayedThisTurn) + 1;
          return result;
        };
      }

      if (!window.__tier3SellDoublePatched && typeof sellBoardCard === 'function') {
        window.__tier3SellDoublePatched = true;
        const previousSell = sellBoardCard;
        sellBoardCard = function(index) {
          const sold = state.board?.[index] || null;
          const shouldDouble = Boolean(
            sold
            && typeof sold.onSell === 'function'
            && number(state.doubleNextSellEffects) > 0
          );
          const originalOnSell = sold?.onSell;

          if (shouldDouble) {
            state.doubleNextSellEffects = Math.max(0, number(state.doubleNextSellEffects) - 1);
            sold.onSell = function(gameState) {
              originalOnSell.call(this, gameState);
              originalOnSell.call(this, gameState);
            };
          }

          try {
            return previousSell(index);
          } finally {
            if (shouldDouble && sold) sold.onSell = originalOnSell;
          }
        };
      }

      if (!window.__tier3EndTurnPatched && typeof endTurn === 'function') {
        window.__tier3EndTurnPatched = true;
        const previousEndTurn = endTurn;
        endTurn = function() {
          if (!state.gameOver) resolveSixthSense(state);
          return previousEndTurn();
        };
      }

      if (!window.__tier3PerTurnResetPatched && typeof resetPerTurnCardState === 'function') {
        window.__tier3PerTurnResetPatched = true;
        const previousReset = resetPerTurnCardState;
        resetPerTurnCardState = function() {
          const result = previousReset();
          state.cardsPlayedThisTurn = 0;
          return result;
        };
      }

      window.addEventListener('load', () => {
        window.setTimeout(() => {
          if (!window.__tier3FinalDrawShopPatched && typeof drawShop === 'function') {
            window.__tier3FinalDrawShopPatched = true;
            const previousDrawShop = drawShop;
            drawShop = function(...args) {
              const result = previousDrawShop.apply(this, args);
              applyEastWindToRightmost(state);
              applyHallelujahAfterRefresh(state);
              return result;
            };
          }

          if (!window.__tier3TurnTimeBonusPatched && typeof window.getTurnTimeLimit === 'function') {
            window.__tier3TurnTimeBonusPatched = true;
            const previousGetTurnTimeLimit = window.getTurnTimeLimit;
            window.getTurnTimeLimit = function(turn) {
              const base = previousGetTurnTimeLimit(turn);
              const targetTurn = number(state.nextTurnTimeBonusTurn);
              const bonus = Math.max(0, number(state.nextTurnTimeBonus));
              if (bonus > 0 && number(turn) === targetTurn) {
                state.nextTurnTimeBonus = 0;
                state.nextTurnTimeBonusTurn = 0;
                return base + bonus;
              }
              return base;
            };
          }
        }, 0);
      }, { once: true });

      window.__tier3SpellEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();