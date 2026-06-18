/* Tier 3 minion definitions and authoritative effect implementations. */
(() => {
  const modules = window.AcidCardModules;
  const number = value => Number(value || 0);
  const amount = (card, normal, awakened) => card?.awakened ? awakened : normal;
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

  function playablePool(cards) {
    return (cards || []).filter(card => card && !card.token && card.shopEligible !== false);
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

  function gainMany(gameState, template, count, message = '', extra = {}) {
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, template, index === 0 ? message : '', extra)) break;
      gained += 1;
    }
    return gained;
  }

  function gainNamedSpell(gameState, name, count, extra = {}) {
    const template = SPELLS.find(card => card?.name === name);
    if (!template) {
      writeLog(`${name} がスペルプールに見つからない。`);
      return 0;
    }
    return gainMany(gameState, template, count, `${name} を得た。`, extra);
  }

  function gainNamedMinion(gameState, name, count) {
    const template = MINIONS.find(card => card?.name === name);
    if (!template) {
      writeLog(`${name} がミニオンプールに見つからない。`);
      return 0;
    }
    return gainMany(gameState, template, count, `${name} を得た。`);
  }

  function copyRandomHandSpell(gameState, maximumTier) {
    const pool = (gameState.hand || []).filter(card =>
      card?.type === 'spell' && number(card.tier) <= maximumTier
    );
    const selected = randomCard(pool);
    if (!selected) {
      writeLog(`手札にティア${maximumTier}以下のスペルがない。`);
      return false;
    }
    return addCard(gameState, selected, `${selected.name} のコピーを得た。`);
  }

  function gainRandomCostSpell(gameState, cost, count) {
    const pool = playablePool(SPELLS).filter(card => number(card.cost) === cost);
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      const selected = randomCard(pool);
      if (!selected || !addCard(gameState, selected, index === 0 ? `コスト${cost}のスペルを得た。` : '')) break;
      gained += 1;
    }
    return gained;
  }

  function gainRandomNamedSpell(gameState, names, count) {
    const pool = names
      .map(name => SPELLS.find(card => card?.name === name))
      .filter(Boolean);
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      const selected = randomCard(pool);
      if (!selected || !addCard(gameState, selected, index === 0 ? `${selected.name} を得た。` : '')) break;
      gained += 1;
    }
    return gained;
  }

  function triggerDestroyed(gameState, card, index = -1) {
    if (!card || typeof card.onDestroyed !== 'function') return false;
    card.onDestroyed(gameState, index);
    return true;
  }

  window.triggerAcidMinionDestroyed = triggerDestroyed;

  function installBurntPirateFlagDestruction() {
    const spell = SPELLS.find(card => card?.name === '燃えた海賊旗');
    if (!spell) return false;

    spell.cast = function(gameState) {
      const targets = (gameState.board || [])
        .map((card, index) => ({ card, index }))
        .filter(entry => entry.index >= 2 && entry.card?.tribe === '海賊');

      targets.forEach(({ card, index }) => {
        triggerDestroyed(gameState, card, index);
        if (typeof card.deathrattle === 'function') {
          const triggerCount = card.reborn ? 2 : 1;
          for (let trigger = 0; trigger < triggerCount; trigger += 1) {
            card.deathrattle(gameState, index);
          }
        }
        gameState.board[index] = null;
      });

      const spellPool = playablePool(SPELLS).filter(card =>
        number(card.tier) <= Math.max(1, number(gameState.tavernTier, 1))
      );
      for (let index = 0; index < 2; index += 1) {
        const selected = randomCard(spellPool);
        if (!selected || !addCard(gameState, selected, index === 0 ? 'ランダムなスペルを2枚得た。' : '')) break;
      }

      if (targets.length) writeLog(`自陣の海賊${targets.length}体を破壊した。`);
      else writeLog('自陣に海賊はいなかった。');
      if (typeof updateAuras === 'function') updateAuras();
      return true;
    };
    return true;
  }

  const DEFINITIONS = [
    {
      id: 'tier3_trick_fin',
      name: 'トリックフィン',
      emoji: '🎩',
      cost: 3,
      atk: 4,
      hp: 4,
      tribe: 'マーロック',
      text: 'ターン終了時：「スペルボックス」を1枚得る。',
      awakenedText: 'ターン終了時：「スペルボックス」を2枚得る。',
    },
    {
      id: 'tier3_mirage_fin',
      name: 'ミラージュフィン',
      emoji: '🪞',
      cost: 3,
      atk: 1,
      hp: 1,
      tribe: 'マーロック',
      text: '雄叫び：手札のティア3以下のスペルをランダムに1枚増やす。',
      awakenedText: '雄叫び：手札のティア6以下のスペルをランダムに1枚増やす。',
    },
    {
      id: 'tier3_pirate_hunting_pirate',
      name: '海賊狩りの海賊',
      emoji: '🏴‍☠️',
      cost: 3,
      atk: 3,
      hp: 3,
      tribe: '海賊',
      text: 'ターン終了時：「燃えた海賊旗」を1枚得る。',
      awakenedText: 'このカードが破壊された時、「ハイティー」を1枚得る。',
    },
    {
      id: 'tier3_serious_pirate',
      name: '本気の海賊',
      emoji: '⚔️',
      cost: 3,
      atk: 7,
      hp: 7,
      tribe: '海賊',
      text: 'このカードが破壊された時、「ハイティー」を1枚得る。',
      awakenedText: 'このカードが破壊された時、「ハイティー」を1枚得る。',
    },
    {
      id: 'tier3_chibi_aze',
      name: 'チビアゼ',
      emoji: '⚡',
      cost: 3,
      atk: 4,
      hp: 3,
      tribe: 'エレメンタル',
      text: 'スペルを唱えるたび、この対戦中に酒場を入替した後、その右端のミニオン1体に+3/+3を付与する。',
      awakenedText: 'スペルを唱えるたび、この対戦中に酒場を入替した後、その右端のミニオン1体に+6/+6を付与する。',
    },
    {
      id: 'tier3_instant_lightning',
      name: '一瞬のライトニング',
      emoji: '🌩️',
      cost: 3,
      atk: 4,
      hp: 4,
      tribe: 'エレメンタル',
      text: '売却時：「どろみず」「カタログパラパラ」「閃光」のうちランダムに1枚得る。',
      awakenedText: '売却時：「どろみず」「カタログパラパラ」「閃光」のうちランダムに2枚得る。',
    },
    {
      id: 'tier3_reliquary_attendant',
      name: '聖遺会の従者',
      emoji: '🕯️',
      cost: 3,
      atk: 7,
      hp: 4,
      tribe: 'エレメンタル',
      text: '1ターンに1度、自分が呪文を使用した後、その呪文のコピーを1枚得る。',
      awakenedText: '1ターンに1度、自分が呪文を使用した後、その呪文のコピーを2枚得る。',
    },
    {
      id: 'tier3_dirty_money_naga',
      name: '悪銭ナーガ',
      emoji: '💸',
      cost: 3,
      atk: 4,
      hp: 1,
      tribe: 'ナーガ',
      text: '雄叫び：「弾けたコインポーチ」を1枚得る。',
      awakenedText: '雄叫び：「弾けたコインポーチ」を2枚得る。',
    },
    {
      id: 'tier3_shell_whistler',
      name: '貝笛師',
      emoji: '🐚',
      cost: 3,
      atk: 3,
      hp: 2,
      tribe: 'ナーガ',
      text: '雄叫び：ランダムなコスト2のスペルを1枚得る。',
      awakenedText: '雄叫び：ランダムなコスト2のスペルを1枚得る。',
    },
    {
      id: 'tier3_construction_business',
      name: '建設業',
      emoji: '🏗️',
      cost: 3,
      atk: 2,
      hp: 6,
      tribe: 'なし',
      text: 'ターン終了時：グレード上げのコストを2減らす。',
      awakenedText: 'ターン終了時：グレード上げのコストを4減らす。',
    },
    {
      id: 'tier3_royal_child',
      name: '王家の子',
      emoji: '👑',
      cost: 3,
      atk: 2,
      hp: 5,
      tribe: 'なし',
      text: '売却時：「万華鏡」を1枚得る。それはこのターン使えない。',
      awakenedText: '売却時：「万華鏡」を2枚得る。それらはこのターン使えない。',
    },
    {
      id: 'tier3_apprentice_marimo_user',
      name: '見習いマリモ使い',
      emoji: '🟢',
      cost: 3,
      atk: 1,
      hp: 1,
      tribe: 'なし',
      text: 'このカードは覚醒すると効果が変わる。',
      awakenedText: 'このカードを売った時、グレードを無視して「酸性降雨」を1枚得る。',
    },
    {
      id: 'tier3_cook',
      name: '料理人',
      emoji: '👨‍🍳',
      cost: 3,
      atk: 4,
      hp: 3,
      tribe: 'なし',
      text: '雄叫び：「シェフのおすすめ」を1枚得る。',
      awakenedText: '雄叫び：「シェフのおすすめ」を2枚得る。',
    },
  ];

  modules.register({
    kind: 'minion',
    tier: 3,
    label: 'ティア3・ミニオン',
    definitions: DEFINITIONS,
    effects: {
      'トリックフィン': () => ({
        onTurnEnd(gameState) {
          gainNamedSpell(gameState, 'スペルボックス', amount(this, 1, 2));
        },
      }),

      'ミラージュフィン': () => ({
        battlecry(gameState) {
          copyRandomHandSpell(gameState, this.awakened ? 6 : 3);
        },
      }),

      '海賊狩りの海賊': () => ({
        onTurnEnd(gameState) {
          if (!this.awakened) gainNamedSpell(gameState, '燃えた海賊旗', 1);
        },
        onDestroyed(gameState) {
          if (this.awakened) gainNamedSpell(gameState, 'ハイティー', 1);
        },
      }),

      '本気の海賊': () => ({
        onDestroyed(gameState) {
          gainNamedSpell(gameState, 'ハイティー', 1);
        },
      }),

      'チビアゼ': () => ({
        onSpellCast(gameState) {
          const buff = amount(this, 3, 6);
          gameState.tier1DuneAfterRerollAtk = number(gameState.tier1DuneAfterRerollAtk) + buff;
          gameState.tier1DuneAfterRerollHp = number(gameState.tier1DuneAfterRerollHp) + buff;
          writeLog(`チビアゼ：以後の酒場入替後バフが+${gameState.tier1DuneAfterRerollAtk}/+${gameState.tier1DuneAfterRerollHp}になった。`);
        },
      }),

      '一瞬のライトニング': () => ({
        onSell(gameState) {
          gainRandomNamedSpell(
            gameState,
            ['どろみず', 'カタログパラパラ', '閃光'],
            amount(this, 1, 2),
          );
        },
      }),

      '聖遺会の従者': () => ({
        init(card) {
          card.turnTriggers = 0;
        },
        onSpellCast(gameState, spell) {
          if (number(this.turnTriggers) >= 1 || !spell) return;
          this.turnTriggers = 1;
          gainMany(gameState, spell, amount(this, 1, 2), `${spell.name} のコピーを得た。`);
        },
      }),

      '悪銭ナーガ': () => ({
        battlecry(gameState) {
          gainNamedSpell(gameState, '弾けたコインポーチ', amount(this, 1, 2));
        },
      }),

      '貝笛師': () => ({
        battlecry(gameState) {
          gainRandomCostSpell(gameState, 2, 1);
        },
      }),

      '建設業': () => ({
        onTurnEnd(gameState) {
          gameState.tavernUpgradeDiscount = number(gameState.tavernUpgradeDiscount) + amount(this, 2, 4);
          writeLog(`建設業：グレードアップコストを${amount(this, 2, 4)}減らした。`);
        },
      }),

      '王家の子': () => ({
        onSell(gameState) {
          gainNamedSpell(gameState, '万華鏡', amount(this, 1, 2), {
            lockedUntilTurn: number(gameState.turn),
          });
        },
      }),

      '見習いマリモ使い': () => ({
        onSell(gameState) {
          if (this.awakened) gainNamedMinion(gameState, '酸性降雨', 1);
        },
      }),

      '料理人': () => ({
        battlecry(gameState) {
          gainNamedSpell(gameState, 'シェフのおすすめ', amount(this, 1, 2));
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.tier1DuneAfterRerollAtk = number(state.tier1DuneAfterRerollAtk);
        state.tier1DuneAfterRerollHp = number(state.tier1DuneAfterRerollHp);
      }

      window.addEventListener('acid-card-modules-ready', () => {
        installBurntPirateFlagDestruction();
      }, { once: true });

      window.addEventListener('load', () => {
        window.setTimeout(installBurntPirateFlagDestruction, 0);
      }, { once: true });

      window.__tier3MinionEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();