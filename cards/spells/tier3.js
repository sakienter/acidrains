/* Tier 3 spell effects and tier-specific lifecycle hooks. */
(() => {
  const modules = window.AcidCardModules;
  const num = value => Number(value || 0);

  function say(message) {
    if (typeof log === 'function' && message) log(message);
  }

  function activateTemporaryTimeRewrite(gameState) {
    gameState.timeRewriteCharges = num(gameState.timeRewriteCharges) + 3;
    say('次に使う3回のスペルが追加で1回発動する。');
  }

  function chooseTarget(entries, title) {
    if (!entries.length) return null;
    const lines = entries.map((entry, index) =>
      `${index + 1}. ${entry.card.emoji || '🃏'} ${entry.card.name}［Tier ${entry.card.tier || '-'}］`
    ).join('\n');
    const answer = window.prompt(`${title}\n${lines}\n番号を入力してください。`, '1');
    return entries[Number(answer) - 1] || entries[0];
  }

  function castZerek(gameState) {
    const handLimit = typeof HAND_LIMIT === 'number' ? HAND_LIMIT : 10;
    if (gameState.hand.length >= handLimit) {
      say('手札がいっぱいのため、ゼレクは不発だった。');
      return;
    }

    const entries = (gameState.board || [])
      .map((card, index) => ({ card, index }))
      .filter(entry => entry.index >= 1 && entry.card && entry.card.type !== 'spell');
    const selected = chooseTarget(entries, 'ゼレク：コピーする自陣のカードを選択');
    if (!selected) {
      say('コピーできる自陣のカードがないため、ゼレクは不発だった。');
      return;
    }

    const copy = typeof initializedClone === 'function'
      ? initializedClone(selected.card)
      : typeof cloneCard === 'function'
        ? cloneCard(selected.card)
        : { ...selected.card };
    delete copy.frozen;
    gameState.hand.push(copy);
    say(`${selected.card.name} のコピーを1枚得た。`);
  }

  function extendTurnLimit(gameState) {
    gameState.maxTurns = num(gameState.maxTurns) + 1;
    say(`リミットターンが1増え、${gameState.maxTurns}ターンになった。`);
  }

  function castAwakeningSpell(gameState) {
    const entries = (gameState.board || [])
      .map((card, index) => ({ card, index }))
      .filter(entry =>
        entry.index >= 2 &&
        entry.card &&
        entry.card.type !== 'spell' &&
        num(entry.card.tier) === 1 &&
        !entry.card.awakened
      );
    const selected = chooseTarget(entries, '覚醒化：覚醒させる自陣のTier1カードを選択');
    if (!selected) {
      say('覚醒できる自陣のTier1カードがないため、覚醒化は不発だった。');
      return;
    }

    const target = selected.card;
    target.awakened = true;
    if (target.awakenedText) target.text = target.awakenedText;
    say(`✨ ${target.name} を覚醒させた。`);
  }

  modules.register({
    kind: 'spell',
    tier: 3,
    label: 'ティア3・スペル',
    effects: {
      '一時的な時間改竄': () => ({
        cast(gameState) {
          activateTemporaryTimeRewrite(gameState);
        },
      }),

      'ゼレク': () => ({
        cast(gameState) {
          castZerek(gameState);
        },
      }),

      '時空の超越': () => ({
        cast(gameState) {
          extendTurnLimit(gameState);
        },
      }),

      '覚醒化': () => ({
        cast(gameState) {
          castAwakeningSpell(gameState);
        },
      }),
    },

    apply() {
      if (typeof state !== 'undefined') {
        state.timeRewriteCharges = num(state.timeRewriteCharges);
      }

      if (!window.__tier3SpellInitialStatePatched && typeof initialState === 'function') {
        window.__tier3SpellInitialStatePatched = true;
        const previousInitialState = initialState;
        initialState = function() {
          const result = previousInitialState();
          state.timeRewriteCharges = 0;
          return result;
        };
      }

      if (!window.__tier3SpellPlayPatched && typeof playHandCardToSlot === 'function') {
        window.__tier3SpellPlayPatched = true;
        const previousPlay = playHandCardToSlot;
        playHandCardToSlot = function(index, targetIndex) {
          const card = state.hand[index];
          const shouldRepeat = Boolean(
            card &&
            card.type === 'spell' &&
            card.id !== 'temporary_time_rewrite' &&
            state.timeRewriteCharges > 0
          );

          if (shouldRepeat) state.timeRewriteCharges -= 1;
          const result = previousPlay(index, targetIndex);

          if (result && shouldRepeat && typeof card.cast === 'function') {
            card.cast(state);
            if (typeof updateAuras === 'function') updateAuras();
            say(`${card.emoji || '✨'} ${card.name} が追加でもう1回発動した。残り${state.timeRewriteCharges}回。`);
            if (typeof render === 'function') render();
          }
          return result;
        };
      }

      if (!window.__tier3SpellEndTurnPatched && typeof endTurn === 'function') {
        window.__tier3SpellEndTurnPatched = true;
        const previousEndTurn = endTurn;
        endTurn = function() {
          const beforeTurn = state.turn;
          const result = previousEndTurn();
          if (state.turn > beforeTurn && state.timeRewriteCharges > 0) {
            state.timeRewriteCharges = 0;
            say('一時的な時間改竄の未使用回数はターン終了時に失われた。');
          }
          return result;
        };
      }

      window.__tier3SpellEffectsImplemented = [
        '一時的な時間改竄',
        'ゼレク',
        '時空の超越',
        '覚醒化',
      ];
    },
  });
})();
