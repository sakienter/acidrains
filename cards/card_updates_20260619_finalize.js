/* Final migration for the 2026-06-19 card update. */
(() => {
  if (window.__acidCardUpdates20260619Finalized) return;
  window.__acidCardUpdates20260619Finalized = true;

  const COPIES_BY_TIER = Object.freeze({ 1:16, 2:15, 3:13, 4:11, 5:9, 6:7 });
  const HOLDINGS = '__minionPoolHoldings';
  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const keyOf = card => String(card?.poolKey || card?.name || card?.id || '').trim();

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

  function castCurrentTimeTranscendence(gameState) {
    const template = (typeof SPELLS !== 'undefined' ? SPELLS : [])
      .find(card => card?.name === '時空の超越' && card?.id === 'time_transcendence');
    if (!template || typeof template.cast !== 'function') {
      if (typeof log === 'function') log('時空の超越の正式な効果が見つからない。');
      return false;
    }
    return template.cast(gameState);
  }

  function patchTokensAndExistingCards() {
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
      patchTokensAndExistingCards();
      ensureNewPoolEntries();
      return result;
    };
  }

  patchTokensAndExistingCards();

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    patchTokensAndExistingCards();
    if (ensureNewPoolEntries() || attempts >= 400) {
      window.clearInterval(timer);
    }
  }, 25);
})();
