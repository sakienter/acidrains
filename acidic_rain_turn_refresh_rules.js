/*
 * Runtime integrity rules:
 * - A new tavern at turn start counts as one reroll when not frozen.
 * - Played cards leave the hand before their effects resolve.
 * - Minions occupy their destination before their Battlecry resolves.
 * - The normal game uses the authoritative 16-turn limit.
 */
window.addEventListener('load', () => {
  if (window.__acidTurnRefreshRulesInstalled) return;
  window.__acidTurnRefreshRulesInstalled = true;

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const cloneCardInstance = card => {
    if (!card) return null;
    if (typeof initializedClone === 'function') return initializedClone(card);
    if (typeof cloneCard === 'function') return cloneCard(card);
    return { ...card };
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

  function repeatSpellActivation(gameState, spell) {
    if (!spell || typeof spell.cast !== 'function') return false;
    if (spell.name === 'エンドロール') {
      const bonus = Math.floor(Math.max(0, num(gameState.turnTimeRemaining)) / 10);
      gameState.nextTurnGoldBonus = num(gameState.nextTurnGoldBonus) + bonus;
      if (typeof log === 'function') {
        log(`エンドロールが追加発動し、次のターンの追加ゴールドがさらに${bonus}増えた。`);
      }
      return true;
    }
    spell.cast(gameState);
    return true;
  }

  function spellRepeatCount(spell) {
    let repeats = 0;

    if (typeof window.consumeAcidTaurenSpellRepeats === 'function') {
      repeats += Math.max(0, num(window.consumeAcidTaurenSpellRepeats()));
    }

    if (spell.name !== '一時的な時間改竄' && num(state.timeRewriteCharges) > 0) {
      state.timeRewriteCharges = Math.max(0, num(state.timeRewriteCharges) - 1);
      repeats += 1;
    }

    if (num(state.doubleSpellCharges) > 0) {
      state.doubleSpellCharges = Math.max(0, num(state.doubleSpellCharges) - 1);
      repeats += 1;
    }

    return repeats;
  }

  function recordSpellUse(spell) {
    const historyCard = cloneCardInstance(spell);
    state.cardsPlayedThisTurn = num(state.cardsPlayedThisTurn) + 1;

    if ([1, 2].includes(num(spell.tier))) {
      state.tier2SpellHistory = Array.isArray(state.tier2SpellHistory)
        ? state.tier2SpellHistory
        : [];
      state.tier2SpellHistory.push(cloneCardInstance(historyCard));
    }

    state.spellHistoryThisTurn = Array.isArray(state.spellHistoryThisTurn)
      ? state.spellHistoryThisTurn
      : [];
    state.spellHistoryThisTurn.push(historyCard);
  }

  function playSpellFromHand(index, spell) {
    if (spell.unplayable || spell.name === '円盤の破片') {
      if (typeof log === 'function') {
        log(`${spell.name}は使用できない。必要な条件を満たすと自動で変化する。`);
      }
      if (typeof render === 'function') render();
      return false;
    }
    if (typeof spell.cast !== 'function') {
      if (typeof log === 'function') log(`${spell.name}の効果を発動できない。`);
      return false;
    }

    const repeats = spellRepeatCount(spell);

    // Remove the spell first. Generated cards can use the newly freed hand slot.
    state.hand.splice(index, 1);
    spell.cast(state);
    if (typeof notifyBoard === 'function') notifyBoard('onSpellCast', state, spell);

    for (let repeat = 0; repeat < repeats; repeat += 1) {
      repeatSpellActivation(state, spell);
      if (typeof notifyBoard === 'function') notifyBoard('onSpellCast', state, spell);
    }

    recordSpellUse(spell);
    if (typeof updateAuras === 'function') updateAuras();
    if (typeof log === 'function') {
      const repeatText = repeats > 0 ? `（追加で${repeats}回発動）` : '';
      log(`${spell.emoji || ''} ${spell.name}を手札から使用した。${repeatText}`);
    }
    if (typeof render === 'function') render();
    return true;
  }

  // This wrapper is installed after the event bridge and before the awakening
  // reward wrapper, making it the authoritative non-targeted play flow.
  if (!window.__acidCardPlayOrderFixed && typeof playHandCardToSlot === 'function') {
    window.__acidCardPlayOrderFixed = true;
    const inheritedPlayHandCardToSlot = playHandCardToSlot;

    playHandCardToSlot = function(index, targetIndex) {
      const sourceCard = state.hand?.[index] || null;
      if (!sourceCard) return false;
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

      if (sourceCard.type === 'spell') {
        return playSpellFromHand(index, sourceCard);
      }

      if (targetIndex == null || targetIndex < 2 || state.board?.[targetIndex]) {
        if (typeof log === 'function') log('盤面がいっぱい。');
        if (typeof render === 'function') render();
        return false;
      }

      const played = cloneCardInstance(sourceCard);
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
      if (typeof log === 'function') log(`${played.emoji || ''} ${played.name}を手札から場に出した。`);
      if (typeof render === 'function') render();
      return true;
    };
  }

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
  document.querySelector('#gameStartBtn')?.addEventListener('click', () => {
    window.setTimeout(() => {
      if (!state.endlessMode) state.maxTurns = 16;
      if (typeof render === 'function') render();
    }, 0);
  });

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