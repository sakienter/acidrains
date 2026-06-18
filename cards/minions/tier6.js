/* Tier 6 minion definitions and authoritative effects. */
(() => {
  const modules = window.AcidCardModules;
  const num = value => Number(value || 0);
  const amount = (card, normal, awakened) => card?.awakened ? awakened : normal;
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
  const say = message => { if (typeof log === 'function' && message) log(message); };
  const pick = pool => pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  const clone = card => typeof initializedClone === 'function'
    ? initializedClone(card)
    : typeof cloneCard === 'function' ? cloneCard(card) : { ...card };
  const eligible = cards => (cards || []).filter(card => card && !card.token && card.shopEligible !== false);

  const HEAT_PUNCH = Object.freeze({
    id:'heat_punch_token',
    name:'熱血パンチ',
    emoji:'👊',
    tier:6,
    cost:0,
    type:'spell',
    token:true,
    shopEligible:false,
    text:'効果は未設定。',
    cast(){ say('熱血パンチの効果はまだ設定されていない。'); },
  });

  function addCard(gameState, template, message = '') {
    if (!template) return false;
    if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
      say('手札がいっぱい。');
      return false;
    }
    if (typeof gainCardToHand === 'function') return gainCardToHand(gameState, clone(template), message) !== false;
    gameState.hand.push(clone(template));
    say(message);
    return true;
  }

  function gainMany(gameState, template, count, message = '') {
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, template, index === 0 ? message : '')) break;
      gained += 1;
    }
    return gained;
  }

  function discover(gameState, pool, count, title) {
    const candidates = eligible(pool);
    if (!candidates.length) {
      say(`${title}：候補がない。`);
      return 0;
    }
    if (typeof discoverCards === 'function') {
      discoverCards(gameState, candidates, count, title);
      return count;
    }
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, pick(candidates), index === 0 ? title : '')) break;
      gained += 1;
    }
    return gained;
  }

  function chooseHandSpell(gameState, maximumTier) {
    const entries = (gameState.hand || [])
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.card?.type === 'spell' && num(entry.card.tier) <= maximumTier);
    if (!entries.length) return null;
    if (entries.length === 1 || typeof window.prompt !== 'function') return entries[0].card;
    const lines = entries.map((entry, index) => `${index + 1}. ${entry.card.name}［ティア${entry.card.tier}］`).join('\n');
    const answer = window.prompt(`コピーするスペルを選択\n${lines}`, '1');
    return (entries[Number(answer) - 1] || entries[0]).card;
  }

  function gainGift(gameState, count) {
    const token = typeof TOKEN_CARDS !== 'undefined' ? TOKEN_CARDS.gift : null;
    if (!token) {
      say('お贈り物カードが設定されていない。');
      return 0;
    }
    return gainMany(gameState, token, count, 'お贈り物を得た。');
  }

  function createReplayMinion(spell) {
    const storedSpell = clone(spell);
    return {
      id:`magicfin_apprentice_${spell.id || 'spell'}_${Date.now()}_${Math.random()}`,
      name:'マジックフィンの弟子',
      emoji:'🪄',
      tier:6,
      cost:0,
      atk:1,
      hp:1,
      tribe:'なし',
      token:true,
      shopEligible:false,
      rememberedSpellId: storedSpell.id || '',
      rememberedSpellName: storedSpell.name || '',
      text:'雄叫び：買ったスペルを発動する。',
      battlecry(gameState) {
        if (typeof storedSpell.cast !== 'function') {
          say('記憶しているスペルを発動できない。');
          return false;
        }
        storedSpell.cast(gameState);
        if (typeof notifyBoard === 'function') notifyBoard('onSpellCast', gameState, storedSpell);
        say(`マジックフィンの弟子が${storedSpell.name}を発動した。`);
        return true;
      },
    };
  }

  function addTurnTime(gameState, seconds) {
    const gain = Math.max(0, num(seconds));
    if (!gain) return 0;
    const shouldResume = !gameState.isPaused
      && gameState.hasStarted
      && !gameState.gameOver
      && typeof pauseAcidTurnTimer === 'function'
      && typeof resumeAcidTurnTimer === 'function';
    if (shouldResume) pauseAcidTurnTimer();
    gameState.turnTimeRemaining = Math.max(0, num(gameState.turnTimeRemaining)) + gain;
    gameState.turnTimeLimit = Math.max(num(gameState.turnTimeLimit), gameState.turnTimeRemaining);
    if (shouldResume) resumeAcidTurnTimer();
    say(`このターンの残り時間が${gain}秒増えた。`);
    return gain;
  }

  function addPersistentRightmostBuff(gameState, value) {
    const gain = Math.max(0, num(value));
    gameState.tier1DuneAfterRerollAtk = num(gameState.tier1DuneAfterRerollAtk) + gain;
    gameState.tier1DuneAfterRerollHp = num(gameState.tier1DuneAfterRerollHp) + gain;
    say(`次回以降の酒場入替後、右端への強化に+${gain}/+${gain}を追加した。`);
  }

  function gainUnbuffedCopies(gameState, sold, count) {
    const template = MINIONS.find(card => card?.id === sold?.id)
      || MINIONS.find(card => card?.name === sold?.name && num(card.tier) === num(sold.tier));
    if (!template) return 0;
    return gainMany(gameState, template, count, `${sold.name}の未強化コピーを得た。`);
  }

  function extendBoardToEight(gameState) {
    while ((gameState.board || []).length < 10) gameState.board.push(null);
    gameState.boardSlotLimit = 8;
    say('自陣のミニオン枠が8枠になった。');
    return true;
  }

  const DEFINITIONS = [
    { id:'tier6_akari', name:'アカリ', emoji:'🔥', cost:3, atk:6, hp:6, tribe:'獣', text:'雄叫び：手札のティア5以下のスペルを1枚選び、そのコピーを1枚手札に追加する。', awakenedText:'雄叫び：手札のティア5以下のスペルを1枚選び、そのコピーを2枚手札に追加する。' },
    { id:'tier6_maxwell', name:'マクスウェル', emoji:'🎁', cost:3, atk:1, hp:1, tribe:'獣', text:'このカードを売った時、「お贈り物」を1枚得る。', awakenedText:'このカードを売った時、「お贈り物」を2枚得る。' },
    { id:'tier6_hotblood_fin', name:'熱血フィン', emoji:'🔥', cost:3, atk:25, hp:25, tribe:'マーロック', text:'このカードを売った時、「熱血パンチ」を1枚得る。', awakenedText:'このカードを売った時、「熱血パンチ」を2枚得る。' },
    { id:'tier6_magic_fin', name:'マジックフィン', emoji:'🪄', cost:3, atk:3, hp:5, tribe:'マーロック', text:'このカードが自陣にいる限り、自分がスペルを買うと、「雄叫び：買ったスペルを発動する。」を持つ「マジックフィンの弟子」を1枚得る。（1ターンに1度）', awakenedText:'このカードが自陣にいる限り、自分がスペルを買うと、「雄叫び：買ったスペルを発動する。」を持つ「マジックフィンの弟子」を1枚得る。（1ターンに2度）' },
    { id:'tier6_heat_lover', name:'熱を愛す男', emoji:'☀️', cost:3, atk:10, hp:8, tribe:'海賊', text:'このカードが自陣にいる際に、残り時間が増えた時、この対戦中に酒場を入替した後、その右端のミニオン1体に+X/+Xを付与する。（Xは増えた時間）（1ターンに3回）', awakenedText:'このカードが自陣にいる際に、残り時間が増えた時、この対戦中に酒場を入替した後、その右端のミニオン1体に+X/+Xを付与する。（Xは増えた時間）（1ターンに6回）' },
    { id:'tier6_timekeeper', name:'タイムキーパー', emoji:'⏱️', cost:3, atk:6, hp:6, tribe:'ナーガ', text:'このカードが自陣にいる限り、自分が5回スペルを使うと、このターンの残り時間を15秒増やす。（1ターンに3回）', awakenedText:'このカードが自陣にいる限り、自分が5回スペルを使うと、このターンの残り時間を30秒増やす。（1ターンに3回）' },
    { id:'tier6_timewarped_seer', name:'時渡りの預言者', emoji:'⏳', cost:3, atk:8, hp:8, tribe:'ナーガ', text:'このカードが自陣にいる限り、スペルが3コスト軽く買える。ただし0にはならない。', awakenedText:'このカードが自陣にいる限り、スペルが3コスト軽く買える。' },
    { id:'tier6_outland_sunlight', name:'アウトランドの日光', emoji:'🌋', cost:3, atk:4, hp:5, tribe:'エレメンタル', text:'雄叫び：コスト4以上の呪文を1枚発見する。', awakenedText:'雄叫び：コスト4以上の呪文を2枚発見する。' },
    { id:'tier6_lantern_larva', name:'ランタンラーバ', emoji:'🏮', cost:3, atk:5, hp:5, tribe:'エレメンタル', text:'自分がエレメンタルを売った時、そのカードの未強化コピーを獲得する。（1ターンに1度）', awakenedText:'自分がエレメンタルを売った時、そのカードの未強化コピーを2枚獲得する。（1ターンに1度）' },
    { id:'tier6_reno', name:'レノ', emoji:'🎩', cost:3, atk:10, hp:10, tribe:'なし', text:'このカードを売った時、残り時間が0秒から20秒なら、60秒追加する。', awakenedText:'このカードを売った時、残り時間が0秒から20秒なら、120秒追加する。' },
    { id:'tier6_skyform', name:'スカイフォルム', emoji:'☁️', cost:3, atk:10, hp:1, tribe:'なし', text:'雄叫び：自陣を7枠ではなく8枠にする。', awakenedText:'雄叫び：自陣を7枠ではなく8枠にする。' },
  ];

  const EFFECTS = {
    'アカリ': () => ({ battlecry(gameState){
      const selected = chooseHandSpell(gameState, 5);
      if (!selected) return say('手札にティア5以下のスペルがない。');
      gainMany(gameState, selected, amount(this, 1, 2), `${selected.name}のコピーを得た。`);
    } }),
    'マクスウェル': () => ({ onSell(gameState){ gainGift(gameState, amount(this, 1, 2)); } }),
    '熱血フィン': () => ({ onSell(gameState){ gainMany(gameState, HEAT_PUNCH, amount(this, 1, 2), '熱血パンチを得た。'); } }),
    'マジックフィン': () => ({
      init(card){ card.turnTriggers = Math.max(0, num(card.turnTriggers)); },
      onSpellBought(gameState, spell){
        const limit = amount(this, 1, 2);
        if (num(this.turnTriggers) >= limit || !spell) return;
        this.turnTriggers = num(this.turnTriggers) + 1;
        addCard(gameState, createReplayMinion(spell), 'マジックフィンの弟子を得た。');
      },
    }),
    '熱を愛す男': () => ({
      init(card){ card.turnTriggers = Math.max(0, num(card.turnTriggers)); },
      onTimeGained(gameState, seconds){
        const limit = amount(this, 3, 6);
        if (num(this.turnTriggers) >= limit) return;
        this.turnTriggers = num(this.turnTriggers) + 1;
        addPersistentRightmostBuff(gameState, seconds);
      },
    }),
    'タイムキーパー': () => ({
      init(card){ card.turnTriggers = Math.max(0, num(card.turnTriggers)); card.spellProgress = Math.max(0, num(card.spellProgress)); },
      onSpellCast(gameState){
        if (num(this.turnTriggers) >= 3) return;
        this.spellProgress = num(this.spellProgress) + 1;
        while (this.spellProgress >= 5 && num(this.turnTriggers) < 3) {
          this.spellProgress -= 5;
          this.turnTriggers = num(this.turnTriggers) + 1;
          addTurnTime(gameState, this.awakened ? 30 : 15);
        }
      },
    }),
    '時渡りの預言者': () => ({ aura(gameState){
      gameState.spellPurchaseDiscount = Math.max(num(gameState.spellPurchaseDiscount), 3);
      if (this.awakened) gameState.spellDiscountCanReachZero = true;
    } }),
    'アウトランドの日光': () => ({ battlecry(gameState){
      discover(gameState, SPELLS.filter(card => num(card.cost) >= 4 && num(card.tier) <= num(gameState.tavernTier)), amount(this, 1, 2), 'アウトランドの日光：コスト4以上の呪文を発見');
    } }),
    'ランタンラーバ': () => ({
      init(card){ card.turnTriggers = Math.max(0, num(card.turnTriggers)); },
      onElementalSold(gameState, sold){
        if (num(this.turnTriggers) >= 1 || !sold) return;
        this.turnTriggers = 1;
        gainUnbuffedCopies(gameState, sold, amount(this, 1, 2));
      },
    }),
    'レノ': () => ({ onSell(gameState){
      const remaining = Math.max(0, num(gameState.turnTimeRemaining));
      if (remaining <= 20) addTurnTime(gameState, amount(this, 60, 120));
    } }),
    'スカイフォルム': () => ({ battlecry(gameState){ extendBoardToEight(gameState); } }),
  };

  function installRuntime() {
    if (window.__tier6MinionRuntimeInstalled) return;
    window.__tier6MinionRuntimeInstalled = true;

    if (typeof updateAuras === 'function') {
      const previousUpdateAuras = updateAuras;
      updateAuras = function() {
        state.spellPurchaseDiscount = 0;
        state.spellDiscountCanReachZero = false;
        return previousUpdateAuras();
      };
    }

    if (typeof buyCard === 'function') {
      const previousBuy = buyCard;
      buyCard = function(index) {
        const card = state.shop?.[index] || null;
        if (!card || card.type !== 'spell') return previousBuy(index);
        const originalCost = num(card.cost);
        const permanentDiscount = Math.max(0, num(state.spellPurchaseDiscount));
        const minimumCost = state.spellDiscountCanReachZero ? 0 : 1;
        const temporaryCost = Math.max(minimumCost, originalCost - permanentDiscount);
        const handIndex = (state.hand || []).length;
        card.cost = temporaryCost;
        try {
          const result = previousBuy(index);
          if (result && state.hand?.[handIndex]?.type === 'spell') state.hand[handIndex].cost = originalCost;
          return result;
        } finally {
          if (state.shop?.[index] === card) card.cost = originalCost;
        }
      };
    }

    if (typeof renderShop === 'function') {
      const previousRenderShop = renderShop;
      renderShop = function() {
        const originals = (state.shop || []).map(card => card?.type === 'spell' ? num(card.cost) : null);
        (state.shop || []).forEach((card, index) => {
          if (!card || card.type !== 'spell') return;
          const minimumCost = state.spellDiscountCanReachZero ? 0 : 1;
          card.cost = Math.max(minimumCost, originals[index] - Math.max(0, num(state.spellPurchaseDiscount)));
        });
        try {
          return previousRenderShop();
        } finally {
          (state.shop || []).forEach((card, index) => {
            if (card?.type === 'spell' && originals[index] !== null) card.cost = originals[index];
          });
        }
      };
    }

    if (typeof resetPerTurnCardState === 'function') {
      const previousReset = resetPerTurnCardState;
      resetPerTurnCardState = function() {
        const result = previousReset();
        (state.board || []).forEach(card => {
          if (!card) return;
          if (card.name === 'タイムキーパー') card.spellProgress = 0;
        });
        return result;
      };
    }

    let lastTurn = num(state.turn);
    let lastRemaining = num(state.turnTimeRemaining);
    let reportingTimeGain = false;
    if (typeof render === 'function') {
      const previousRender = render;
      render = function() {
        const currentTurn = num(state.turn);
        const currentRemaining = num(state.turnTimeRemaining);
        if (currentTurn !== lastTurn) {
          lastTurn = currentTurn;
          lastRemaining = currentRemaining;
        } else if (!reportingTimeGain && currentRemaining > lastRemaining) {
          const gained = currentRemaining - lastRemaining;
          lastRemaining = currentRemaining;
          reportingTimeGain = true;
          try {
            if (typeof notifyBoard === 'function') notifyBoard('onTimeGained', state, gained);
          } finally {
            reportingTimeGain = false;
          }
        } else {
          lastRemaining = currentRemaining;
        }
        const result = previousRender();
        const slots = Math.max(7, (state.board || []).length - 2);
        if (typeof boardSlotsEl !== 'undefined' && boardSlotsEl) {
          boardSlotsEl.style.gridTemplateColumns = `repeat(${slots >= 8 ? 8 : 7}, minmax(0, 1fr))`;
        }
        return result;
      };
    }

    updateAuras?.();
    render?.();
  }

  const allowedNames = new Set(DEFINITIONS.map(card => card.name));
  for (let index = MINIONS.length - 1; index >= 0; index -= 1) {
    const card = MINIONS[index];
    if (num(card?.tier) !== 6) continue;
    if (allowedNames.has(String(card?.name || '').trim())) continue;
    MINIONS.splice(index, 1);
  }

  modules.register({
    kind:'minion',
    tier:6,
    label:'ティア6・ミニオン',
    definitions:DEFINITIONS,
    effects:EFFECTS,
    apply(){
      const schedule = () => window.setTimeout(installRuntime, 40);
      if (document.readyState === 'complete') schedule();
      else window.addEventListener('load', schedule, { once:true });
      window.__tier6MinionEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();