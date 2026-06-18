/* Tier 5 minion definitions and authoritative effects. */
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

  function gainNamedSpell(gameState, name, count) {
    const template = SPELLS.find(card => card?.name === name);
    if (!template) {
      say(`${name} がスペルプールに見つからない。`);
      return 0;
    }
    return gainMany(gameState, template, count, `${name} を得た。`);
  }

  function gainNamedMinion(gameState, name, count) {
    const template = MINIONS.find(card => card?.name === name);
    if (!template) {
      say(`${name} がミニオンプールに見つからない。`);
      return 0;
    }
    return gainMany(gameState, template, count, `${name} を得た。`);
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

  function chooseHandMinion(gameState, excluded = new Set()) {
    const entries = (gameState.hand || [])
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.card && entry.card.type !== 'spell' && !entry.card.awakened && !excluded.has(entry.index));
    if (!entries.length) return null;
    if (entries.length === 1 || typeof window.prompt !== 'function') return entries[0];
    const lines = entries.map((entry, index) => `${index + 1}. ${entry.card.name}`).join('\n');
    const answer = window.prompt(`覚醒させる手札のミニオンを選択\n${lines}`, '1');
    return entries[Number(answer) - 1] || entries[0];
  }

  function awakenHandMinions(gameState, count) {
    const selectedIndexes = new Set();
    let awakened = 0;
    for (let index = 0; index < count; index += 1) {
      const selected = chooseHandMinion(gameState, selectedIndexes);
      if (!selected) break;
      selectedIndexes.add(selected.index);
      selected.card.awakened = true;
      if (selected.card.awakenedText) selected.card.text = selected.card.awakenedText;
      say(`${selected.card.name} を覚醒させた。`);
      awakened += 1;
    }
    if (!awakened) say('手札に覚醒できるミニオンがいない。');
    return awakened;
  }

  function increaseGoldLimit(gameState, value) {
    const gain = Math.max(0, num(value));
    if (!gain) return 0;
    gameState.startingGoldBonus = Math.max(0, num(gameState.startingGoldBonus)) + gain;
    gameState.maxGold = num(gameState.maxGold) + gain;
    say(`ゴールドの上限が${gain}増えた。`);
    return gain;
  }

  function discoverMissingTribes(gameState, source, count) {
    const present = new Set(
      (gameState.board || [])
        .filter((card, index) => index >= 2 && card && !['なし', '育成', ''].includes(String(card.tribe || '')))
        .map(card => String(card.tribe)),
    );
    const pool = MINIONS.filter(card => {
      const tribe = String(card?.tribe || 'なし');
      return !['なし', '育成', ''].includes(tribe)
        && !present.has(tribe)
        && num(card.tier) <= Math.max(1, num(gameState.tavernTier, 1))
        && card.id !== source.id;
    });
    return discover(gameState, pool, count, '磯の探検家：自陣にいない種族を発見');
  }

  function fixedRightmostMinion(gameState) {
    const slotCount = typeof window.getBaseShopMinionSlots === 'function'
      ? window.getBaseShopMinionSlots(gameState?.tavernTier)
      : Math.min(6, 2 + Math.max(1, num(gameState?.tavernTier, 1)));
    const target = gameState?.shop?.[Math.max(0, slotCount - 1)] || null;
    return target && target.type !== 'spell' ? target : null;
  }

  function syncAcidRain(card) {
    if (!card || card.id !== 'acidic_rain_copy') return card;
    const template = MINIONS.find(candidate => candidate?.id === 'acidic_rain_copy');
    if (template) {
      card.tier = 5;
      card.cost = 3;
      card.tribe = 'エレメンタル';
      card.text = card.awakened ? template.awakenedText : template.text;
      card.awakenedText = template.awakenedText;
    }
    card.rerollThreshold = 4;
    card.rerollProgress = Math.max(0, Math.floor(num(card.rerollProgress))) % 4;
    card.onRerollCount = function(gameState) {
      this.rerollProgress = Math.max(0, Math.floor(num(this.rerollProgress))) + 1;
      while (this.rerollProgress >= 4) {
        this.rerollProgress -= 4;
        const target = fixedRightmostMinion(gameState);
        if (!target) {
          say(`${this.name}：酒場の固定右端にミニオンがいないため、スタッツを得なかった。`);
          continue;
        }
        const multiplier = this.awakened ? 2 : 1;
        this.atk = num(this.atk) + num(target.atk) * multiplier;
        this.hp = num(this.hp) + num(target.hp) * multiplier;
        this.lastRerollTriggerAt = Date.now();
        say(`${this.name} が酒場右端の${target.atk}/${target.hp}を${multiplier}倍得た。`);
      }
    };
    return card;
  }

  const DEFINITIONS = [
    { id:'tier5_binge_tyranno', name:'ドカ食いティラノ', emoji:'🦖', cost:3, atk:8, hp:8, tribe:'獣', text:'ターン終了時：グレードを無視して「ドカ食い」を1枚得る。', awakenedText:'ターン終了時：グレードを無視して「ドカ食い」を2枚得る。' },
    { id:'tier5_golden_pomeranian', name:'ゴールデンポメラニアン', emoji:'🐕', cost:3, atk:5, hp:5, tribe:'獣', text:'ターン終了時：自分の手札のミニオン1枚を覚醒させる。', awakenedText:'ターン終了時：自分の手札のミニオン2枚を覚醒させる。' },
    { id:'tier5_watch_fin', name:'見張りフィン', emoji:'👀', cost:3, atk:5, hp:2, tribe:'マーロック', text:'雄叫び：自陣にマーロックがいるなら、マーロックを1枚発見する。', awakenedText:'雄叫び：自陣にマーロックがいるなら、マーロックを2枚発見する。' },
    { id:'tier5_sneer_fin', name:'冷笑フィン', emoji:'😏', cost:3, atk:2, hp:8, tribe:'マーロック', text:'雄叫び：自陣に覚醒したミニオンがいるなら、自分のティアのスペルを1枚発見する。', awakenedText:'雄叫び：自陣に覚醒したミニオンがいるなら、自分のティアのスペルを2枚発見する。' },
    { id:'tier5_foresight_pirate', name:'先見性のある海賊', emoji:'🔮', cost:3, atk:4, hp:5, tribe:'海賊', text:'自分がゴールドを4回獲得した後、ランダムなスペルを1枚得る。', awakenedText:'自分がゴールドを4回獲得した後、ランダムなスペルを2枚得る。' },
    { id:'tier5_gold_hoarder', name:'金の亡者', emoji:'🤑', cost:3, atk:8, hp:4, tribe:'海賊', text:'このカードが自陣にいる限り、10Gを消費するたび、ゴールドの上限を1増やす。', awakenedText:'このカードが自陣にいる限り、10Gを消費するたび、ゴールドの上限を2増やす。' },
    { id:'tier5_atlantis_marimo', name:'アトランティスのまりも', emoji:'🌊', cost:3, atk:9, hp:9, tribe:'海賊', text:'このカードが破壊された時、グレードを無視して「酸性降雨」を1枚得る。', awakenedText:'このカードが破壊された時、グレードを無視して「酸性降雨」を2枚得る。' },
    { id:'tier5_wind_child', name:'風雲児', emoji:'🍃', cost:3, atk:4, hp:4, tribe:'エレメンタル', text:'このカードを売った時、エレメンタルを1枚発見する。', awakenedText:'このカードを売った時、エレメンタルを2枚発見する。' },
    { id:'tier5_air_revenant', name:'エアーレヴナント', emoji:'🌬️', cost:3, atk:4, hp:8, tribe:'エレメンタル', text:'このカードが自陣にいる限り、6コイン使う度に、「東からの風」を1枚得る。', awakenedText:'このカードが自陣にいる限り、6コイン使う度に、「東からの風」を2枚得る。' },
    { id:'tier5_recycle_wraith', name:'リサイクルレイス', emoji:'♻️', cost:3, atk:4, hp:6, tribe:'エレメンタル', text:'このカードが自陣にいる限り、エレメンタルを場に出すたび、次の1回のリロールコストが0になる。', awakenedText:'このカードが自陣にいる限り、エレメンタルを場に出すたび、次の2回のリロールコストが0になる。' },
    { id:'tier5_gonnix_scale', name:'ゴニックスケイル', emoji:'🐍', cost:3, atk:5, hp:5, tribe:'ナーガ', text:'売却時、グレードを無視して「夢のエッセンス」を1枚得る。', awakenedText:'売却時、グレードを無視して「夢のエッセンス」を1枚得る。' },
    { id:'tier5_shore_explorer', name:'磯の探検家', emoji:'🧭', cost:3, atk:4, hp:4, tribe:'なし', text:'雄叫び：自陣にいない種族のミニオンを1体発見する。', awakenedText:'雄叫び：自陣にいない種族のミニオンを2体発見する。' },
    { id:'tier5_counterfeit_seller', name:'贋作売り', emoji:'🎭', cost:3, atk:3, hp:6, tribe:'なし', text:'このカードが自陣にいる限り、自分のミニオンを売った時の効果は2回発動する。', awakenedText:'このカードが自陣にいる限り、自分のミニオンを売った時の効果は3回発動する。' },
    { id:'tier5_brann', name:'ブラン', emoji:'🦁', cost:3, atk:2, hp:4, tribe:'なし', text:'このカードが自陣にいる限り、自分の雄叫びは2回発動する。', awakenedText:'このカードが自陣にいる限り、自分の雄叫びは3回発動する。' },
    { id:'tier5_drakkari', name:'ドラッカリ', emoji:'🌙', cost:3, atk:1, hp:5, tribe:'なし', text:'自分のターンの終了時に発動する効果は2回発動する。', awakenedText:'自分のターンの終了時に発動する効果は3回発動する。' },
    { id:'tier5_rodeo_master', name:'ロデオ名人', emoji:'🤠', cost:3, atk:3, hp:4, tribe:'なし', text:'雄叫び：呪文を1枚発見する。', awakenedText:'雄叫び：呪文を2枚発見する。' },
    { id:'tier5_beacon', name:'ビーコン', emoji:'🕯️', cost:3, atk:4, hp:4, tribe:'なし', text:'雄叫び：自分のティアのカードを1枚発見する。', awakenedText:'雄叫び：自分のティアのカードを2枚発見する。' },
    { id:'acidic_rain_copy', name:'酸性降雨', emoji:'🌧️', cost:3, atk:6, hp:6, tribe:'エレメンタル', text:'このカードが自陣にいる限り、自分が4回のリロールをすると、酒場の右端のミニオンのスタッツを得る。', awakenedText:'このカードが自陣にいる限り、自分が4回のリロールをすると、酒場の右端のミニオンのスタッツを2倍得る。' },
  ];

  const EFFECTS = {
    'ドカ食いティラノ': () => ({ onTurnEnd(gameState){ gainNamedSpell(gameState, 'ドカ食い', amount(this, 1, 2)); } }),
    'ゴールデンポメラニアン': () => ({ onTurnEnd(gameState){ awakenHandMinions(gameState, amount(this, 1, 2)); } }),
    '見張りフィン': () => ({ battlecry(gameState){
      const hasMurloc = (gameState.board || []).some((card, index) => index >= 2 && card?.tribe === 'マーロック');
      if (!hasMurloc) return say('自陣にマーロックがいないため、見張りフィンは不発だった。');
      discover(gameState, MINIONS.filter(card => card.tribe === 'マーロック' && num(card.tier) <= num(gameState.tavernTier) && card.id !== this.id), amount(this, 1, 2), '見張りフィン：マーロックを発見');
    } }),
    '冷笑フィン': () => ({ battlecry(gameState){
      const hasAwakened = (gameState.board || []).some((card, index) => index >= 2 && card?.awakened);
      if (!hasAwakened) return say('自陣に覚醒ミニオンがいないため、冷笑フィンは不発だった。');
      discover(gameState, SPELLS.filter(card => num(card.tier) === num(gameState.tavernTier)), amount(this, 1, 2), '冷笑フィン：自分のティアのスペルを発見');
    } }),
    '先見性のある海賊': () => ({
      init(card){ card.goldGainProgress = Math.max(0, num(card.goldGainProgress)); },
      onGoldGained(gameState){
        this.goldGainProgress = num(this.goldGainProgress) + 1;
        while (this.goldGainProgress >= 4) {
          this.goldGainProgress -= 4;
          const pool = eligible(SPELLS).filter(card => num(card.tier) <= num(gameState.tavernTier));
          for (let index = 0; index < amount(this, 1, 2); index += 1) addCard(gameState, pick(pool), index ? '' : '先見性のある海賊がスペルを得た。');
        }
      },
    }),
    '金の亡者': () => ({
      init(card){ card.goldSpentProgress = Math.max(0, num(card.goldSpentProgress)); },
      onGoldSpent(gameState, spent){
        this.goldSpentProgress = num(this.goldSpentProgress) + Math.max(0, num(spent));
        while (this.goldSpentProgress >= 10) {
          this.goldSpentProgress -= 10;
          increaseGoldLimit(gameState, amount(this, 1, 2));
        }
      },
    }),
    'アトランティスのまりも': () => ({ onDestroyed(gameState){ gainNamedMinion(gameState, '酸性降雨', amount(this, 1, 2)); } }),
    '風雲児': () => ({ onSell(gameState){ discover(gameState, MINIONS.filter(card => card.tribe === 'エレメンタル' && num(card.tier) <= num(gameState.tavernTier) && card.id !== this.id), amount(this, 1, 2), '風雲児：エレメンタルを発見'); } }),
    'エアーレヴナント': () => ({
      init(card){ card.goldSpentProgress = Math.max(0, num(card.goldSpentProgress)); },
      onGoldSpent(gameState, spent){
        this.goldSpentProgress = num(this.goldSpentProgress) + Math.max(0, num(spent));
        while (this.goldSpentProgress >= 6) {
          this.goldSpentProgress -= 6;
          gainNamedSpell(gameState, '東からの風', amount(this, 1, 2));
        }
      },
    }),
    'リサイクルレイス': () => ({ onElementalPlayed(gameState){ gameState.freeRerolls = num(gameState.freeRerolls) + amount(this, 1, 2); } }),
    'ゴニックスケイル': () => ({ onSell(gameState){ gainNamedSpell(gameState, '夢のエッセンス', 1); } }),
    '磯の探検家': () => ({ battlecry(gameState){ discoverMissingTribes(gameState, this, amount(this, 1, 2)); } }),
    '贋作売り': () => ({ aura(gameState){ gameState.sellTriggerMultiplier = Math.max(num(gameState.sellTriggerMultiplier, 1), amount(this, 2, 3)); } }),
    'ブラン': () => ({ aura(gameState){ gameState.battlecryMultiplier = Math.max(num(gameState.battlecryMultiplier, 1), amount(this, 2, 3)); } }),
    'ドラッカリ': () => ({ aura(gameState){ gameState.endTurnMultiplier = Math.max(num(gameState.endTurnMultiplier, 1), amount(this, 2, 3)); } }),
    'ロデオ名人': () => ({ battlecry(gameState){ discover(gameState, SPELLS.filter(card => num(card.tier) <= num(gameState.tavernTier)), amount(this, 1, 2), 'ロデオ名人：呪文を発見'); } }),
    'ビーコン': () => ({ battlecry(gameState){ discover(gameState, [...MINIONS, ...SPELLS].filter(card => num(card.tier) === num(gameState.tavernTier) && card.id !== this.id), amount(this, 1, 2), 'ビーコン：自分のティアのカードを発見'); } }),
    '酸性降雨': () => ({
      init(card){ syncAcidRain(card); },
      onRerollCount(gameState){ syncAcidRain(this); return this.onRerollCount(gameState); },
    }),
  };

  function installRuntime() {
    if (window.__tier5MinionRuntimeInstalled) return;
    window.__tier5MinionRuntimeInstalled = true;

    if (typeof updateAuras === 'function') {
      const previousUpdateAuras = updateAuras;
      updateAuras = function() {
        state.sellTriggerMultiplier = 1;
        state.endTurnMultiplier = 1;
        const result = previousUpdateAuras();
        return result;
      };
    }

    if (typeof sellBoardCard === 'function') {
      const previousSell = sellBoardCard;
      sellBoardCard = function(index) {
        const sold = state.board?.[index] || null;
        if (!sold) return false;
        const beforeGold = num(state.gold);
        const multiplier = Math.max(1, num(state.sellTriggerMultiplier, 1));
        const originalOnSell = sold.onSell;
        if (typeof originalOnSell === 'function' && multiplier > 1) {
          sold.onSell = function(gameState) {
            for (let repeat = 0; repeat < multiplier; repeat += 1) originalOnSell.call(this, gameState);
          };
        }
        try {
          const result = previousSell(index);
          const gained = Math.max(0, num(state.gold) - beforeGold);
          if (gained > 0 && typeof notifyBoard === 'function') notifyBoard('onGoldGained', state, gained);
          return result;
        } finally {
          if (sold) sold.onSell = originalOnSell;
        }
      };
    }

    const syncAllRain = () => {
      (state.board || []).forEach(syncAcidRain);
      (state.hand || []).forEach(syncAcidRain);
    };
    syncAllRain();

    if (typeof initialState === 'function') {
      const previousInitialState = initialState;
      initialState = function() {
        const result = previousInitialState();
        state.sellTriggerMultiplier = 1;
        state.endTurnMultiplier = 1;
        syncAllRain();
        return result;
      };
    }

    if (typeof render === 'function') {
      const previousRender = render;
      render = function() {
        syncAllRain();
        return previousRender();
      };
    }

    updateAuras?.();
    render?.();
  }

  const allowedNames = new Set(DEFINITIONS.map(card => card.name));
  for (let index = MINIONS.length - 1; index >= 0; index -= 1) {
    const card = MINIONS[index];
    if (num(card?.tier) !== 5) continue;
    if (allowedNames.has(String(card?.name || '').trim()) || card?.id === 'acidic_rain_copy') continue;
    MINIONS.splice(index, 1);
  }

  modules.register({
    kind:'minion',
    tier:5,
    label:'ティア5・ミニオン',
    definitions:DEFINITIONS,
    effects:EFFECTS,
    apply(){
      const schedule = () => window.setTimeout(installRuntime, 30);
      if (document.readyState === 'complete') schedule();
      else window.addEventListener('load', schedule, { once:true });
      window.__tier5MinionEffectsImplemented = DEFINITIONS.map(card => card.name);
    },
  });
})();