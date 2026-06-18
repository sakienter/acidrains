/*
 * Final cleanup for prototype-only starting cards and Acid Rain's authoritative
 * Tier 6 registration.
 */
(() => {
  const ACID_RAIN_ID = 'tier6_acidic_rain';
  const LEGACY_ACID_RAIN_ID = 'acidic_rain_copy';
  const ACID_RAIN_DEFINITION = {
    id: ACID_RAIN_ID,
    name: '酸性降雨',
    emoji: '🌧️',
    cost: 3,
    atk: 6,
    hp: 6,
    tribe: 'エレメンタル',
    text: 'このカードが自陣にいる限り、自分が4回のリロールをすると、酒場の右端のミニオンのスタッツを得る。',
    awakenedText: 'このカードが自陣にいる限り、自分が4回のリロールをすると、酒場の右端のミニオンのスタッツを2倍得る。',
  };

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function fixedRightmostMinion(gameState) {
    if (typeof getRightmostShopCard === 'function') {
      return getRightmostShopCard(gameState);
    }
    const slotCount = typeof window.getBaseShopMinionSlots === 'function'
      ? window.getBaseShopMinionSlots(gameState?.tavernTier)
      : ({ 1:3, 2:4, 3:4, 4:5, 5:5, 6:6 }[Math.max(1, Math.min(6, num(gameState?.tavernTier, 1)))] || 3);
    const target = gameState?.shop?.[Math.max(0, slotCount - 1)] || null;
    return target && target.type !== 'spell' ? target : null;
  }

  function normalizeAcidRain(card) {
    if (!card || (card.id !== LEGACY_ACID_RAIN_ID && card.id !== ACID_RAIN_ID && card.name !== '酸性降雨')) {
      return card;
    }

    const awakened = Boolean(card.awakened);
    card.id = ACID_RAIN_ID;
    card.name = ACID_RAIN_DEFINITION.name;
    card.emoji = ACID_RAIN_DEFINITION.emoji;
    card.tier = 6;
    card.cost = ACID_RAIN_DEFINITION.cost;
    card.tribe = ACID_RAIN_DEFINITION.tribe;
    card.atk = Number.isFinite(Number(card.atk)) ? Number(card.atk) : ACID_RAIN_DEFINITION.atk;
    card.hp = Number.isFinite(Number(card.hp)) ? Number(card.hp) : ACID_RAIN_DEFINITION.hp;
    card.awakenedText = ACID_RAIN_DEFINITION.awakenedText;
    card.text = awakened ? ACID_RAIN_DEFINITION.awakenedText : ACID_RAIN_DEFINITION.text;
    card.rerollThreshold = 4;
    card.rerollProgress = Math.max(0, Math.floor(num(card.rerollProgress))) % 4;

    card.onRerollCount = function(gameState) {
      this.rerollProgress = Math.max(0, Math.floor(num(this.rerollProgress))) + 1;
      while (this.rerollProgress >= 4) {
        this.rerollProgress -= 4;
        const target = fixedRightmostMinion(gameState);
        if (!target) {
          if (typeof log === 'function') {
            log(`${this.name}：酒場の固定右端にミニオンがいないため、スタッツを得なかった。`);
          }
          continue;
        }

        const multiplier = this.awakened ? 2 : 1;
        this.atk = num(this.atk) + num(target.atk) * multiplier;
        this.hp = num(this.hp) + num(target.hp) * multiplier;
        this.lastRerollTriggerAt = Date.now();
        if (typeof log === 'function') {
          log(`${this.name}が酒場右端の${target.atk}/${target.hp}を${multiplier}倍得た。`);
        }
      }
      return true;
    };

    return card;
  }

  function acidRainEffect() {
    return {
      init(card) {
        normalizeAcidRain(card);
      },
      onRerollCount(gameState) {
        normalizeAcidRain(this);
        return this.onRerollCount(gameState);
      },
    };
  }

  function patchCardModules() {
    const modules = window.AcidCardModules;
    const tier5 = modules?.get?.('minion', 5) || null;
    const tier6 = modules?.get?.('minion', 6) || null;
    if (!tier5 || !tier6) return false;

    tier5.definitions = (tier5.definitions || []).filter(card =>
      card?.name !== '酸性降雨'
      && card?.id !== LEGACY_ACID_RAIN_ID
      && card?.id !== ACID_RAIN_ID
    );
    if (tier5.effects) delete tier5.effects['酸性降雨'];

    tier6.definitions = (tier6.definitions || []).filter(card =>
      card?.name !== '酸性降雨'
      && card?.id !== LEGACY_ACID_RAIN_ID
      && card?.id !== ACID_RAIN_ID
    );
    tier6.definitions.push({ ...ACID_RAIN_DEFINITION });
    tier6.effects = tier6.effects || {};
    tier6.effects['酸性降雨'] = acidRainEffect;
    return true;
  }

  function normalizeAcidRainPoolAndInstances() {
    if (typeof MINIONS !== 'undefined' && Array.isArray(MINIONS)) {
      const matches = MINIONS
        .map((card, index) => ({ card, index }))
        .filter(entry => entry.card && (
          entry.card.id === LEGACY_ACID_RAIN_ID
          || entry.card.id === ACID_RAIN_ID
          || entry.card.name === '酸性降雨'
        ));

      if (matches.length) {
        normalizeAcidRain(matches[0].card);
        for (let index = matches.length - 1; index >= 1; index -= 1) {
          MINIONS.splice(matches[index].index, 1);
        }
      } else {
        MINIONS.push(normalizeAcidRain({ ...ACID_RAIN_DEFINITION }));
      }
    }

    if (typeof state !== 'undefined' && state) {
      (state.board || []).forEach(normalizeAcidRain);
      (state.hand || []).forEach(normalizeAcidRain);
      (state.shop || []).forEach(normalizeAcidRain);
    }
  }

  const patched = patchCardModules();
  normalizeAcidRainPoolAndInstances();

  if (patched && window.AcidCardModules?.installed) {
    window.AcidCardModules.reinstall();
    normalizeAcidRainPoolAndInstances();
  }

  window.addEventListener('acid-card-modules-ready', () => {
    normalizeAcidRainPoolAndInstances();
  });

  window.addEventListener('load', () => {
    if (window.__acidLegacyStartingCardsRemoved) return;
    window.__acidLegacyStartingCardsRemoved = true;

    function removeLegacyStartingCards() {
      if (!Array.isArray(state.board)) state.board = [];
      while (state.board.length < 9) state.board.push(null);

      // Slots 0 and 1 remain internal offsets. The visible board uses slots 2+
      // and therefore still has the normal seven playable positions.
      state.board[0] = null;
      state.board[1] = null;

      // The old prototype granted Acid Rain for free. Tier 6 Acid Rain must now
      // be bought, discovered, or gained by an explicit card effect.
      state.hand = Array.isArray(state.hand)
        ? state.hand.filter(card => card?.id !== LEGACY_ACID_RAIN_ID)
        : [];

      state.seedGrowth = 0;
      state.extraSeedGrowth = 0;
      state.acidRainEchoMultiplier = 0;
      normalizeAcidRainPoolAndInstances();
    }

    const inheritedInitialState = initialState;
    initialState = function() {
      const result = inheritedInitialState();
      removeLegacyStartingCards();
      return result;
    };

    const inheritedSetupRun = setupRun;
    setupRun = function() {
      const result = inheritedSetupRun();
      removeLegacyStartingCards();
      if (typeof updateAuras === 'function') updateAuras();
      if (typeof render === 'function') render();
      return result;
    };

    removeLegacyStartingCards();
    if (typeof updateAuras === 'function') updateAuras();
    if (typeof render === 'function') render();
  }, { once:true });
})();