/* Tier 4 spell definitions, effects, and lifecycle hooks. */
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

  function adjustTurnTime(gameState, seconds) {
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

  function spellBoxPool(gameState) {
    const tier = Math.max(1, number(gameState?.tavernTier, 1));
    return eligible(SPELLS).filter(card => {
      const cost = number(card.cost);
      return number(card.tier) <= tier && cost >= 1 && cost <= 5;
    });
  }

  function canBuildSpellBox(pool, remainingCost, remainingCards, memo = new Map()) {
    const key = `${remainingCost}:${remainingCards}`;
    if (memo.has(key)) return memo.get(key);
    if (remainingCards === 0) return remainingCost === 0;
    if (remainingCost <= 0) return false;

    const result = pool.some(card => {
      const cost = number(card.cost);
      return cost <= remainingCost
        && canBuildSpellBox(pool, remainingCost - cost, remainingCards - 1, memo);
    });
    memo.set(key, result);
    return result;
  }

  function createSpellBoxBundle(gameState) {
    const pool = spellBoxPool(gameState);
    const freeSlots = Math.max(0, handLimit() - gameState.hand.length);
    if (!pool.length || freeSlots <= 0) {
      writeLog('スペルボックスを開ける手札枠がない。');
      return [];
    }

    const maximumCards = Math.min(5, freeSlots);
    const feasibleCounts = [];
    for (let count = 1; count <= maximumCards; count += 1) {
      if (canBuildSpellBox(pool, 5, count)) feasibleCounts.push(count);
    }
    if (!feasibleCounts.length) {
      writeLog('合計5コストになるスペルの組み合わせがない。');
      return [];
    }

    const selectedCount = randomCard(feasibleCounts);
    const selected = [];
    let remainingCost = 5;
    let remainingCards = selectedCount;

    while (remainingCards > 0) {
      const candidates = pool.filter(card => {
        const cost = number(card.cost);
        return cost <= remainingCost
          && canBuildSpellBox(pool, remainingCost - cost, remainingCards - 1);
      });
      const card = randomCard(candidates);
      if (!card) break;
      selected.push(card);
      remainingCost -= number(card.cost);
      remainingCards -= 1;
    }

    if (remainingCost !== 0 || selected.length !== selectedCount) {
      writeLog('スペルボックスの組み合わせ生成に失敗した。');
      return [];
    }
    return selected;
  }

  function castSpellBox(gameState) {
    const bundle = createSpellBoxBundle(gameState);
    let gained = 0;
    bundle.forEach((card, index) => {
      if (addCard(gameState, card, index === 0 ? `スペルボックスから${bundle.length}枚のスペルを得た。` : '')) {
        gained += 1;
      }
    });
    return gained;
  }

  function dominantBoardTribes(gameState) {
    const counts = new Map();
    (gameState.board || []).forEach((card, index) => {
      if (index < 2 || !card || card.type === 'spell') return;
      const tribe = String(card.tribe || 'なし');
      if (['なし', '育成', ''].includes(tribe)) return;
      counts.set(tribe, (counts.get(tribe) || 0) + 1);
    });
    if (!counts.size) return [];
    const maximum = Math.max(...counts.values());
    return [...counts.entries()]
      .filter(([, count]) => count === maximum)
      .map(([tribe]) => tribe);
  }

  function castTelescope(gameState) {
    const tribes = dominantBoardTribes(gameState);
    if (!tribes.length) {
      writeLog('盤面に種族ありミニオンがいないため、望遠鏡は不発だった。');
      return false;
    }

    const pool = eligible(MINIONS).filter(card =>
      tribes.includes(card.tribe)
      && number(card.tier) <= Math.max(1, number(gameState.tavernTier, 1))
    );
    if (!pool.length) {
      writeLog('最も多い種族の発見候補がない。');
      return false;
    }

    if (typeof discoverCards === 'function') {
      discoverCards(gameState, pool, 1, `望遠鏡：${tribes.join('・')}のカードを発見`);
      return true;
    }
    return addCard(gameState, randomCard(pool), `${tribes.join('・')}のカードを得た。`);
  }

  function gainRandomNoTribeMinion(gameState) {
    const pool = eligible(MINIONS).filter(card =>
      ['なし', '', undefined, null].includes(card.tribe)
      && number(card.tier) <= Math.max(1, number(gameState.tavernTier, 1))
    );
    return addCard(gameState, randomCard(pool), 'ランダムな種族なしミニオンを1枚得た。');
  }

  function gainElementals(gameState) {
    const tierThreePool = eligible(MINIONS).filter(card => card.tribe === 'エレメンタル' && number(card.tier) === 3);
    const tierFourPool = eligible(MINIONS).filter(card => card.tribe === 'エレメンタル' && number(card.tier) === 4);
    addCard(gameState, randomCard(tierThreePool), 'ティア3のエレメンタルを1枚得た。');
    addCard(gameState, randomCard(tierFourPool), 'ティア4のエレメンタルを1枚得た。');
  }

  const DEFINITIONS = [
    { id: 'spell_box', name: 'スペルボックス', emoji: '📦', cost: 3, text: '合計5コストになるように、スペルをランダムな枚数得る。' },
    { id: 'hidden_door', name: '隠し扉', emoji: '🚪', cost: 1, text: 'このターンの残り時間を30秒追加する。' },
    { id: 'telescope', name: '望遠鏡', emoji: '🔭', cost: 4, text: '自分の盤面で一番多い種族のカードを発見する。' },
    { id: 'dispatch_work', name: '派遣作業', emoji: '🧰', cost: 3, text: 'ランダムな種族なしミニオンを1枚得る。' },
    { id: 'drakkari', name: 'ドラッカリ', emoji: '🌙', cost: 2, text: 'このターン、ターン終了時の効果は2回発動される。（重複しない）' },
    { id: 'premium_moisture_pack', name: '高級保湿パック', emoji: '🧴', cost: 5, text: 'ティア3、ティア4のエレメンタルをランダムに1枚ずつ得る。' },
    { id: 'war_drum', name: '陣太鼓', emoji: '🥁', cost: 2, text: 'このターン、次に使う雄叫びは3回発動する。' },
  ];

  modules.register({
    kind: 'spell',
    tier: 4,
    label: 'ティア4・スペル',
    definitions: DEFINITIONS,
    effects: {
      'スペルボックス': () => ({
        cast(gameState) {
          castSpellBox(gameState);
        },
      }),

      '隠し扉': () => ({
        cast(gameState) {
          adjustTurnTime(gameState, 30);
        },
      }),

      '望遠鏡': () => ({
        cast(gameState) {
          castTelescope(gameState);
        },
      }),

      '派遣作業': () => ({
        cast(gameState) {
          gainRandomNoTribeMinion(gameState);
        },
      }),

      'ドラッカリ': () => ({
        cast(gameState) {
          gameState.drakkariActive = true;
          writeLog('このターン、ターン終了時効果が2回発動する。');
        },
      }),

      '高級保湿パック': () => ({
        cast(gameState) {
          gainElementals(gameState);
        },
      }),

      '陣太鼓': () => ({
        cast(gameState) {
          const baseMultiplier = Math.max(1, number(gameState.battlecryMultiplier, 1));
          const requiredExtra = Math.max(0, 3 - baseMultiplier);
          gameState.nextBattlecryMultiplier = Math.max(
            number(gameState.nextBattlecryMultiplier),
            requiredExtra,
          );
          writeLog('このターン、次に使う雄叫びが合計3回発動する。');
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.drakkariActive = Boolean(state.drakkariActive);
      }

      if (!window.__tier4DrakkariPendingEffectsPatched && typeof endTurn === 'function') {
        window.__tier4DrakkariPendingEffectsPatched = true;
        const previousEndTurn = endTurn;
        endTurn = function() {
          const multiplier = Math.max(
            state.drakkariActive ? 2 : 1,
            Math.max(1, number(state.endTurnMultiplier, 1)),
          );
          if (multiplier > 1 && number(state.sixthSensePending) > 0) {
            state.sixthSensePending = number(state.sixthSensePending) * multiplier;
          }
          return previousEndTurn();
        };
      }

      window.__tier4SpellEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();