/* Tier 6 spell definitions, effects, and lifecycle hooks. */
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
    if (change > 0) {
      gameState.turnTimeLimit = Math.max(number(gameState.turnTimeLimit), gameState.turnTimeRemaining);
    }
    if (shouldResume) window.resumeAcidTurnTimer();
    return gameState.turnTimeRemaining - before;
  }

  function extendTurnLimit(gameState) {
    if (gameState.endlessMode) {
      writeLog('エンドレスモードではリミットターンは増減しない。');
      return false;
    }
    gameState.maxTurns = Math.max(number(gameState.turn, 1), number(gameState.maxTurns)) + 1;
    writeLog(`リミットターンが1増え、${gameState.maxTurns}ターンになった。`);
    return true;
  }

  function chooseBoardMinion(gameState, predicate, title, action) {
    if (typeof selectBoardCard === 'function') {
      return selectBoardCard(gameState, predicate, action, title);
    }

    const entries = (gameState.board || [])
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.index >= 2 && entry.card && predicate(entry.card));
    if (!entries.length) {
      writeLog('対象となるミニオンがいない。');
      return null;
    }
    const lines = entries.map((entry, index) => `${index + 1}. ${entry.card.name}`).join('\n');
    const answer = window.prompt(`${title}\n${lines}`, '1');
    const selected = entries[Number(answer) - 1] || entries[0];
    action(selected.card, selected.index);
    return selected.card;
  }

  function castDoppelgangerTactic(gameState) {
    if (handLimit() - gameState.hand.length < 2) {
      writeLog('手札に2枚分の空きがないため、ドッペルゲンガーの奇策は不発だった。');
      return false;
    }

    return Boolean(chooseBoardMinion(
      gameState,
      card => card.type !== 'spell' && typeof card.battlecry === 'function',
      'ドッペルゲンガーの奇策：手札に戻す雄叫びミニオンを選択',
      (card, index) => {
        const template = MINIONS.find(candidate => candidate.id === card.id || candidate.name === card.name);
        gameState.board[index] = null;
        gameState.hand.push(card);
        if (template) addCard(gameState, template, `${card.name}の同名カードを1枚得た。`);
        if (typeof updateAuras === 'function') updateAuras();
      },
    ));
  }

  function castSuperAwakening(gameState) {
    return Boolean(chooseBoardMinion(
      gameState,
      card => card.type !== 'spell' && number(card.tier) <= 5 && !card.awakened,
      '超覚醒化：覚醒させるティア5以下のミニオンを選択',
      card => {
        card.awakened = true;
        card.text = card.awakenedText || card.text;
        writeLog(`✨ ${card.name} を覚醒させた。`);
      },
    ));
  }

  function spellBoxPool(gameState) {
    const tier = Math.max(1, number(gameState.tavernTier, 1));
    return eligible(SPELLS).filter(card => {
      const cost = number(card.cost);
      return number(card.tier) <= tier && cost >= 1 && cost <= 10;
    });
  }

  function canBuildBundle(pool, remainingCost, remainingCards, memo = new Map()) {
    const key = `${remainingCost}:${remainingCards}`;
    if (memo.has(key)) return memo.get(key);
    if (remainingCards === 0) return remainingCost === 0;
    if (remainingCost <= 0) return false;

    const result = pool.some(card => {
      const cost = number(card.cost);
      return cost <= remainingCost
        && canBuildBundle(pool, remainingCost - cost, remainingCards - 1, memo);
    });
    memo.set(key, result);
    return result;
  }

  function createCostBundle(gameState, targetCost) {
    const pool = spellBoxPool(gameState);
    const freeSlots = Math.max(0, handLimit() - gameState.hand.length);
    if (!pool.length || freeSlots <= 0) {
      writeLog('スペルボックスを開ける手札枠がない。');
      return [];
    }

    const maximumCards = Math.min(targetCost, freeSlots);
    const feasibleCounts = [];
    for (let count = 1; count <= maximumCards; count += 1) {
      if (canBuildBundle(pool, targetCost, count)) feasibleCounts.push(count);
    }
    if (!feasibleCounts.length) {
      writeLog(`合計${targetCost}コストになるスペルの組み合わせがない。`);
      return [];
    }

    const selectedCount = randomCard(feasibleCounts);
    const selected = [];
    let remainingCost = targetCost;
    let remainingCards = selectedCount;

    while (remainingCards > 0) {
      const candidates = pool.filter(card => {
        const cost = number(card.cost);
        return cost <= remainingCost
          && canBuildBundle(pool, remainingCost - cost, remainingCards - 1);
      });
      const card = randomCard(candidates);
      if (!card) break;
      selected.push(card);
      remainingCost -= number(card.cost);
      remainingCards -= 1;
    }

    return remainingCost === 0 && selected.length === selectedCount ? selected : [];
  }

  function castLargeSpellBox(gameState) {
    const bundle = createCostBundle(gameState, 10);
    bundle.forEach((card, index) => {
      addCard(gameState, card, index === 0 ? `でかいスペルボックスから${bundle.length}枚のスペルを得た。` : '');
    });
    return bundle.length;
  }

  function castBingeEating(gameState) {
    adjustTurnTime(gameState, -30);
    const pool = eligible([...MINIONS, ...SPELLS]).filter(card => number(card.tier) === 5);
    let gained = 0;
    for (let index = 0; index < 3; index += 1) {
      if (!addCard(gameState, randomCard(pool), index === 0 ? 'ティア5カードをランダムに3枚得た。' : '')) break;
      gained += 1;
    }
    return gained;
  }

  function castHumanError(gameState) {
    if (!gameState.endlessMode) {
      gameState.maxTurns = Math.max(number(gameState.turn, 1), number(gameState.maxTurns) - 2);
      writeLog(`リミットターンが2減り、${gameState.maxTurns}ターンになった。`);
    } else {
      writeLog('エンドレスモードではリミットターンは減少しない。');
    }

    const pool = eligible(MINIONS).filter(card => number(card.tier) === 6);
    discover(gameState, pool, 3, 'ヒューマンエラー：ティア6ミニオンを発見');
  }

  const DEFINITIONS = [
    { id: 'time_transcendence', name: '時空の超越', emoji: '⏳', cost: 8, text: 'リミットターンの猶予を1増やす。' },
    { id: 'temporary_time_rewrite', name: '一時的な時間改竄', emoji: '🕰️', cost: 3, text: 'このターン、次に使うスペルは追加で1回発動される。' },
    { id: 'doppelganger_tactic', name: 'ドッペルゲンガーの奇策', emoji: '👥', cost: 5, text: '自陣の雄叫びミニオンを1枚手札に戻す。その同名カードを1枚得る。' },
    { id: 'super_awakening', name: '超覚醒化', emoji: '🌟', cost: 5, text: '自陣のティア5以下のミニオンを1枚選び、覚醒させる。' },
    { id: 'large_spell_box', name: 'でかいスペルボックス', emoji: '🧰', cost: 4, text: '合計10コストになるように、ランダムにスペルを得る。' },
    { id: 'binge_eating', name: 'ドカ食い', emoji: '🍱', cost: 4, text: '残り時間を30秒減らす。ティア5カードをランダムに3枚得る。' },
    { id: 'human_error', name: 'ヒューマンエラー', emoji: '⚠️', cost: 4, text: 'リミットターンを2ターン減らす。ティア6ミニオンを3回発見する。' },
  ];

  modules.register({
    kind: 'spell',
    tier: 6,
    label: 'ティア6・スペル',
    definitions: DEFINITIONS,
    effects: {
      '時空の超越': () => ({
        cast(gameState) {
          extendTurnLimit(gameState);
        },
      }),

      '一時的な時間改竄': () => ({
        cast(gameState) {
          gameState.timeRewriteCharges = number(gameState.timeRewriteCharges) + 1;
          writeLog('このターン、次に使うスペルが追加で1回発動する。');
        },
      }),

      'ドッペルゲンガーの奇策': () => ({
        cast(gameState) {
          castDoppelgangerTactic(gameState);
        },
      }),

      '超覚醒化': () => ({
        cast(gameState) {
          castSuperAwakening(gameState);
        },
      }),

      'でかいスペルボックス': () => ({
        cast(gameState) {
          castLargeSpellBox(gameState);
        },
      }),

      'ドカ食い': () => ({
        cast(gameState) {
          castBingeEating(gameState);
        },
      }),

      'ヒューマンエラー': () => ({
        cast(gameState) {
          castHumanError(gameState);
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') state.timeRewriteCharges = 0;

      if (!window.__tier6InitialStatePatched && typeof initialState === 'function') {
        window.__tier6InitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          state.timeRewriteCharges = 0;
          return result;
        };
      }

      if (!window.__tier6TimeRewritePatched && typeof playHandCardToSlot === 'function') {
        window.__tier6TimeRewritePatched = true;
        const previousPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          const source = state.hand?.[index] || null;
          const shouldRepeat = Boolean(
            source
            && source.type === 'spell'
            && source.name !== '一時的な時間改竄'
            && number(state.timeRewriteCharges) > 0
          );
          const result = previousPlay(index, targetIndex);
          if (result && shouldRepeat && typeof source.cast === 'function') {
            state.timeRewriteCharges = Math.max(0, number(state.timeRewriteCharges) - 1);
            source.cast(state);
            if (typeof notifyBoard === 'function') notifyBoard('onSpellCast', state, source);
            if (typeof updateAuras === 'function') updateAuras();
            writeLog(`${source.name} が追加でもう1回発動した。`);
            if (typeof render === 'function') render();
          }
          return result;
        };
      }

      if (!window.__tier6PerTurnResetPatched && typeof resetPerTurnCardState === 'function') {
        window.__tier6PerTurnResetPatched = true;
        const previousReset = resetPerTurnCardState;
        resetPerTurnCardState = function() {
          const result = previousReset();
          state.timeRewriteCharges = 0;
          return result;
        };
      }

      window.__tier6SpellEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();