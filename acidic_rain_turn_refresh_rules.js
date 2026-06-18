/*
 * Runtime integrity rules:
 * - A new tavern at turn start counts as one reroll when not frozen.
 * - Minions enter the board and leave the hand before their Battlecry resolves.
 * - The normal game uses the authoritative 16-turn limit.
 */
window.addEventListener('load', () => {
  if (window.__acidTurnRefreshRulesInstalled) return;
  window.__acidTurnRefreshRulesInstalled = true;

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const inheritedEndTurn = endTurn;
  endTurn = function() {
    if (state.gameOver) return false;

    const beforeTurn = num(state.turn, 1);
    const beforeRerolls = num(state.rerolls);
    const wasFrozen = Boolean(state.frozen);
    const willOpenNextTurn = Boolean(
      state.endlessMode || beforeTurn < num(state.maxTurns, beforeTurn)
    );
    const shouldCountRefresh = !wasFrozen && willOpenNextTurn;

    // End-turn effects resolve first. The reroll count is incremented immediately
    // before the next tavern is generated, so rightmost-shop buffs affect it.
    let countedRefresh = false;
    let inheritedDrawShop = null;
    if (shouldCountRefresh && typeof drawShop === 'function') {
      inheritedDrawShop = drawShop;
      drawShop = function(...args) {
        if (!countedRefresh) {
          state.rerolls = beforeRerolls + 1;
          countedRefresh = true;
        }
        return inheritedDrawShop.apply(this, args);
      };
    }

    let result;
    try {
      result = inheritedEndTurn();
    } finally {
      if (inheritedDrawShop) drawShop = inheritedDrawShop;
    }

    const advanced = num(state.turn, beforeTurn) > beforeTurn;
    if (!advanced && countedRefresh) {
      state.rerolls = beforeRerolls;
      return result;
    }

    if (advanced && !state.gameOver) {
      if (typeof window.refreshAcidCardUnlocks === 'function') {
        window.refreshAcidCardUnlocks(state);
      }

      if (countedRefresh) {
        if (state.hero?.onReroll) state.hero.onReroll(state);
        if (typeof notifyBoard === 'function') notifyBoard('onRerollCount', state);
        state.__resolvedRerolls = num(state.rerolls);
        if (typeof updateAuras === 'function') updateAuras();
        if (typeof log === 'function') {
          log('ターン開始時の新しい酒場を、入替1回として数えた。');
        }
      }
      if (typeof render === 'function') render();
    }

    return result;
  };

  // The original play flow resolved Battlecries while the minion was still in
  // the hand and before its board slot was occupied. That caused summon effects
  // such as 野良猫 to be overwritten, and blocked generated cards at full hand.
  if (!window.__acidMinionPlayOrderFixed && typeof playHandCardToSlot === 'function') {
    window.__acidMinionPlayOrderFixed = true;
    const inheritedPlayHandCardToSlot = playHandCardToSlot;

    playHandCardToSlot = function(index, targetIndex) {
      const sourceCard = state.hand?.[index] || null;
      if (!sourceCard || sourceCard.type === 'spell') {
        return inheritedPlayHandCardToSlot(index, targetIndex);
      }
      if (state.gameOver) return false;

      if (
        typeof window.canPlayAcidCard === 'function'
        && !window.canPlayAcidCard(sourceCard, state)
      ) {
        const message = typeof window.describeAcidCardLock === 'function'
          ? window.describeAcidCardLock(sourceCard, state)
          : `${sourceCard.name}は現在使用できない。`;
        if (typeof log === 'function') log(message);
        if (typeof render === 'function') render();
        return false;
      }

      if (targetIndex == null || targetIndex < 2 || state.board?.[targetIndex]) {
        if (typeof log === 'function') log('盤面がいっぱい。');
        if (typeof render === 'function') render();
        return false;
      }

      const played = typeof initializedClone === 'function'
        ? initializedClone(sourceCard)
        : { ...sourceCard };

      // Occupy the destination and remove the card from hand first. Battlecries
      // can now summon into other slots and gain cards into the freed hand slot.
      state.board[targetIndex] = played;
      state.hand.splice(index, 1);

      const baseMultiplier = Math.max(1, num(state.battlecryMultiplier, 1));
      const extraMultiplier = Math.max(0, num(state.nextBattlecryMultiplier));
      const triggerCount = Math.max(1, baseMultiplier + extraMultiplier);
      state.nextBattlecryMultiplier = 0;

      if (typeof played.battlecry === 'function') {
        for (let repeat = 0; repeat < triggerCount; repeat += 1) {
          played.battlecry(state);
        }
      }
      if (typeof played.onPlay === 'function') played.onPlay(state);
      if (played.tribe === 'エレメンタル' && typeof notifyBoard === 'function') {
        notifyBoard('onElementalPlayed', state, played);
      }

      state.cardsPlayedThisTurn = num(state.cardsPlayedThisTurn) + 1;
      if (typeof updateAuras === 'function') updateAuras();
      if (typeof log === 'function') log(`${played.emoji || ''} ${played.name} を手札から場に出した。`);
      if (typeof render === 'function') render();
      return true;
    };
  }

  // Restore the specified 16-turn normal mode after the older core layer has
  // initialized its prototype eight-turn setting.
  function applyTurnLimit() {
    if (!state.endlessMode) state.maxTurns = Math.max(16, num(state.maxTurns));
    const select = document.querySelector('#gameModeSelect');
    const limitOption = select?.querySelector('option[value="limit"]');
    if (limitOption) limitOption.textContent = '16ターン';
  }

  const inheritedInitialState = initialState;
  initialState = function() {
    const result = inheritedInitialState();
    if (!state.endlessMode) state.maxTurns = 16;
    return result;
  };

  const inheritedSetupRun = setupRun;
  setupRun = function() {
    const result = inheritedSetupRun();
    if (!state.endlessMode) state.maxTurns = 16;
    return result;
  };

  applyTurnLimit();

  // Rightmost-shop effects use the fixed rightmost minion slot. Buying that card
  // does not move the effect to the minion on its left.
  function fixedRightmostMinion(gameState) {
    const slotCount = typeof window.getBaseShopMinionSlots === 'function'
      ? window.getBaseShopMinionSlots(gameState?.tavernTier)
      : Math.min(6, 2 + Math.max(1, num(gameState?.tavernTier, 1)));
    const target = gameState?.shop?.[Math.max(0, slotCount - 1)] || null;
    return target && target.type !== 'spell' ? target : null;
  }

  function applyFixedEastWind(gameState) {
    const target = fixedRightmostMinion(gameState);
    if (!target) return false;
    const stacks = Math.max(0, num(gameState.eastWindStacks));
    const applied = Math.max(0, num(target.eastWindAppliedStacks));
    const difference = stacks - applied;
    if (difference <= 0) return false;
    target.atk = num(target.atk) + 6 * difference;
    target.hp = num(target.hp) + 6 * difference;
    target.eastWindAppliedStacks = stacks;
    return true;
  }

  window.applyEastWindToRightmost = applyFixedEastWind;
  const eastWind = (typeof SPELLS !== 'undefined' ? SPELLS : []).find(card => card?.name === '東からの風');
  if (eastWind) {
    eastWind.cast = function(gameState) {
      gameState.eastWindStacks = num(gameState.eastWindStacks) + 1;
      applyFixedEastWind(gameState);
      if (typeof log === 'function') {
        log('このゲーム中、酒場の固定右端ミニオンに+6/+6を付与する。');
      }
      return true;
    };
  }

  // Finalize the corrected token name after the older event bridge has loaded.
  if (typeof TOKEN_CARDS !== 'undefined' && TOKEN_CARDS.gift) {
    TOKEN_CARDS.gift.name = '贈り物';
  }
  const tierSixModule = window.AcidCardModules?.get?.('minion', 6) || null;
  const maxwellDefinition = tierSixModule?.definitions?.find(card => card?.name === 'マクスウェル');
  if (maxwellDefinition) {
    maxwellDefinition.text = 'このカードを売った時、「贈り物」を1枚得る。';
    maxwellDefinition.awakenedText = 'このカードを売った時、「贈り物」を2枚得る。';
  }
  const maxwell = (typeof MINIONS !== 'undefined' ? MINIONS : [])
    .find(card => card?.name === 'マクスウェル' && num(card.tier) === 6);
  if (maxwell) {
    maxwell.text = 'このカードを売った時、「贈り物」を1枚得る。';
    maxwell.awakenedText = 'このカードを売った時、「贈り物」を2枚得る。';
  }
}, { once: true });