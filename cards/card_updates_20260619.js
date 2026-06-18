/*
 * Card additions and pool-integrity update for 2026-06-19.
 *
 * The cards are inserted into their authoritative tier modules, then the module
 * registry is reinstalled so every future shop/discover clone uses these exact
 * definitions and effects.
 */
(() => {
  if (window.__acidCardUpdates20260619Applied) return;
  window.__acidCardUpdates20260619Applied = true;

  const COPIES_BY_TIER = Object.freeze({ 1:16, 2:15, 3:13, 4:11, 5:9, 6:7 });
  const HOLDINGS = '__minionPoolHoldings';
  const HAND_LIMIT_VALUE = () => typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const nameOf = card => String(card?.name || '').trim();
  const keyOf = card => String(card?.poolKey || card?.name || card?.id || '').trim();
  const pick = cards => cards?.length ? cards[Math.floor(Math.random() * cards.length)] : null;
  const say = message => { if (message && typeof log === 'function') log(message); };
  const clone = card => typeof initializedClone === 'function'
    ? initializedClone(card)
    : typeof cloneCard === 'function' ? cloneCard(card) : { ...card };

  const SACRIFICE_TOKEN = Object.freeze({
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
  });

  function addToHandDirect(gameState, card, message = '') {
    if (!Array.isArray(gameState?.hand) || gameState.hand.length >= HAND_LIMIT_VALUE()) {
      say('手札がいっぱい。');
      return false;
    }
    gameState.hand.push(clone(card));
    say(message);
    return true;
  }

  function gainSacrifices(gameState, count) {
    let gained = 0;
    for (let index = 0; index < count; index += 1) {
      if (!addToHandDirect(
        gameState,
        SACRIFICE_TOKEN,
        index === 0 ? `「生贄」を${count}枚得た。` : '',
      )) break;
      gained += 1;
    }
    return gained;
  }

  function fixedRightmostMinion(gameState) {
    if (typeof getRightmostShopCard === 'function') {
      const target = getRightmostShopCard(gameState);
      return target?.type === 'spell' ? null : target;
    }
    const count = typeof window.getBaseShopMinionSlots === 'function'
      ? window.getBaseShopMinionSlots(gameState?.tavernTier)
      : ({ 1:3, 2:4, 3:4, 4:5, 5:5, 6:6 }[Math.max(1, Math.min(6, num(gameState?.tavernTier, 1)))] || 3);
    const target = gameState?.shop?.[Math.max(0, count - 1)] || null;
    return target && target.type !== 'spell' ? target : null;
  }

  function castCyclone(gameState) {
    gameState.cycloneStacks = Math.max(0, num(gameState.cycloneStacks)) + 1;
    say(`サイクロンが有効になった。現在${gameState.cycloneStacks}重。`);
    return true;
  }

  function applyCycloneAfterRefresh(gameState) {
    const stacks = Math.max(0, num(gameState?.cycloneStacks));
    const spellCount = Math.max(0, num(gameState?.spellsPlayedThisGame));
    if (!stacks || !spellCount) return false;
    const target = fixedRightmostMinion(gameState);
    if (!target) {
      say('サイクロン：酒場の固定右端にミニオンがいないため不発だった。');
      return false;
    }
    const value = stacks * spellCount;
    target.atk = num(target.atk) + value;
    target.hp = num(target.hp) + value;
    say(`サイクロン：${target.name}に+${value}/+${value}を付与した。（使用スペル${spellCount}枚 × ${stacks}重）`);
    return true;
  }

  window.applyCycloneAfterRefresh = applyCycloneAfterRefresh;

  function castDetectAnima(gameState) {
    const tavernMinions = (gameState.shop || []).filter(card => card && card.type !== 'spell');
    const boardMinions = (gameState.board || []).filter((card, index) => index >= 2 && card && card.type !== 'spell');
    const source = pick(tavernMinions);
    const target = pick(boardMinions);
    if (!source) {
      say('アニマを検知：酒場にミニオンがいないため不発だった。');
      return false;
    }
    if (!target) {
      say('アニマを検知：自陣にミニオンがいないため不発だった。');
      return false;
    }
    const attack = Math.max(0, num(source.atk));
    const health = Math.max(0, num(source.hp));
    target.atk = num(target.atk) + attack;
    target.hp = num(target.hp) + health;
    say(`アニマを検知：酒場の${source.name}の${attack}/${health}を、自陣の${target.name}に加えた。`);
    return true;
  }

  function castTimeTranscendence(gameState) {
    if (gameState.endlessMode) {
      say('エンドレスモードではリミットターンは増減しない。');
    } else {
      gameState.maxTurns = Math.max(num(gameState.turn, 1), num(gameState.maxTurns)) + 1;
      say(`リミットターンが1増え、${gameState.maxTurns}ターンになった。`);
    }
    gameState.timeTranscendenceBlockedTurn = num(gameState.turn, 1) + 1;
    say(`次の${gameState.timeTranscendenceBlockedTurn}ターン目は「時空の超越」を使用できない。`);
    return true;
  }

  function upsertDefinition(moduleDefinition, definition) {
    if (!moduleDefinition) return;
    moduleDefinition.definitions = (moduleDefinition.definitions || []).filter(card =>
      card?.id !== definition.id && nameOf(card) !== definition.name
    );
    moduleDefinition.definitions.push({ ...definition });
  }

  function patchModules() {
    const modules = window.AcidCardModules;
    if (!modules?.registry) return false;
    const tier5Minions = modules.get('minion', 5);
    const tier5Spells = modules.get('spell', 5);
    const tier6Spells = modules.get('spell', 6);
    if (!tier5Minions || !tier5Spells || !tier6Spells) return false;

    upsertDefinition(tier5Minions, {
      id:'tier5_skilled_negotiator',
      name:'交渉上手',
      emoji:'🤝',
      cost:3,
      atk:4,
      hp:4,
      tribe:'海賊',
      text:'雄叫び：手札に「生贄」トークンを1枚追加する。',
      awakenedText:'雄叫び：手札に「生贄」トークンを2枚追加する。',
    });
    tier5Minions.effects = tier5Minions.effects || {};
    tier5Minions.effects['交渉上手'] = () => ({
      battlecry(gameState) {
        gainSacrifices(gameState, this.awakened ? 2 : 1);
      },
    });

    upsertDefinition(tier5Spells, {
      id:'cyclone',
      name:'サイクロン',
      emoji:'🌀',
      cost:4,
      text:'この対戦中に酒場を入替した後、その右端のミニオン1体に+X/+Xを付与する。（Xは、このゲーム中で使用したスペルの枚数）',
    });
    tier5Spells.effects = tier5Spells.effects || {};
    tier5Spells.effects['サイクロン'] = () => ({ cast: castCyclone });

    upsertDefinition(tier6Spells, {
      id:'detect_anima',
      name:'アニマを検知',
      emoji:'🔎',
      cost:6,
      text:'ランダムな酒場のミニオン1体のスタッツを、ランダムな自陣のミニオン1体に加える。',
    });
    upsertDefinition(tier6Spells, {
      id:'time_transcendence',
      name:'時空の超越',
      emoji:'⏳',
      cost:10,
      text:'リミットターンの猶予を1増やす。次のターン「時空の超越」を使えない。',
    });
    tier6Spells.effects = tier6Spells.effects || {};
    tier6Spells.effects['アニマを検知'] = () => ({ cast: castDetectAnima });
    tier6Spells.effects['時空の超越'] = () => ({ cast: castTimeTranscendence });

    if (modules.installed) modules.reinstall();

    const patchInstance = card => {
      if (!card || nameOf(card) !== '時空の超越') return;
      card.id = 'time_transcendence';
      card.tier = 6;
      card.cost = 10;
      card.text = 'リミットターンの猶予を1増やす。次のターン「時空の超越」を使えない。';
      card.cast = castTimeTranscendence;
    };
    if (typeof state !== 'undefined' && state) {
      (state.hand || []).forEach(patchInstance);
      (state.shop || []).forEach(patchInstance);
    }

    window.__acidCardUpdates20260619ModulesPatched = true;
    return true;
  }

  function installTimeTranscendenceLock() {
    if (window.__acidTimeTranscendenceLockInstalled) return;
    window.__acidTimeTranscendenceLockInstalled = true;

    const previousCanPlay = typeof window.canPlayAcidCard === 'function'
      ? window.canPlayAcidCard
      : () => true;
    window.canPlayAcidCard = (card, gameState = window.state) => {
      if (!previousCanPlay(card, gameState)) return false;
      return !(
        nameOf(card) === '時空の超越'
        && num(gameState?.turn, 1) === num(gameState?.timeTranscendenceBlockedTurn, -1)
      );
    };

    const previousDescription = typeof window.describeAcidCardLock === 'function'
      ? window.describeAcidCardLock
      : () => '';
    window.describeAcidCardLock = (card, gameState = window.state) => {
      if (
        nameOf(card) === '時空の超越'
        && num(gameState?.turn, 1) === num(gameState?.timeTranscendenceBlockedTurn, -1)
      ) {
        return `時空の超越は${gameState.turn}ターン目には使用できない。`;
      }
      return previousDescription(card, gameState);
    };

    if (typeof state !== 'undefined' && state) {
      state.timeTranscendenceBlockedTurn = num(state.timeTranscendenceBlockedTurn, -1);
      state.cycloneStacks = Math.max(0, num(state.cycloneStacks));
      state.spellsPlayedThisGame = Math.max(0, num(state.spellsPlayedThisGame));
    }

    if (typeof initialState === 'function' && !window.__acid20260619InitialStatePatched) {
      window.__acid20260619InitialStatePatched = true;
      const previousInitialState = initialState;
      initialState = function() {
        const result = previousInitialState();
        state.timeTranscendenceBlockedTurn = -1;
        state.cycloneStacks = 0;
        state.spellsPlayedThisGame = 0;
        return result;
      };
    }
  }

  function installSpellAndRerollCounters() {
    if (window.__acid20260619NotifyBoardPatched || typeof notifyBoard !== 'function') return;
    window.__acid20260619NotifyBoardPatched = true;
    const previousNotifyBoard = notifyBoard;
    const countedThisTask = new WeakSet();

    notifyBoard = function(eventName, gameState, payload, ...rest) {
      if (
        eventName === 'onSpellCast'
        && payload
        && typeof payload === 'object'
        && !countedThisTask.has(payload)
      ) {
        countedThisTask.add(payload);
        gameState.spellsPlayedThisGame = Math.max(0, num(gameState.spellsPlayedThisGame)) + 1;
        const release = () => countedThisTask.delete(payload);
        if (typeof queueMicrotask === 'function') queueMicrotask(release);
        else Promise.resolve().then(release);
      }

      const result = previousNotifyBoard(eventName, gameState, payload, ...rest);
      if (eventName === 'onRerollCount') applyCycloneAfterRefresh(gameState);
      return result;
    };
  }

  function isPoolMinion(card) {
    return Boolean(
      card
      && card.type !== 'spell'
      && !card.token
      && card.shopEligible !== false
      && Number.isInteger(num(card.tier))
      && num(card.tier) >= 1
      && num(card.tier) <= 6
    );
  }

  function zoneCards(gameState) {
    return [
      ...(gameState?.hand || []),
      ...(gameState?.board || []).slice(2),
      ...(gameState?.shop || []),
    ].filter(Boolean);
  }

  function untrackedCopies(card, gameState) {
    const key = keyOf(card);
    if (!key) return 0;
    return zoneCards(gameState).reduce((total, owned) => {
      if (!isPoolMinion(owned) || keyOf(owned) !== key) return total;
      const holdings = owned?.[HOLDINGS];
      return holdings && num(holdings[key]) > 0 ? total : total + 1;
    }, 0);
  }

  function observedCopiesWithoutPool(card, gameState) {
    const key = keyOf(card);
    if (!key) return 0;
    return zoneCards(gameState).reduce((total, owned) => {
      if (!isPoolMinion(owned) || keyOf(owned) !== key) return total;
      const holdings = owned?.[HOLDINGS];
      if (holdings && num(holdings[key]) > 0) return total + num(holdings[key]);
      return total + 1;
    }, 0);
  }

  function effectiveAvailableCopies(card, gameState = window.state) {
    if (!isPoolMinion(card)) return Number.POSITIVE_INFINITY;
    const key = keyOf(card);
    const maximum = num(
      gameState?.minionPoolMaximum?.[key],
      COPIES_BY_TIER[num(card.tier)] || 0,
    );
    const storedRemaining = gameState?.minionPoolRemaining?.[key];
    if (storedRemaining !== undefined) {
      return Math.max(0, num(storedRemaining) - untrackedCopies(card, gameState));
    }
    return Math.max(0, maximum - observedCopiesWithoutPool(card, gameState));
  }

  window.getAcidMinionPoolAvailableCopies = effectiveAvailableCopies;

  function filterByPoolAvailability(cards, gameState = window.state) {
    return (cards || []).filter(card => !isPoolMinion(card) || effectiveAvailableCopies(card, gameState) > 0);
  }

  function installPoolExhaustionGuards() {
    if (window.__acid20260619PoolGuardsInstalled) return true;
    if (!window.__acidMinionPoolRulesApplied) return false;
    window.__acid20260619PoolGuardsInstalled = true;

    if (typeof availablePool === 'function') {
      const previousAvailablePool = availablePool;
      availablePool = function(...args) {
        return filterByPoolAvailability(previousAvailablePool(...args), state);
      };
    }

    if (typeof discoverCards === 'function') {
      const previousDiscoverCards = discoverCards;
      discoverCards = function(gameState, cards, count, title) {
        return previousDiscoverCards(
          gameState,
          filterByPoolAvailability(cards, gameState),
          count,
          title,
        );
      };
    }

    if (typeof discoverCardsBeyondTier === 'function') {
      const previousDiscoverBeyondTier = discoverCardsBeyondTier;
      discoverCardsBeyondTier = function(gameState, cards, count, title) {
        return previousDiscoverBeyondTier(
          gameState,
          filterByPoolAvailability(cards, gameState),
          count,
          title,
        );
      };
    }

    if (typeof createWeightedMinionCard === 'function') {
      const previousWeighted = createWeightedMinionCard;
      createWeightedMinionCard = function(cards) {
        const filtered = filterByPoolAvailability(cards, state);
        return filtered.length ? previousWeighted(filtered) : null;
      };
    }

    if (typeof createSpecificShopCard === 'function') {
      const previousSpecific = createSpecificShopCard;
      createSpecificShopCard = function(cards) {
        const filtered = filterByPoolAvailability(cards, state);
        return filtered.length ? previousSpecific(filtered) : null;
      };
    }

    if (typeof gainCardToHand === 'function') {
      const previousGainCard = gainCardToHand;
      gainCardToHand = function(gameState, card, message) {
        if (card?.token && card.type !== 'spell') {
          return addToHandDirect(gameState, card, message);
        }
        if (
          isPoolMinion(card)
          && !card?.[HOLDINGS]
          && effectiveAvailableCopies(card, gameState) <= 0
        ) {
          say(`${card.name}はミニオンプールに残っていない。`);
          return false;
        }
        return previousGainCard(gameState, card, message);
      };
    }

    if (typeof gainRandomMinionToHand === 'function') {
      const previousGainRandomMinion = gainRandomMinionToHand;
      gainRandomMinionToHand = function(gameState, predicate, message) {
        return previousGainRandomMinion(
          gameState,
          card => predicate(card) && effectiveAvailableCopies(card, gameState) > 0,
          message,
        );
      };
    }

    window.__acidPoolExhaustionRule = 'Tier copy limit includes untracked cards in hand, board, and shop.';
    return true;
  }

  function installEverything() {
    if (!patchModules()) return false;
    installTimeTranscendenceLock();
    installSpellAndRerollCounters();
    if (typeof window.runAcidDuplicateCardAudit === 'function') {
      window.setTimeout(window.runAcidDuplicateCardAudit, 0);
    }
    return true;
  }

  if (!installEverything()) {
    window.addEventListener('acid-card-modules-ready', installEverything, { once:true });
  }

  let attempts = 0;
  const poolTimer = window.setInterval(() => {
    attempts += 1;
    if (installPoolExhaustionGuards() || attempts >= 400) {
      window.clearInterval(poolTimer);
    }
  }, 25);
})();
