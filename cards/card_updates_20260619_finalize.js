/* Final migration for the 2026-06-19 card update. */
(() => {
  if (window.__acidCardUpdates20260619Finalized) return;
  window.__acidCardUpdates20260619Finalized = true;

  const COPIES_BY_TIER = Object.freeze({ 1:16, 2:15, 3:13, 4:11, 5:9, 6:7 });
  const HOLDINGS = '__minionPoolHoldings';
  const RETURNED = '__minionPoolReturned';
  const ANIMA_TEXT = 'ランダムな酒場のミニオン1体のスタッツを、自陣のミニオン1体を選んで加える。';
  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const keyOf = card => String(card?.poolKey || card?.name || card?.id || '').trim();
  const pick = cards => cards?.length ? cards[Math.floor(Math.random() * cards.length)] : null;
  const clone = card => typeof initializedClone === 'function'
    ? initializedClone(card)
    : typeof cloneCard === 'function' ? cloneCard(card) : { ...card };

  const sacrificeToken = {
    id:'token_sacrifice',
    name:'生贄',
    emoji:'🩸',
    tier:0,
    cost:0,
    atk:1,
    hp:1,
    tribe:'海賊',
    token:true,
    shopEligible:false,
    text:'このカードは海賊である。',
  };

  function timeTranscendenceIsBlocked(gameState) {
    return num(gameState?.turn, 1) === num(gameState?.timeTranscendenceBlockedTurn, -1);
  }

  function patchOfficialTimeSpell() {
    const template = (typeof SPELLS !== 'undefined' ? SPELLS : [])
      .find(card => card?.name === '時空の超越' && card?.id === 'time_transcendence');
    if (!template || typeof template.cast !== 'function') return false;
    template.cost = 10;
    template.tier = 6;
    template.text = 'リミットターンの猶予を1増やす。次のターン「時空の超越」を使えない。';
    if (!template.__timeTranscendenceLockWrapped) {
      const officialCast = template.cast;
      template.cast = function(gameState) {
        if (timeTranscendenceIsBlocked(gameState)) {
          if (typeof log === 'function') log(`時空の超越は${gameState.turn}ターン目には発動できない。`);
          return false;
        }
        return officialCast.call(this, gameState);
      };
      template.__timeTranscendenceLockWrapped = true;
    }
    return true;
  }

  function castCurrentTimeTranscendence(gameState) {
    if (timeTranscendenceIsBlocked(gameState)) {
      if (typeof log === 'function') log(`時空の超越は${gameState.turn}ターン目には発動できない。`);
      return false;
    }
    patchOfficialTimeSpell();
    const template = (typeof SPELLS !== 'undefined' ? SPELLS : [])
      .find(card => card?.name === '時空の超越' && card?.id === 'time_transcendence');
    if (!template || typeof template.cast !== 'function') {
      if (typeof log === 'function') log('時空の超越の正式な効果が見つからない。');
      return false;
    }
    return template.cast(gameState);
  }

  function patchAnimaDefinitionAndCards() {
    const moduleDefinition = window.AcidCardModules?.get?.('spell', 6) || null;
    const definition = (moduleDefinition?.definitions || []).find(card => card?.name === 'アニマを検知');
    if (definition) definition.text = ANIMA_TEXT;

    const patch = card => {
      if (card?.name === 'アニマを検知') card.text = ANIMA_TEXT;
    };
    (typeof SPELLS !== 'undefined' ? SPELLS : []).forEach(patch);
    if (typeof state !== 'undefined' && state) {
      (state.hand || []).forEach(patch);
      (state.shop || []).forEach(patch);
    }
    return Boolean(definition);
  }

  function returnTrackedShopCopies(gameState) {
    if (!gameState?.minionPoolRemaining || !gameState?.minionPoolMaximum) return;
    for (const card of (gameState.shop || [])) {
      if (!card || card.type === 'spell' || card[RETURNED]) continue;
      const holdings = card[HOLDINGS];
      if (!holdings || typeof holdings !== 'object') continue;
      Object.entries(holdings).forEach(([key, count]) => {
        const maximum = num(gameState.minionPoolMaximum[key]);
        const current = num(gameState.minionPoolRemaining[key]);
        gameState.minionPoolRemaining[key] = Math.min(maximum, current + Math.max(0, num(count)));
      });
      card[RETURNED] = true;
    }
  }

  function castHighTeaWithPool(gameState) {
    returnTrackedShopCopies(gameState);
    gameState.shop = [];

    const minionCount = typeof window.getBaseShopMinionSlots === 'function'
      ? window.getBaseShopMinionSlots(gameState.tavernTier)
      : 5;
    const spellCount = 1 + Math.max(0, num(gameState.extraSpellShop));

    for (let index = 0; index < minionCount; index += 1) {
      const candidates = (typeof MINIONS !== 'undefined' ? MINIONS : []).filter(card =>
        card
        && !card.token
        && card.shopEligible !== false
        && num(card.tier) === 5
        && (typeof window.getAcidMinionPoolAvailableCopies !== 'function'
          || window.getAcidMinionPoolAvailableCopies(card, gameState) > 0)
      );
      const selected = typeof createSpecificShopCard === 'function'
        ? createSpecificShopCard(candidates)
        : clone(pick(candidates));
      gameState.shop.push(selected || null);
    }

    const spellPool = (typeof SPELLS !== 'undefined' ? SPELLS : []).filter(card =>
      card && !card.token && card.shopEligible !== false && num(card.tier) === 5
    );
    for (let index = 0; index < spellCount; index += 1) {
      gameState.shop.push(spellPool.length ? clone(pick(spellPool)) : null);
    }

    gameState.frozen = false;
    gameState.rerolls = num(gameState.rerolls) + 1;
    if (typeof applyEastWindToRightmost === 'function') applyEastWindToRightmost(gameState);
    if (typeof applyHallelujahAfterRefresh === 'function') applyHallelujahAfterRefresh(gameState);
    if (gameState.hero?.onReroll) gameState.hero.onReroll(gameState);
    if (typeof notifyBoard === 'function') notifyBoard('onRerollCount', gameState);
    gameState.__resolvedRerolls = num(gameState.rerolls);
    if (typeof updateAuras === 'function') updateAuras();
    if (typeof log === 'function') log('ハイティー：ミニオンプールの残数を守って、ティア5カードだけの酒場に入れ替えた。');
    return true;
  }

  function patchHighTea() {
    const moduleDefinition = window.AcidCardModules?.get?.('spell', 5) || null;
    if (moduleDefinition) {
      moduleDefinition.effects = moduleDefinition.effects || {};
      moduleDefinition.effects['ハイティー'] = () => ({ cast:castHighTeaWithPool });
    }
    const patch = card => {
      if (card?.name === 'ハイティー') card.cast = castHighTeaWithPool;
    };
    (typeof SPELLS !== 'undefined' ? SPELLS : []).forEach(patch);
    if (typeof state !== 'undefined' && state) {
      (state.hand || []).forEach(patch);
      (state.shop || []).forEach(patch);
    }
    return Boolean(moduleDefinition);
  }

  function patchTokensAndExistingCards() {
    patchOfficialTimeSpell();
    if (typeof TOKEN_CARDS !== 'undefined' && TOKEN_CARDS) {
      TOKEN_CARDS.sacrifice = { ...sacrificeToken };
      TOKEN_CARDS.time_transcendence = {
        id:'time_transcendence',
        name:'時空の超越',
        emoji:'⏳',
        tier:6,
        cost:10,
        type:'spell',
        token:true,
        shopEligible:false,
        text:'リミットターンの猶予を1増やす。次のターン「時空の超越」を使えない。',
        cast:castCurrentTimeTranscendence,
      };
    }

    if (typeof state === 'undefined' || !state) return;
    const patchCard = card => {
      if (!card) return;
      if (card.name === '時空の超越') {
        card.id = 'time_transcendence';
        card.tier = 6;
        card.cost = 10;
        card.type = 'spell';
        card.text = 'リミットターンの猶予を1増やす。次のターン「時空の超越」を使えない。';
        card.cast = castCurrentTimeTranscendence;
      }
      if (card.name === 'アニマを検知') {
        card.text = ANIMA_TEXT;
      }
      if (card.name === '生贄' || card.id === 'token_sacrifice') {
        Object.assign(card, sacrificeToken);
      }
    };
    (state.hand || []).forEach(patchCard);
    (state.shop || []).forEach(patchCard);
    (state.board || []).forEach(patchCard);
  }

  function physicalCopies(template, gameState) {
    const key = keyOf(template);
    if (!key) return 0;
    const cards = [
      ...(gameState?.hand || []),
      ...(gameState?.board || []).slice(2),
      ...(gameState?.shop || []),
    ].filter(Boolean);
    return cards.reduce((total, card) => {
      if (card.type === 'spell' || card.token || card.shopEligible === false || keyOf(card) !== key) return total;
      const holdings = card?.[HOLDINGS];
      if (holdings && num(holdings[key]) > 0) return total + num(holdings[key]);
      return total + 1;
    }, 0);
  }

  function ensureNewPoolEntries() {
    if (!window.__acidMinionPoolRulesApplied || typeof state === 'undefined' || !state) return false;
    if (!state.minionPoolMaximum || !state.minionPoolRemaining) return false;
    for (const card of (typeof MINIONS !== 'undefined' ? MINIONS : [])) {
      if (!card || card.type === 'spell' || card.token || card.shopEligible === false) continue;
      const tier = Math.max(1, Math.min(6, num(card.tier, 1)));
      const key = keyOf(card);
      const maximum = COPIES_BY_TIER[tier] || 0;
      if (!key || !maximum) continue;
      if (state.minionPoolMaximum[key] === undefined) {
        state.minionPoolMaximum[key] = maximum;
      }
      if (state.minionPoolRemaining[key] === undefined) {
        state.minionPoolRemaining[key] = Math.max(0, maximum - physicalCopies(card, state));
      }
    }
    window.__acid20260619PoolEntriesSynchronized = true;
    return true;
  }

  if (typeof setupRun === 'function' && !window.__acid20260619SetupResetPatched) {
    window.__acid20260619SetupResetPatched = true;
    const previousSetupRun = setupRun;
    setupRun = function() {
      state.timeTranscendenceBlockedTurn = -1;
      state.cycloneStacks = 0;
      state.spellsPlayedThisGame = 0;
      const result = previousSetupRun();
      state.timeTranscendenceBlockedTurn = -1;
      state.cycloneStacks = 0;
      state.spellsPlayedThisGame = 0;
      patchAnimaDefinitionAndCards();
      patchHighTea();
      patchTokensAndExistingCards();
      ensureNewPoolEntries();
      return result;
    };
  }

  patchAnimaDefinitionAndCards();
  patchHighTea();
  patchTokensAndExistingCards();

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const animaReady = patchAnimaDefinitionAndCards();
    const highTeaReady = patchHighTea();
    patchTokensAndExistingCards();
    const poolReady = ensureNewPoolEntries();
    if ((animaReady && highTeaReady && poolReady) || attempts >= 400) {
      window.clearInterval(timer);
    }
  }, 25);
})();