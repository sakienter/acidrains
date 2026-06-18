/* Additional neutral minions for Tiers 1, 3, 4, and 5. */
(() => {
  const modules = window.AcidCardModules;
  if (!modules) throw new Error('AcidCardModules must load before neutral expansion cards.');

  const num = value => Number(value || 0);
  const amount = (card, normal, awakened) => card?.awakened ? awakened : normal;
  const handLimit = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
  const say = message => { if (typeof log === 'function' && message) log(message); };
  const pick = pool => pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  const clone = card => typeof initializedClone === 'function'
    ? initializedClone(card)
    : typeof cloneCard === 'function' ? cloneCard(card) : { ...card };
  const isNoTribe = card => !card?.tribe || ['なし', '無種族', ''].includes(String(card.tribe));
  const eligible = cards => (cards || []).filter(card => card && !card.token && card.shopEligible !== false);

  function addCard(gameState, template, message = '') {
    if (!template) return false;
    if (!Array.isArray(gameState.hand) || gameState.hand.length >= handLimit()) {
      say('手札がいっぱい。');
      return false;
    }
    if (typeof gainCardToHand === 'function') {
      return gainCardToHand(gameState, clone(template), message) !== false;
    }
    gameState.hand.push(clone(template));
    say(message);
    return true;
  }

  function gainNamedSpell(gameState, name, count) {
    const template = SPELLS.find(card => card?.name === name);
    if (!template) {
      say(`${name} がスペルプールに見つからない。`);
      return 0;
    }
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, template, index === 0 ? `${name} を得た。` : '')) break;
      gained += 1;
    }
    return gained;
  }

  function gainNamedMinion(gameState, name, count) {
    const template = MINIONS.find(card => card?.name === name);
    if (!template) {
      say(`${name} がミニオンプールに見つからない。`);
      return 0;
    }
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addCard(gameState, template, index === 0 ? `${name} を得た。` : '')) break;
      gained += 1;
    }
    return gained;
  }

  function discover(gameState, pool, count, title, beyondTier = false) {
    const candidates = eligible(pool);
    if (!candidates.length) {
      say(`${title}：候補がない。`);
      return 0;
    }
    if (beyondTier && typeof discoverCardsBeyondTier === 'function') {
      discoverCardsBeyondTier(gameState, candidates, count, title);
      return count;
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

  function loseTurnTime(gameState, seconds, sourceName) {
    const loss = Math.max(0, num(seconds));
    const shouldResume = !gameState.isPaused
      && gameState.hasStarted
      && !gameState.gameOver
      && typeof window.pauseAcidTurnTimer === 'function'
      && typeof window.resumeAcidTurnTimer === 'function';
    if (shouldResume) window.pauseAcidTurnTimer();
    const before = Math.max(0, num(gameState.turnTimeRemaining));
    gameState.turnTimeRemaining = Math.max(0, before - loss);
    if (shouldResume) window.resumeAcidTurnTimer();
    say(`${sourceName}：残り時間を${before - gameState.turnTimeRemaining}秒失った。`);
    return before - gameState.turnTimeRemaining;
  }

  function randomNamedSpell(gameState, names, count, sourceName) {
    const pool = names.map(name => SPELLS.find(card => card?.name === name)).filter(Boolean);
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      const selected = pick(pool);
      if (!selected || !addCard(gameState, selected, index === 0 ? `${sourceName}：${selected.name}を得た。` : '')) break;
      gained += 1;
    }
    return gained;
  }

  function appendDefinition(moduleDefinition, definition, effectFactory) {
    const definitions = Array.isArray(moduleDefinition.definitions)
      ? moduleDefinition.definitions
      : (moduleDefinition.definitions = []);
    const existing = definitions.find(card => card?.id === definition.id || card?.name === definition.name);
    if (existing) Object.assign(existing, definition);
    else definitions.push(definition);
    moduleDefinition.effects = moduleDefinition.effects || {};
    moduleDefinition.effects[definition.name] = effectFactory;
  }

  const tier1 = modules.get('minion', 1);
  const tier2 = modules.get('minion', 2);
  const tier3 = modules.get('minion', 3);
  const tier4 = modules.get('minion', 4);
  const tier5 = modules.get('minion', 5);
  if (!tier1 || !tier2 || !tier3 || !tier4 || !tier5) {
    throw new Error('Neutral expansion requires Tier 1 through Tier 5 minion modules.');
  }

  // 身代わり is re-tiered from Tier 2 to Tier 3.
  tier2.definitions = (tier2.definitions || []).filter(card => card?.name !== '身代わり');
  if (tier2.effects) delete tier2.effects['身代わり'];

  appendDefinition(tier1, {
    id:'tier1_aspiring_actor',
    name:'俳優志望',
    emoji:'🎭',
    cost:3,
    atk:2,
    hp:2,
    tribe:'なし',
    text:'このカードが自陣にいる時、無種族カードを売ると、「コイン」を1枚得る。',
    awakenedText:'このカードが自陣にいる時、無種族カードを売ると、「コイン」を2枚得る。',
  }, () => ({
    onAnySell(gameState, sold) {
      if (!isNoTribe(sold)) return;
      gainNamedSpell(gameState, 'コイン', amount(this, 1, 2));
    },
  }));

  appendDefinition(tier1, {
    id:'tier1_unplanned_minister',
    name:'無計画大臣',
    emoji:'🏛️',
    cost:3,
    atk:2,
    hp:2,
    tribe:'なし',
    text:'ターン終了時、グレードを無視して「喉から手がでる」か「コイン」を1枚得る。',
    awakenedText:'ターン終了時、グレードを無視して「喉から手がでる」か「コイン」を2枚得る。',
  }, () => ({
    onTurnEnd(gameState) {
      randomNamedSpell(gameState, ['喉から手がでる', 'コイン'], amount(this, 1, 2), '無計画大臣');
    },
  }));

  appendDefinition(tier3, {
    id:'tier3_time_thief',
    name:'時間泥棒',
    emoji:'⏱️',
    cost:3,
    atk:4,
    hp:3,
    tribe:'なし',
    text:'雄叫び：自分の残り時間を30秒失い、「石油」を1枚得る。',
    awakenedText:'雄叫び：自分の残り時間を30秒失い、「石油」を2枚得る。',
  }, () => ({
    battlecry(gameState) {
      loseTurnTime(gameState, 30, '時間泥棒');
      gainNamedSpell(gameState, '石油', amount(this, 1, 2));
    },
  }));

  appendDefinition(tier3, {
    id:'tier3_substitute',
    name:'身代わり',
    emoji:'🪆',
    cost:3,
    atk:1,
    hp:1,
    tribe:'なし',
    text:'売却時：「売却時」効果を持つミニオンを1枚発見する。',
    awakenedText:'売却時：「売却時」効果を持つミニオンを2枚発見する。',
  }, () => ({
    onSell(gameState) {
      const currentTier = Math.max(1, num(gameState.tavernTier));
      const pool = MINIONS.filter(card => {
        if (!card || card.type === 'spell' || card.token || card.shopEligible === false) return false;
        if (card.id === this.id || card.name === this.name) return false;
        if (num(card.tier) > currentTier) return false;
        const text = `${card.text || ''}\n${card.awakenedText || ''}`;
        return text.includes('売却時') || text.includes('このカードを売った時');
      });
      discover(gameState, pool, amount(this, 1, 2), '身代わり：売却時効果を持つミニオンを発見');
    },
  }));

  appendDefinition(tier4, {
    id:'tier4_ice_age_veteran',
    name:'氷河期世代の猛者',
    emoji:'🧊',
    cost:3,
    atk:4,
    hp:6,
    tribe:'なし',
    text:'このカードを売った時、ティア4、5の無種族ミニオンを1枚発見する。',
    awakenedText:'このカードを売った時、ティア4、5の無種族ミニオンを2枚発見する。',
  }, () => ({
    onSell(gameState) {
      const pool = MINIONS.filter(card =>
        card
        && card.id !== this.id
        && [4, 5].includes(num(card.tier))
        && isNoTribe(card)
      );
      discover(gameState, pool, amount(this, 1, 2), '氷河期世代の猛者：ティア4・5の無種族ミニオンを発見', true);
    },
  }));

  appendDefinition(tier4, {
    id:'tier4_juggler',
    name:'ジャグラー',
    emoji:'🤹',
    cost:3,
    atk:6,
    hp:1,
    tribe:'なし',
    text:'このカードが自陣にいる時、4Gを使うたび、「ウレメンタル」を1枚獲得する。',
    awakenedText:'このカードが自陣にいる時、4Gを使うたび、「ウレメンタル」を2枚獲得する。',
  }, () => ({
    init(card) {
      card.goldSpentProgress = Math.max(0, num(card.goldSpentProgress));
    },
    onGoldSpent(gameState, spent) {
      this.goldSpentProgress = num(this.goldSpentProgress) + Math.max(0, num(spent));
      while (this.goldSpentProgress >= 4) {
        this.goldSpentProgress -= 4;
        gainNamedMinion(gameState, 'ウレメンタル', amount(this, 1, 2));
      }
    },
  }));

  appendDefinition(tier5, {
    id:'tier5_small_change_earner',
    name:'小銭稼ぎ',
    emoji:'🪙',
    cost:3,
    atk:6,
    hp:6,
    tribe:'なし',
    text:'雄叫び：自分の残り時間を30秒失い、「情報商材」を1枚得る。',
    awakenedText:'雄叫び：自分の残り時間を30秒失い、「情報商材」を2枚得る。',
  }, () => ({
    battlecry(gameState) {
      loseTurnTime(gameState, 30, '小銭稼ぎ');
      gainNamedSpell(gameState, '情報商材', amount(this, 1, 2));
    },
  }));

  window.__neutralExpansionMinionsDefined = [
    '俳優志望',
    '無計画大臣',
    '時間泥棒',
    '身代わり',
    '氷河期世代の猛者',
    'ジャグラー',
    '小銭稼ぎ',
  ];

  if (modules.installed) modules.reinstall();
})();