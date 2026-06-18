/* Tier 2 minion definitions and authoritative effect implementations. */
(() => {
  const modules = window.AcidCardModules;
  const number = value => Number(value || 0);
  const amount = (card, normal, awakened) => card?.awakened ? awakened : normal;
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;

  const COIN = Object.freeze({
    id: 'coin',
    name: 'コイン',
    emoji: '🪙',
    tier: 1,
    cost: 1,
    type: 'spell',
    text: '1ゴールド得る。',
  });

  const CHANGE = Object.freeze({
    id: 'token_change',
    name: 'おつり',
    emoji: '🪙',
    tier: 1,
    cost: 0,
    atk: 3,
    hp: 3,
    tribe: 'なし',
    text: '',
    awakenedText: '',
    token: true,
    shopEligible: false,
  });

  function writeLog(message) {
    if (typeof log === 'function' && message) log(message);
  }

  function randomCard(pool) {
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function cloneTemplate(template) {
    if (!template) return null;
    if (typeof initializedClone === 'function') return initializedClone(template);
    if (typeof cloneCard === 'function') return cloneCard(template);
    return { ...template };
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

  function gainMany(gameState, template, count, message) {
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, template, index === 0 ? message : '')) break;
      gained += 1;
    }
    return gained;
  }

  function gainNamedSpell(gameState, name, count, message = '') {
    const template = SPELLS.find(card => card?.name === name);
    if (!template) {
      writeLog(`${name} がカードプールに見つからない。`);
      return 0;
    }
    return gainMany(gameState, template, count, message || `${name} を得た。`);
  }

  function gainChange(gameState, count) {
    const template = typeof TOKEN_CARDS !== 'undefined' && TOKEN_CARDS.change
      ? TOKEN_CARDS.change
      : CHANGE;
    return gainMany(gameState, template, count, 'おつりを得た。');
  }

  function discover(gameState, pool, count, title) {
    const eligible = pool.filter(Boolean);
    if (!eligible.length) {
      writeLog(`${title}：候補がない。`);
      return 0;
    }
    if (typeof discoverCards === 'function') {
      discoverCards(gameState, eligible, count, title);
      return count;
    }
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, randomCard(eligible), index === 0 ? title : '')) break;
      gained += 1;
    }
    return gained;
  }

  function playablePool(cards) {
    return cards.filter(card => card && !card.token && card.shopEligible !== false);
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

  function castNamedSpell(gameState, name, count) {
    const spell = SPELLS.find(card => card?.name === name);
    if (!spell || typeof spell.cast !== 'function') {
      writeLog(`${name} を発動できない。`);
      return 0;
    }
    for (let index = 0; index < count; index += 1) {
      spell.cast(gameState);
      if (typeof notifyBoard === 'function') notifyBoard('onSpellCast', gameState, spell);
    }
    return count;
  }

  function ensureCoinDefinition() {
    let coin = SPELLS.find(card => card?.id === COIN.id || card?.name === COIN.name);
    if (!coin) {
      coin = { ...COIN };
      SPELLS.push(coin);
    } else {
      Object.assign(coin, COIN);
    }
    return coin;
  }

  function installCoinEffect() {
    const coin = ensureCoinDefinition();
    coin.cast = function(gameState) {
      gameState.gold = number(gameState.gold) + 1;
      gameState.goldGainEvents = number(gameState.goldGainEvents) + 1;
      if (typeof notifyBoard === 'function') notifyBoard('onGoldGained', gameState, 1);
      writeLog('コインで1ゴールド得た。');
      return true;
    };
  }

  function installChangeToken() {
    if (typeof TOKEN_CARDS === 'undefined') return;
    const target = TOKEN_CARDS.change || {};
    Object.keys(target).forEach(key => delete target[key]);
    Object.assign(target, CHANGE);
    TOKEN_CARDS.change = target;
  }

  const DEFINITIONS = [
    {
      id: 'tier2_healing_cat',
      name: '癒されるねこ',
      emoji: '🐈',
      cost: 3,
      atk: 2,
      hp: 3,
      tribe: '獣',
      text: '雄叫び：このターンの残り時間を5秒追加する。',
      awakenedText: '雄叫び：このターンの残り時間を10秒追加する。',
    },
    {
      id: 'tier2_scavenging_monkey',
      name: '物拾いする猿',
      emoji: '🐒',
      cost: 3,
      atk: 5,
      hp: 1,
      tribe: '獣',
      text: '雄叫び：このターンに使ったティア1または2のスペルをランダムに1枚得る。',
      awakenedText: '雄叫び：このターンに使ったティア1または2のスペルをランダムに2枚得る。',
    },
    {
      id: 'tier2_spoiler_fin',
      name: 'ネタバラシフィン',
      emoji: '🐟',
      cost: 3,
      atk: 3,
      hp: 1,
      tribe: 'マーロック',
      text: '雄叫び：ティア4のスペルをランダムに1枚得る。それはこのターン使えない。',
      awakenedText: '雄叫び：ティア4のスペルをランダムに2枚得る。それらはこのターン使えない。',
    },
    {
      id: 'tier2_laughing_fin',
      name: '爆笑フィン',
      emoji: '🤣',
      cost: 3,
      atk: 4,
      hp: 2,
      tribe: 'マーロック',
      text: 'このカードが場にいる状態でグレードを上げると、「はずれくじ」を2回発動する。',
      awakenedText: 'このカードが場にいる状態でグレードを上げると、「はずれくじ」を4回発動する。',
    },
    {
      id: 'tier2_coin_man',
      name: 'コインマン',
      emoji: '🪙',
      cost: 3,
      atk: 2,
      hp: 4,
      tribe: '海賊',
      text: 'ターン終了時：「コイン」を1枚得る。',
      awakenedText: 'ターン終了時：「コイン」を2枚得る。',
    },
    {
      id: 'tier2_yoigoshi',
      name: 'よいごし',
      emoji: '💰',
      cost: 3,
      atk: 1,
      hp: 3,
      tribe: '海賊',
      text: 'このカードは3ゴールドで売れる。',
      awakenedText: 'このカードは6ゴールドで売れる。',
    },
    {
      id: 'tier2_uremental',
      name: 'ウレメンタル',
      emoji: '💧',
      cost: 3,
      atk: 2,
      hp: 2,
      tribe: 'エレメンタル',
      text: 'このカードを売った時、「おつり」を1体獲得する。',
      awakenedText: 'このカードを売った時、「おつり」を2体獲得する。',
    },
    {
      id: 'tier2_east_circuit',
      name: 'イーストサーキット',
      emoji: '🌬️',
      cost: 3,
      atk: 4,
      hp: 1,
      tribe: 'エレメンタル',
      text: 'このカードが場にいる状態でグレードを上げると、「東からの風」を1枚得る。',
      awakenedText: 'このカードが場にいる状態でグレードを上げると、「東からの風」を2枚得る。',
    },
    {
      id: 'tier2_investor_naga',
      name: '投資家ナーガ',
      emoji: '📈',
      cost: 3,
      atk: 2,
      hp: 3,
      tribe: 'ナーガ',
      text: '雄叫び：「慎重な投資」を1枚得る。',
      awakenedText: '雄叫び：「慎重な投資」を2枚得る。',
    },
    {
      id: 'tier2_shell_collector',
      name: '貝殻収集家',
      emoji: '🐚',
      cost: 3,
      atk: 3,
      hp: 2,
      tribe: 'ナーガ',
      text: '雄叫び：「コイン」を1枚得る。',
      awakenedText: '雄叫び：「コイン」を2枚得る。',
    },
    {
      id: 'tier2_festival_naga',
      name: 'テキ屋ナーガ',
      emoji: '🎯',
      cost: 3,
      atk: 1,
      hp: 4,
      tribe: 'ナーガ',
      text: 'ターン終了時：「はずれくじ」を1枚得る。',
      awakenedText: 'ターン終了時：「はずれくじ」を2枚得る。',
    },
    {
      id: 'tier2_substitute',
      name: '身代わり',
      emoji: '🪆',
      cost: 3,
      atk: 1,
      hp: 1,
      tribe: 'なし',
      text: 'このカードを売った時、「このカードを売った時」がテキストにあるカードを1枚発見する。',
      awakenedText: 'このカードを売った時、「このカードを売った時」がテキストにあるカードを2枚発見する。',
    },
    {
      id: 'tier2_beacon_of_hope',
      name: 'ビーコンオブホープ',
      emoji: '🕯️',
      cost: 3,
      atk: 3,
      hp: 3,
      tribe: 'なし',
      text: '雄叫び：自分の現在のグレードと同じティアのカードをランダムに1枚得る。',
      awakenedText: '雄叫び：自分の現在のグレードと同じティアのカードをランダムに2枚得る。',
    },
    {
      id: 'tier2_scout',
      name: '斥候',
      emoji: '🔭',
      cost: 3,
      atk: 1,
      hp: 1,
      tribe: 'なし',
      text: 'このカードを売った時、ティア1カードを1枚発見する。',
      awakenedText: 'このカードを売った時、ティア1カードを2枚発見する。',
    },
  ];

  modules.register({
    kind: 'minion',
    tier: 2,
    label: 'ティア2・ミニオン',
    definitions: DEFINITIONS,
    effects: {
      '癒されるねこ': () => ({
        battlecry(gameState) {
          addTurnTime(gameState, amount(this, 5, 10));
        },
      }),

      '物拾いする猿': () => ({
        battlecry(gameState) {
          const history = Array.isArray(gameState.tier2SpellHistory)
            ? gameState.tier2SpellHistory.filter(card => [1, 2].includes(number(card?.tier)))
            : [];
          if (!history.length) {
            writeLog('このターンに使用したティア1・2スペルがない。');
            return;
          }
          for (let index = 0; index < amount(this, 1, 2); index += 1) {
            if (!addCard(gameState, randomCard(history), index === 0 ? '使用済みスペルを拾った。' : '')) break;
          }
        },
      }),

      'ネタバラシフィン': () => ({
        battlecry(gameState) {
          const pool = playablePool(SPELLS).filter(card => number(card.tier) === 4);
          for (let index = 0; index < amount(this, 1, 2); index += 1) {
            const selected = randomCard(pool);
            if (!selected || !addCard(gameState, selected, index === 0 ? 'ティア4スペルを得た。' : '', {
              lockedUntilTurn: number(gameState.turn),
            })) break;
          }
        },
      }),

      '爆笑フィン': () => ({
        onTavernUpgrade(gameState) {
          castNamedSpell(gameState, 'はずれくじ', amount(this, 2, 4));
        },
      }),

      'コインマン': () => ({
        onTurnEnd(gameState) {
          gainNamedSpell(gameState, 'コイン', amount(this, 1, 2));
        },
      }),

      'よいごし': () => ({
        onSell(gameState) {
          const totalSellValue = amount(this, 3, 6);
          gameState.gold = number(gameState.gold) + Math.max(0, totalSellValue - 1);
          writeLog(`${this.name}を${totalSellValue}ゴールドで売却した。`);
        },
      }),

      'ウレメンタル': () => ({
        onSell(gameState) {
          gainChange(gameState, amount(this, 1, 2));
        },
      }),

      'イーストサーキット': () => ({
        onTavernUpgrade(gameState) {
          gainNamedSpell(gameState, '東からの風', amount(this, 1, 2));
        },
      }),

      '投資家ナーガ': () => ({
        battlecry(gameState) {
          gainNamedSpell(gameState, '慎重な投資', amount(this, 1, 2));
        },
      }),

      '貝殻収集家': () => ({
        battlecry(gameState) {
          gainNamedSpell(gameState, 'コイン', amount(this, 1, 2));
        },
      }),

      'テキ屋ナーガ': () => ({
        onTurnEnd(gameState) {
          gainNamedSpell(gameState, 'はずれくじ', amount(this, 1, 2));
        },
      }),

      '身代わり': () => ({
        onSell(gameState) {
          const pool = playablePool(MINIONS).filter(card => {
            if (card.id === this.id || card.name === this.name) return false;
            if (number(card.tier) > number(gameState.tavernTier, 1)) return false;
            const text = `${card.text || ''}\n${card.awakenedText || ''}`;
            return text.includes('このカードを売った時') || text.includes('売却時');
          });
          discover(gameState, pool, amount(this, 1, 2), '身代わり：売却時効果を持つカードを発見');
        },
      }),

      'ビーコンオブホープ': () => ({
        battlecry(gameState) {
          const tier = Math.max(1, number(gameState.tavernTier, 1));
          const pool = playablePool([...MINIONS, ...SPELLS]).filter(card =>
            number(card.tier) === tier && card.id !== this.id && card.name !== this.name
          );
          for (let index = 0; index < amount(this, 1, 2); index += 1) {
            if (!addCard(gameState, randomCard(pool), index === 0 ? `ティア${tier}カードを得た。` : '')) break;
          }
        },
      }),

      '斥候': () => ({
        onSell(gameState) {
          const pool = playablePool([...MINIONS, ...SPELLS]).filter(card =>
            number(card.tier) === 1 && card.id !== this.id && card.name !== this.name
          );
          discover(gameState, pool, amount(this, 1, 2), '斥候：ティア1カードを発見');
        },
      }),
    },

    apply() {
      ensureCoinDefinition();
      installChangeToken();

      if (typeof state !== 'undefined') {
        state.tier2SpellHistory = Array.isArray(state.tier2SpellHistory) ? state.tier2SpellHistory : [];
      }

      if (!window.__tier2InitialStatePatched && typeof initialState === 'function') {
        window.__tier2InitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          state.tier2SpellHistory = [];
          return result;
        };
      }

      if (!window.__tier2SpellHistoryPatched && typeof playHandCardToSlot === 'function') {
        window.__tier2SpellHistoryPatched = true;
        const previousPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          const source = state.hand?.[index] ? cloneTemplate(state.hand[index]) : null;
          const result = previousPlay(index, targetIndex);
          if (result && source?.type === 'spell' && [1, 2].includes(number(source.tier))) {
            state.tier2SpellHistory = Array.isArray(state.tier2SpellHistory) ? state.tier2SpellHistory : [];
            state.tier2SpellHistory.push(source);
          }
          return result;
        };
      }

      if (!window.__tier2PerTurnResetPatched && typeof resetPerTurnCardState === 'function') {
        window.__tier2PerTurnResetPatched = true;
        const previousReset = resetPerTurnCardState;
        resetPerTurnCardState = function() {
          const result = previousReset();
          state.tier2SpellHistory = [];
          return result;
        };
      }

      window.addEventListener('acid-card-modules-ready', () => {
        installCoinEffect();
        installChangeToken();
      }, { once: true });

      window.__tier2MinionEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();