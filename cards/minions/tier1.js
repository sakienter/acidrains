/* acidcards.csv: Tier 1 minions and authoritative effect implementations. */
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

  function addCard(gameState, template, message = '') {
    if (!template) return false;
    if (gameState.hand.length >= handLimit()) {
      writeLog('手札がいっぱい。');
      return false;
    }
    if (typeof gainCardToHand === 'function') {
      return gainCardToHand(gameState, template, message) !== false;
    }
    const copy = typeof initializedClone === 'function'
      ? initializedClone(template)
      : { ...template };
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

  function tierOneMinions() {
    return MINIONS.filter(card => number(card.tier) === 1);
  }

  function tierOneSpells() {
    return SPELLS.filter(card => number(card.tier) === 1);
  }

  function sellTriggerCount(gameState, card) {
    const normalCount = amount(card, 1, 2);
    const permanentMultiplier = Math.max(1, number(gameState.sellEffectMultiplier) || 1);
    const nextMultiplier = Math.max(1, number(gameState.nextSellEffectMultiplier) || 1);
    gameState.nextSellEffectMultiplier = 1;
    return normalCount * permanentMultiplier * nextMultiplier;
  }

  function gainNamedSpell(gameState, name, count, extra = {}) {
    const template = SPELLS.find(card => card.name === name);
    if (!template) {
      writeLog(`${name} がカードプールに見つからない。`);
      return 0;
    }
    let gained = 0;
    for (let i = 0; i < count; i += 1) {
      if (!addCard(gameState, { ...template, ...extra }, i === 0 ? `${name} を得た。` : '')) break;
      gained += 1;
    }
    return gained;
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
    if (!atk && !hp) return;
    const target = fixedRightmostMinion(gameState);
    if (!target) return;
    target.atk = number(target.atk) + atk;
    target.hp = number(target.hp) + hp;
    target.tier1DuneBuffAtk = number(target.tier1DuneBuffAtk) + atk;
    target.tier1DuneBuffHp = number(target.tier1DuneBuffHp) + hp;
  }

  modules.register({
    kind: 'minion',
    tier: 1,
    label: 'ティア1・ミニオン',
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
        onGoldSpent(gameState, spent) {
          this.goldProgress = number(this.goldProgress) + Math.max(0, number(spent));
          while (this.goldProgress >= 8) {
            this.goldProgress -= 8;
            gainRandom(
              gameState,
              currentTierMinions(gameState, card => card.tribe === 'マーロック'),
              amount(this, 1, 2),
              'ショールフィンがマーロックを見つけた。',
            );
          }
        },
      }),

      '船頭': () => ({
        onSell(gameState) {
          gainRandom(
            gameState,
            tierOneMinions(),
            sellTriggerCount(gameState, this),
            'ランダムなティア1ミニオンを得た。',
          );
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
        text: 'ターン終了時：この対戦中に酒場を入替した後、その右端のミニオン1体に+1/+2を付与する。',
        awakenedText: 'ターン終了時：この対戦中に酒場を入替した後、その右端のミニオン1体に+2/+2を付与する。',
        onTurnEnd(gameState) {
          const atk = amount(this, 1, 2);
          const hp = 2;
          gameState.tier1DuneAfterRerollAtk = number(gameState.tier1DuneAfterRerollAtk) + atk;
          gameState.tier1DuneAfterRerollHp = number(gameState.tier1DuneAfterRerollHp) + hp;
          writeLog(`苔マン：以後の酒場入替後バフが +${gameState.tier1DuneAfterRerollAtk}/+${gameState.tier1DuneAfterRerollHp} になった。`);
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

      window.__tier1MinionEffectsImplemented = [
        '野良猫',
        '威嚇するわんこ',
        'ショールフィン',
        '船頭',
        '大道芸人',
        '甲板磨き',
        'もりもり砂丘',
        '苔マン',
        'ガチ預言者',
        '不吉な預言者',
      ];
    },
  });
})();