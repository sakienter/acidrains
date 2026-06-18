/* Tier 2 spell definitions, effects, and lifecycle hooks. */
(() => {
  const modules = window.AcidCardModules;
  const number = value => Number(value || 0);
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
  let letterPackTimerId = null;

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

  function spellTribe(card) {
    if (!card?.tribe || ['なし', '育成'].includes(card.tribe)) return null;
    return card.tribe;
  }

  function chooseTarget(entries, title) {
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
      if (card && card.type !== 'spell' && spellTribe(card)) entries.push({ card, index, zone: 'shop' });
    });
    (gameState.board || []).forEach((card, index) => {
      if (index >= 2 && card && card.type !== 'spell' && spellTribe(card)) {
        entries.push({ card, index, zone: 'board' });
      }
    });

    const selected = chooseTarget(entries, 'シェフのおすすめ：対象を選択');
    if (!selected) {
      writeLog('種族ありカードがないため、シェフのおすすめは不発だった。');
      return false;
    }

    const pool = eligible(MINIONS).filter(card =>
      card.tribe === selected.card.tribe
      && card.id !== selected.card.id
      && card.name !== selected.card.name
      && number(card.tier) <= Math.max(1, number(gameState.tavernTier, 1))
    );
    if (!pool.length) {
      writeLog('同じ種族の別名カードがないため、シェフのおすすめは不発だった。');
      return false;
    }
    return addCard(gameState, randomCard(pool), `${selected.card.tribe}のカードを1枚得た。`);
  }

  function gainRandomTierOneCard(gameState) {
    const pool = eligible([...MINIONS, ...SPELLS]).filter(card => number(card.tier) === 1);
    return addCard(gameState, randomCard(pool), 'ランダムなティア1カードを1枚得た。');
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

  function ensureLetterPackOverlay() {
    let overlay = document.querySelector('#letterPackLockOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'letterPackLockOverlay';
    overlay.setAttribute('aria-live', 'assertive');
    overlay.innerHTML = '<div class="letter-pack-lock-card"><strong>📮 配達待ち</strong><span id="letterPackLockSeconds">20</span><small>秒間操作できません</small></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function paintLetterPackLock(gameState) {
    const overlay = ensureLetterPackOverlay();
    const remaining = Math.max(0, Math.ceil((number(gameState.letterPackLockedUntil) - Date.now()) / 1000));
    const active = remaining > 0 && !gameState.gameOver;
    overlay.classList.toggle('show', active);
    const value = overlay.querySelector('#letterPackLockSeconds');
    if (value) value.textContent = String(remaining);
    gameState.letterPackInputLocked = active;
    return active;
  }

  function stopLetterPackTimer() {
    if (letterPackTimerId !== null) {
      window.clearInterval(letterPackTimerId);
      letterPackTimerId = null;
    }
  }

  function startLetterPackLock(gameState, seconds = 20) {
    const duration = Math.max(0, number(seconds)) * 1000;
    gameState.letterPackLockedUntil = Math.max(Date.now(), number(gameState.letterPackLockedUntil)) + duration;
    paintLetterPackLock(gameState);
    stopLetterPackTimer();
    letterPackTimerId = window.setInterval(() => {
      if (!paintLetterPackLock(gameState)) stopLetterPackTimer();
    }, 200);
    writeLog(`${seconds}秒間、操作不能になった。`);
  }

  function castEndRoll(gameState) {
    const remaining = Math.max(0, number(gameState.turnTimeRemaining));
    const bonus = Math.floor(remaining / 10);
    gameState.nextTurnGoldBonus = number(gameState.nextTurnGoldBonus) + bonus;
    writeLog(`エンドロール：次のターンに${bonus}ゴールド追加し、ターンを終了する。`);
    window.setTimeout(() => {
      if (!gameState.gameOver && typeof endTurn === 'function') endTurn();
    }, 0);
  }

  function increaseGoldLimit(gameState) {
    if (typeof window.increaseStartingGold === 'function') {
      window.increaseStartingGold(gameState, 1, false);
    } else {
      gameState.startingGoldBonus = Math.max(0, number(gameState.startingGoldBonus)) + 1;
      gameState.maxGold = number(gameState.maxGold) + 1;
    }
    writeLog(`このゲームのゴールド上限が${gameState.maxGold}になった。`);
  }

  const DEFINITIONS = [
    {
      id: 'chef_recommendation',
      name: 'シェフのおすすめ',
      emoji: '🍽️',
      cost: 2,
      text: '酒場または、自分の盤面の種族ありカード1枚を選ぶ。同名ではない同じ種族のカードをランダムに1枚得る。',
    },
    { id: 'losing_ticket', name: 'はずれくじ', emoji: '🎟️', cost: 2, text: 'ランダムなティア1カードを1枚得る。' },
    { id: 'careful_investment', name: '慎重な投資', emoji: '💰', cost: 1, text: '次のターン、2ゴールド得る。' },
    { id: 'burst_coin_pouch', name: '弾けたコインポーチ', emoji: '👛', cost: 1, text: '3ゴールド得る。次のターンの開始時2ゴールド失う。' },
    { id: 'catalog_flip', name: 'カタログパラパラ', emoji: '📖', cost: 1, text: '2回分のリロールコストを0にする。' },
    { id: 'letter_pack', name: 'レターパック', emoji: '📮', cost: 2, text: '20秒操作不能になる。次のターン3ゴールド得る。' },
    { id: 'end_roll', name: 'エンドロール', emoji: '🎬', cost: 2, text: '自分のターンを終了する。発動時の残り時間10秒につき、次のターン1ゴールドを得る。' },
    { id: 'oil', name: '石油', emoji: '🛢️', cost: 3, text: 'このゲームのゴールドの上限を1増やす。' },
  ];

  modules.register({
    kind: 'spell',
    tier: 2,
    label: 'ティア2・スペル',
    definitions: DEFINITIONS,
    effects: {
      'シェフのおすすめ': () => ({
        cast(gameState) {
          castChefRecommendation(gameState);
        },
      }),

      'はずれくじ': () => ({
        cast(gameState) {
          gainRandomTierOneCard(gameState);
        },
      }),

      '慎重な投資': () => ({
        cast(gameState) {
          gameState.nextTurnGoldBonus = number(gameState.nextTurnGoldBonus) + 2;
          writeLog('次のターン、2ゴールド追加で得る。');
        },
      }),

      '弾けたコインポーチ': () => ({
        cast(gameState) {
          addGold(gameState, 3);
          gameState.nextTurnGoldBonus = number(gameState.nextTurnGoldBonus) - 2;
          writeLog('3ゴールド得た。次のターンの開始時に2ゴールド失う。');
        },
      }),

      'カタログパラパラ': () => ({
        cast(gameState) {
          gameState.freeRerolls = number(gameState.freeRerolls) + 2;
          writeLog('次の2回のリロールコストが0になった。');
        },
      }),

      'レターパック': () => ({
        cast(gameState) {
          gameState.nextTurnGoldBonus = number(gameState.nextTurnGoldBonus) + 3;
          startLetterPackLock(gameState, 20);
        },
      }),

      'エンドロール': () => ({
        cast(gameState) {
          castEndRoll(gameState);
        },
      }),

      '石油': () => ({
        cast(gameState) {
          increaseGoldLimit(gameState);
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.letterPackLockedUntil = 0;
        state.letterPackInputLocked = false;
      }

      if (!document.querySelector('#tier2SpellRuntimeStyle')) {
        const style = document.createElement('style');
        style.id = 'tier2SpellRuntimeStyle';
        style.textContent = `
          #letterPackLockOverlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            display: none;
            align-items: center;
            justify-content: center;
            pointer-events: all;
            cursor: wait;
            background: rgba(13, 10, 9, .18);
            backdrop-filter: blur(1.5px);
          }
          #letterPackLockOverlay.show { display: flex; }
          .letter-pack-lock-card {
            min-width: 210px;
            padding: 18px 24px;
            display: grid;
            gap: 5px;
            justify-items: center;
            border: 1px solid rgba(255, 228, 171, .38);
            border-radius: 18px;
            background: rgba(45, 29, 18, .94);
            box-shadow: 0 18px 48px rgba(0, 0, 0, .44);
            color: #fff0ce;
            font-family: Inter, system-ui, sans-serif;
          }
          .letter-pack-lock-card strong { font-size: 1rem; }
          .letter-pack-lock-card span { font-size: 2.2rem; font-weight: 950; color: #ffd278; }
          .letter-pack-lock-card small { opacity: .78; }
        `;
        document.head.appendChild(style);
      }

      if (!window.__tier2SpellInitialStatePatched && typeof initialState === 'function') {
        window.__tier2SpellInitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          stopLetterPackTimer();
          state.letterPackLockedUntil = 0;
          state.letterPackInputLocked = false;
          document.querySelector('#letterPackLockOverlay')?.classList.remove('show');
          return result;
        };
      }

      if (!window.__tier2TurnLockReleasePatched && typeof endTurn === 'function') {
        window.__tier2TurnLockReleasePatched = true;
        const previousEndTurn = endTurn;
        endTurn = function() {
          const result = previousEndTurn();
          (state.hand || []).forEach(card => {
            if (!card || card.lockedUntilTurn === undefined) return;
            if (number(card.lockedUntilTurn) < number(state.turn)) {
              if (card.originalTextBeforeLock !== undefined) card.text = card.originalTextBeforeLock;
              delete card.originalTextBeforeLock;
              delete card.lockedUntilTurn;
            }
          });
          return result;
        };
      }

      if (!window.__tier2LockedCardPlayPatched && typeof playHandCardToSlot === 'function') {
        window.__tier2LockedCardPlayPatched = true;
        const previousPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          const card = state.hand?.[index] || null;
          if (card && number(card.lockedUntilTurn, -1) >= number(state.turn)) {
            writeLog(`${card.name} はこのターン使用できない。`);
            if (typeof render === 'function') render();
            return false;
          }
          return previousPlay(index, targetIndex);
        };
      }

      window.__tier2SpellEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();