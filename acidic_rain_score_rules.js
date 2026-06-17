/* Cumulative scoring rules.
 * 1. Whenever an Acidic Rain gains stats, add the gained ATK + HP to score.
 * 2. At each turn end, add the total ATK + HP of all friendly minions.
 * 3. The run ends only after the configured turn limit is completed.
 */
window.addEventListener('load', () => {
  const rainSnapshots = new WeakMap();

  function isAcidicRain(card, index) {
    return Boolean(card) && (
      card.id === 'acidic_rain_copy' ||
      card.name === '酸性降雨' ||
      index === 1
    );
  }

  function numericStat(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
  }

  function ensureScoreState() {
    if (!Number.isFinite(Number(state.score))) state.score = 0;
    if (!Number.isFinite(Number(state.acidRainScore))) state.acidRainScore = 0;
    if (!Number.isFinite(Number(state.boardEndTurnScore))) state.boardEndTurnScore = 0;
  }

  function syncAcidRainScore() {
    ensureScoreState();
    (state.board || []).forEach((card, index) => {
      if (!isAcidicRain(card, index)) return;
      const current = { atk: numericStat(card.atk), hp: numericStat(card.hp) };
      const previous = rainSnapshots.get(card);

      if (!previous) {
        rainSnapshots.set(card, current);
        return;
      }

      const gainedAtk = Math.max(0, current.atk - previous.atk);
      const gainedHp = Math.max(0, current.hp - previous.hp);
      const gainedScore = gainedAtk + gainedHp;

      if (gainedScore > 0) {
        state.acidRainScore += gainedScore;
        state.score += gainedScore;
        state.lastScoreGain = {
          type: 'acidic-rain',
          amount: gainedScore,
          atk: gainedAtk,
          hp: gainedHp
        };
      }

      rainSnapshots.set(card, current);
    });
  }

  function friendlyBoardStatTotal() {
    return (state.board || []).reduce((total, card, index) => {
      if (!card || index < 1 || card.type === 'spell') return total;
      return total + numericStat(card.atk) + numericStat(card.hp);
    }, 0);
  }

  function addEndTurnBoardScore() {
    ensureScoreState();
    syncAcidRainScore();
    const amount = friendlyBoardStatTotal();
    state.boardEndTurnScore += amount;
    state.score += amount;
    state.lastScoreGain = { type: 'board-end-turn', amount };
    return amount;
  }

  function ensureScoreHud() {
    const stats = document.querySelector('.board-stats');
    if (!stats) return null;
    let chip = document.querySelector('#scoreChip');
    if (!chip) {
      chip = document.createElement('span');
      chip.id = 'scoreChip';
      chip.className = 'inline-stat score';
      chip.innerHTML = '<span class="icon">🏆</span><strong id="scoreValue">0</strong>';
      stats.appendChild(chip);
    }
    return chip.querySelector('#scoreValue');
  }

  function renderScoreHud() {
    ensureScoreState();
    const value = ensureScoreHud();
    if (value) value.textContent = String(Math.floor(state.score));
  }

  const previousSetupRun = setupRun;
  setupRun = function() {
    const result = previousSetupRun();
    state.score = 0;
    state.acidRainScore = 0;
    state.boardEndTurnScore = 0;
    state.lastScoreGain = null;
    (state.board || []).forEach((card, index) => {
      if (isAcidicRain(card, index)) {
        rainSnapshots.set(card, { atk: numericStat(card.atk), hp: numericStat(card.hp) });
      }
    });
    renderScoreHud();
    return result;
  };

  const previousEndTurn = endTurn;
  endTurn = function() {
    if (state.gameOver) return false;
    const boardScore = addEndTurnBoardScore();
    const result = previousEndTurn();
    if (!state.gameOver) {
      log(`ターン終了：自陣の合計スタッツ ${boardScore} をスコアに加算。現在 ${state.score}。`);
      render();
    }
    return result;
  };

  endTurnBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    endTurn();
  }, true);

  finishRun = function() {
    syncAcidRainScore();
    state.gameOver = true;
    resultBoxEl.classList.add('show');
    resultScoreEl.textContent = `${Math.floor(state.score)} score`;
    resultTextEl.innerHTML = [
      `酸性降雨の獲得スタッツ：<strong>${Math.floor(state.acidRainScore)}</strong>`,
      `ターン終了時の盤面スタッツ：<strong>${Math.floor(state.boardEndTurnScore)}</strong>`,
      `到達ターン：<strong>${Math.min(state.turn, state.maxTurns)} / ${state.maxTurns}</strong>`
    ].join('<br>');
    log(`ターンリミットに到達。最終スコアは ${Math.floor(state.score)}。`);
    renderScoreHud();
  };

  if (typeof render === 'function') {
    const previousRender = render;
    render = function() {
      syncAcidRainScore();
      const result = previousRender();
      renderScoreHud();
      return result;
    };
  }

  const style = document.createElement('style');
  style.textContent = `
    .inline-stat.score strong {
      color: #ffe47a !important;
      font-size: 1.05rem !important;
    }
    .inline-stat.score {
      border-color: rgba(255,228,122,.35) !important;
      box-shadow: inset 0 0 12px rgba(255,214,80,.08) !important;
    }
  `;
  document.head.appendChild(style);

  ensureScoreState();
  (state.board || []).forEach((card, index) => {
    if (isAcidicRain(card, index)) {
      rainSnapshots.set(card, { atk: numericStat(card.atk), hp: numericStat(card.hp) });
    }
  });
  renderScoreHud();
  render();
}, { once: true });
