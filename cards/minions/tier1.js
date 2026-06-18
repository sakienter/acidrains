/* Tier 1 minion definitions and authoritative effect implementations. */
(() => {
  const modules = window.AcidCardModules;

  const number = value => Number(value || 0);
  const amount = (card, normal, awakened) => card?.awakened ? awakened : normal;
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;

  function writeLog(message) {
    if (typeof log === 'function' && message) log(message);
  }

  function randomCard(pool) {
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function cloneTemplate(template) {
    return typeof initializedClone === 'function'
      ? initializedClone(template)
      : { ...template };
  }

  function addCard(gameState, template, message = '', extra = {}) {
    if (!template) return false;
    if (gameState.hand.length >= handLimit()) {
      writeLog('手札がいっぱい。');
      return false;
    }

    const copy = { ...cloneTemplate(template), ...extra };
    if (copy.unlockTier && !copy.originalTextBeforeUnlock) {
      copy.originalTextBeforeUnlock = copy.text || '';
      copy.text = `${copy.originalTextBeforeUnlock}（酒場グレード${copy.unlockTier}まで使用不可）`;
    }

    if (typeof gainCardToHand === 'function') {
      return gainCardToHand(gameState, copy, message) !== false;
    }
    gameState.hand.push(copy);
    writeLog(message);
    return true;
  }

  function gainRandom(gameState, pool, count, message) {
    let gained = 0;
    for (let i = 0; i < count; i += 1) {
      const selected = randomCard(pool);
      if (!selected || !addCard(gameState, selected, i === 0 ? message : '')) break;
      gained += 1;
    }
    return gained;
  }

  function currentTierMinions(gameState, predicate = () => true) {
    const currentTier = Math.max(1, number(gameState.tavernTier));
    return MINIONS.filter(card => number(card.tier) <= currentTier && predicate(card));
  }

  function tierOneMinions(predicate = () => true) {
    return MINIONS.filter(card => number(card.tier) === 1 && predicate(card));
  }

  function tierOneSpells() {
    return SPELLS.filter(card => number(card.tier) === 1);
  }

  function sellTriggerCount(gameState, card) {
    const baseCount = amount(card, 1, 2);
    const permanentMultiplier = Math.max(1, number(gameState.sellEffectMultiplier) || 1);
    const nextMultiplier = Math.max(1, number(gameState.nextSellEffectMultiplier) || 1);
    gameState.nextSellEffectMultiplier = 1;
    return baseCount * permanentMultiplier * nextMultiplier;
  }

  function gainNamedSpell(gameState, name, count, extra = {}) {
    const template = SPELLS.find(card => card.name === name);
    if (!template) {
      writeLog(`${name} がカードプールに見つからない。`);
      return 0;
    }
    let gained = 0;
    for (let i = 0; i < count; i += 1) {
      if (!addCard(gameState, template, i === 0 ? `${name} を得た。` : '', extra)) break;
      gained += 1;
    }
    return gained;
  }

  function discoverTierOneTribeMinions(gameState, sourceCard, count) {
    const pool = tierOneMinions(card =>
      card.id !== sourceCard.id &&
      card.name !== sourceCard.name &&
      card.tribe &&
      !['なし', '育成', '贈り物'].includes(card.tribe)
    );
    if (!pool.length) {
      writeLog('発見できるティア1の種族ありミニオンがない。');
      return 0;
    }
    if (typeof discoverCards === 'function') {
      discoverCards(gameState, pool, count, '船頭：ティア1の種族ありミニオンを発見');
      return count;
    }
    return gainRandom(gameState, pool, count, 'ティア1の種族ありミニオンを得た。');
  }

  function fixedRightmostMinion(gameState) {
    if (!gameState || !Array.isArray(gameState.shop)) return null;
    const minionSlots = typeof window.getBaseShopMinionSlots === 'function'
      ? window.getBaseShopMinionSlots(gameState.tavernTier)
      : Math.min(6, 2 + Math.max(1, number(gameState.tavernTier)));
    const index = Math.max(0, number(minionSlots) - 1);
    const target = gameState.shop[index] || null;
    return target && target.type !== 'spell' ? target : null;
  }

  function applyDuneBuffAfterReroll(gameState) {
    const atk = number(gameState.tier1DuneAfterRerollAtk);
    const hp = number(gameState.tier1DuneAfterRerollHp);
    if (!atk && !hp) return false;
    const target = fixedRightmostMinion(gameState);
    if (!target) return false;
    target.atk = number(target.atk) + atk;
    target.hp = number(target.hp) + hp;
    target.tier1DuneBuffAtk = number(target.tier1DuneBuffAtk) + atk;
    target.tier1DuneBuffHp = number(target.tier1DuneBuffHp) + hp;
    writeLog(`酒場の右端のミニオンに+${atk}/+${hp}を付与した。`);
    return true;
  }

  const DEFINITIONS = [
    {
      id: 'excel_minion_1',
      name: '野良猫',
      emoji: '🐈',
      cost: 3,
      atk: 1,
      hp: 1,
      tribe: '獣',
      text: '雄叫び：猫トークンを1匹召喚する。',
      awakenedText: '雄叫び：猫トークンを2匹召喚する。',
    },
    {
      id: 'excel_minion_2',
      name: '威嚇するわんこ',
      emoji: '🐕',
      cost: 3,
      atk: 3,
      hp: 1,
      tribe: '獣',
      text: '売却時：「夢のエッセンス」を1枚得る。それは酒場グレード4まで使用できない。',
      awakenedText: '売却時：「夢のエッセンス」を2枚得る。それらは酒場グレード4まで使用できない。',
    },
    {
      id: 'excel_minion_3',
      name: 'ショールフィン',
      emoji: '🐟',
      cost: 3,
      atk: 2,
      hp: 2,
      tribe: 'マーロック',
      text: '8ゴールド使うたび、自分の酒場グレード以下のランダムなマーロックを1枚得る。',
      awakenedText: '8ゴールド使うたび、自分の酒場グレード以下のランダムなマーロックを2枚得る。',
    },
    {
      id: 'excel_minion_4',
      name: '船頭',
      emoji: '⛵',
      cost: 3,
      atk: 1,
      hp: 1,
      tribe: 'マーロック',
      text: '売却時：ティア1の種族ありミニオンを1枚発見する。',
      awakenedText: '売却時：ティア1の種族ありミニオンを2枚発見する。',
    },
    {
      id: 'excel_minion_5',
      name: '大道芸人',
      emoji: '🎪',
      cost: 3,
      atk: 3,
      hp: 1,
      tribe: '海賊',
      text: '雄叫び：次のターン、1ゴールド追加で得る。',
      awakenedText: '雄叫び：次のターン、2ゴールド追加で得る。',
    },
    {
      id: 'excel_minion_6',
      name: '甲板磨き',
      emoji: '🧹',
      cost: 3,
      atk: 2,
      hp: 2,
      tribe: '海賊',
      text: '雄叫び：現在の酒場アップコストを1下げる。',
      awakenedText: '雄叫び：現在の酒場アップコストを2下げる。',
    },
    {
      id: 'excel_minion_7',
      name: 'もりもり砂丘',
      emoji: '🏜️',
      cost: 3,
      atk: 3,
      hp: 2,
      tribe: 'エレメンタル',
      text: '雄叫び：この対戦中、酒場を入替した後、その右端のミニオン1体に+1/+1を付与する。',
      awakenedText: '雄叫び：この対戦中、酒場を入替した後、その右端のミニオン1体に+2/+2を付与する。',
    },
    {
      id: 'excel_minion_8',
      name: '苔マン',
      emoji: '🌿',
      cost: 3,
      atk: 4,
      hp: 1,
      tribe: 'エレメンタル',
      text: 'ターン終了時：この対戦中に酒場を入替した後、その右端のミニオン1体に+1/+2を付与する。',
      awakenedText: 'ターン終了時：この対戦中に酒場を入替した後、その右端のミニオン1体に+2/+4を付与する。',
    },
    {
      id: 'excel_minion_9',
      name: 'ガチ預言者',
      emoji: '🔮',
      cost: 3,
      atk: 1,
      hp: 3,
      tribe: 'ナーガ',
      text: '売却時：ランダムなティア1スペルを1枚得る。',
      awakenedText: '売却時：ランダムなティア1スペルを2枚得る。',
    },
    {
      id: 'excel_minion_10',
      name: '不吉な預言者',
      emoji: '🌑',
      cost: 3,
      atk: 2,
      hp: 1,
      tribe: 'ナーガ',
      text: '雄叫び：次に買うスペルは1ゴールド値下げされる。',
      awakenedText: '雄叫び：次に買うスペルは2ゴールド値下げされる。',
    },
  ];

  const IMPLEMENTED_NAMES = DEFINITIONS.map(card => card.name);

  modules.register({
    kind: 'minion',
    tier: 1,
    label: 'ティア1・ミニオン',
    definitions: DEFINITIONS,
    effects: {
      '野良猫': () => ({
        battlecry(gameState) {
          const count = amount(this, 1, 2);
          if (typeof summonToken === 'function') summonToken(gameState, 'cat', count);
        },
      }),

      '威嚇するわんこ': () => ({
        onSell(gameState) {
          gainNamedSpell(gameState, '夢のエッセンス', sellTriggerCount(gameState, this), {
            unlockTier: 4,
          });
        },
      }),

      'ショールフィン': () => ({
        init(card) {
          card.goldProgress = number(card.goldProgress);
        },
        onGoldSpent(gameState, spent) {
          this.goldProgress = number(this.goldProgress) + Math.max(0, number(spent));
          while (this.goldProgress >= 8) {
            this.goldProgress -= 8;
            gainRandom(
              gameState,
              currentTierMinions(gameState, card => card.tribe === 'マーロック' && card.id !== this.id),
              amount(this, 1, 2),
              'ショールフィンがマーロックを見つけた。',
            );
          }
        },
      }),

      '船頭': () => ({
        onSell(gameState) {
          discoverTierOneTribeMinions(gameState, this, sellTriggerCount(gameState, this));
        },
      }),

      '大道芸人': () => ({
        battlecry(gameState) {
          gameState.nextTurnGoldBonus = number(gameState.nextTurnGoldBonus) + amount(this, 1, 2);
        },
      }),

      '甲板磨き': () => ({
        battlecry(gameState) {
          gameState.tavernUpgradeDiscount = number(gameState.tavernUpgradeDiscount) + amount(this, 1, 2);
        },
      }),

      'もりもり砂丘': () => ({
        battlecry(gameState) {
          const buff = amount(this, 1, 2);
          gameState.tier1DuneAfterRerollAtk = number(gameState.tier1DuneAfterRerollAtk) + buff;
          gameState.tier1DuneAfterRerollHp = number(gameState.tier1DuneAfterRerollHp) + buff;
        },
      }),

      '苔マン': () => ({
        onTurnEnd(gameState) {
          const atk = amount(this, 1, 2);
          const hp = amount(this, 2, 4);
          gameState.tier1DuneAfterRerollAtk = number(gameState.tier1DuneAfterRerollAtk) + atk;
          gameState.tier1DuneAfterRerollHp = number(gameState.tier1DuneAfterRerollHp) + hp;
          writeLog(`苔マン：以後の酒場入替後バフが+${gameState.tier1DuneAfterRerollAtk}/+${gameState.tier1DuneAfterRerollHp}になった。`);
        },
      }),

      'ガチ預言者': () => ({
        onSell(gameState) {
          gainRandom(
            gameState,
            tierOneSpells(),
            sellTriggerCount(gameState, this),
            'ランダムなティア1スペルを得た。',
          );
        },
      }),

      '不吉な預言者': () => ({
        battlecry(gameState) {
          gameState.nextSpellDiscount = number(gameState.nextSpellDiscount) + amount(this, 1, 2);
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.tier1DuneAfterRerollAtk = number(state.tier1DuneAfterRerollAtk);
        state.tier1DuneAfterRerollHp = number(state.tier1DuneAfterRerollHp);
        state.tier1DuneLastAppliedReroll = number(state.rerolls);
      }

      if (!window.__tier1DuneDrawShopPatched && typeof drawShop === 'function') {
        window.__tier1DuneDrawShopPatched = true;
        const previousDrawShop = drawShop;
        drawShop = function() {
          const result = previousDrawShop();
          const rerolls = number(state.rerolls);
          const lastApplied = number(state.tier1DuneLastAppliedReroll);
          if (rerolls > lastApplied) {
            applyDuneBuffAfterReroll(state);
            state.tier1DuneLastAppliedReroll = rerolls;
          }
          return result;
        };
      }

      if (!window.__tier1DuneInitialStatePatched && typeof initialState === 'function') {
        window.__tier1DuneInitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          state.tier1DuneAfterRerollAtk = 0;
          state.tier1DuneAfterRerollHp = 0;
          state.tier1DuneLastAppliedReroll = 0;
          return result;
        };
      }

      window.__tier1MinionEffectsImplemented = [...IMPLEMENTED_NAMES];
      window.__tier1MinionMissingDefinitions = IMPLEMENTED_NAMES.filter(name =>
        !MINIONS.some(card => String(card?.name || '').trim() === name)
      );
      if (window.__tier1MinionMissingDefinitions.length) {
        console.warn('[Tier1Minions] Effect implementation exists, but card data is missing:', window.__tier1MinionMissingDefinitions);
      }
    },
  });
})();
