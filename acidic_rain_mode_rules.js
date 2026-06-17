(() => {
  const LIMIT_TURNS = 16;
  const TURN_TIMES = [40, 40, 50, 50, 60, 60, 80, 80, 100, 100, 120, 120, 140, 140, 160, 160];
  const TURN_GOLD = [3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10];
  const MAX_TURN_SECONDS = 160;

  let selectedMode = localStorage.getItem('acidRainGameMode') || 'limit';
  let timerId = null;
  let timerDeadline = 0;
  let timerTurn = null;

  function turnSeconds(turn) {
    const index = Math.max(0, Number(turn || 1) - 1);
    return Math.min(MAX_TURN_SECONDS, TURN_TIMES[index] ?? MAX_TURN_SECONDS);
  }

  function turnGold(turn) {
    const index = Math.max(0, Number(turn || 1) - 1);
    return TURN_GOLD[index] ?? 10;
  }

  function applyMode({ resetLimit = false } = {}) {
    if (typeof state === 'undefined') return;
    state.gameMode = selectedMode;
    if (selectedMode === 'endless') {
      state.maxTurns = Number.POSITIVE_INFINITY;
      return;
    }

    // Preserve extensions granted by 時空の超越. Only a new run resets to 16.
    if (resetLimit || !Number.isFinite(state.maxTurns) || state.maxTurns < LIMIT_TURNS) {
      state.maxTurns = LIMIT_TURNS;
    }
  }

  function ensureModeUi() {
    const stats = document.querySelector('.board-stats');
    if (!stats) return;

    if (!document.querySelector('#turnTimerStat')) {
      const timerWrap = document.createElement('span');
      timerWrap.className = 'inline-stat';
      timerWrap.id = 'turnTimerStat';
      timerWrap.innerHTML = '<span class="icon" aria-hidden="true">⏱️</span><strong id="turnTimerValue">--</strong>';
      stats.appendChild(timerWrap);
    }

    if (!document.querySelector('#turnNumberStat')) {
      const turnWrap = document.createElement('span');
      turnWrap.className = 'inline-stat';
      turnWrap.id = 'turnNumberStat';
      turnWrap.innerHTML = '<span class="icon" aria-hidden="true">🔢</span><strong id="turnNumberValue">1 / 16</strong>';
      stats.appendChild(turnWrap);
    }

    if (document.querySelector('#gameModeSelect')) return;

    const wrap = document.createElement('label');
    wrap.className = 'inline-stat game-mode-stat';
    wrap.innerHTML = `
      <span class="icon" aria-hidden="true">⏳</span>
      <span class="hud-label">モード</span>
      <select id="gameModeSelect" aria-label="ゲームモード">
        <option value="limit">リミット（${LIMIT_TURNS}ターン）</option>
        <option value="endless">エンドレス</option>
      </select>
    `;
    stats.appendChild(wrap);

    const select = wrap.querySelector('#gameModeSelect');
    select.value = selectedMode;
    select.addEventListener('change', () => {
      selectedMode = select.value;
      localStorage.setItem('acidRainGameMode', selectedMode);
      setupRun();
      log(selectedMode === 'endless'
        ? 'エンドレスモードを開始。ターン上限はありません。'
        : `リミットモードを開始。${LIMIT_TURNS}ターン終了時にゲーム終了です。`);
      render();
    });

    const style = document.createElement('style');
    style.textContent = `
      .game-mode-stat select {
        border: 0;
        outline: 0;
        color: #fff3d2;
        background: rgba(37, 24, 15, .72);
        border-radius: 999px;
        padding: 5px 9px;
        font: inherit;
        font-size: .78rem;
        font-weight: 700;
        cursor: pointer;
      }
      .game-mode-stat select option { color: #24170f; background: #f3dfb7; }
      #turnTimerStat.timer-warning strong { color: #ffb36b; }
      #turnTimerStat.timer-danger strong { color: #ff776f; animation: timerPulse .8s infinite alternate; }
      @keyframes timerPulse { from { opacity: 1; } to { opacity: .55; } }
    `;
    document.head.appendChild(style);
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function updateTimerUi() {
    const timerValue = document.querySelector('#turnTimerValue');
    const timerStat = document.querySelector('#turnTimerStat');
    if (!timerValue || !timerStat) return;

    if (state.gameOver) {
      timerValue.textContent = '終了';
      timerStat.classList.remove('timer-warning', 'timer-danger');
      return;
    }

    const remaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    timerValue.textContent = `${remaining}秒`;
    timerStat.classList.toggle('timer-warning', remaining <= 20 && remaining > 10);
    timerStat.classList.toggle('timer-danger', remaining <= 10);
  }

  function startTurnTimer(force = false) {
    if (state.gameOver) {
      stopTimer();
      updateTimerUi();
      return;
    }
    if (!force && timerTurn === state.turn && timerId !== null) return;

    stopTimer();
    timerTurn = state.turn;
    timerDeadline = Date.now() + turnSeconds(state.turn) * 1000;
    updateTimerUi();

    timerId = setInterval(() => {
      if (state.gameOver || state.turn !== timerTurn) {
        stopTimer();
        return;
      }
      updateTimerUi();
      if (Date.now() >= timerDeadline) {
        stopTimer();
        log(`ターン${state.turn}の制限時間が終了したため、自動でターンエンドします。`);
        endTurn();
      }
    }, 250);
  }

  const originalSetupRun = setupRun;
  setupRun = function() {
    originalSetupRun();
    applyMode({ resetLimit: true });
    state.maxGold = 10;
    state.gold = turnGold(1);
    timerTurn = null;
    startTurnTimer(true);
  };

  const originalEndTurn = endTurn;
  endTurn = function() {
    const beforeTurn = state.turn;
    const result = originalEndTurn();
    if (state.turn > beforeTurn && !state.gameOver) {
      const bonus = Number(state.nextTurnGoldBonus || 0);
      // Other turn handlers may already consume the bonus, so only add it when still pending.
      if (state.nextTurnGoldBonus) state.nextTurnGoldBonus = 0;
      state.gold = Math.min(Number(state.maxGold || 10), turnGold(state.turn) + bonus);
      startTurnTimer(true);
      render();
    } else if (state.gameOver) {
      stopTimer();
    }
    return result;
  };

  const originalRenderHud = renderHud;
  renderHud = function() {
    applyMode();
    originalRenderHud();
    ensureModeUi();

    const modeSelect = document.querySelector('#gameModeSelect');
    if (modeSelect && modeSelect.value !== selectedMode) modeSelect.value = selectedMode;

    const turnValue = document.querySelector('#turnNumberValue');
    if (turnValue) {
      turnValue.textContent = selectedMode === 'endless'
        ? `${state.turn}`
        : `${state.turn} / ${Number.isFinite(state.maxTurns) ? state.maxTurns : LIMIT_TURNS}`;
    }

    if (selectedMode === 'limit' && !state.gameOver) {
      const remaining = Math.max(0, state.maxTurns - state.turn + 1);
      modeSelect?.setAttribute('title', `残り${remaining}ターン`);
    } else {
      modeSelect?.setAttribute('title', 'ターン上限なし');
    }

    startTurnTimer();
    updateTimerUi();
  };

  applyMode({ resetLimit: true });
  state.maxGold = 10;
  state.gold = turnGold(state.turn || 1);
  ensureModeUi();
  startTurnTimer(true);
  render();
})();