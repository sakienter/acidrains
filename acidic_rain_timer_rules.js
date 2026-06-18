/* Turn limit, per-turn clock, and starting-gold schedule. */
window.addEventListener("load", () => {
  if (window.__acidTurnTimerInstalled) return;
  window.__acidTurnTimerInstalled = true;

  const TURN_GOLD = Object.freeze({
    1: 3,
    2: 4,
    3: 5,
    4: 6,
    5: 7,
    6: 8,
    7: 9,
  });

  const TURN_TIME = Object.freeze({
    1: 25,
    2: 25,
    3: 40,
    4: 40,
    5: 65,
    6: 65,
    7: 80,
    8: 80,
    9: 100,
    10: 100,
    11: 100,
    12: 100,
  });

  const DEFAULT_TURN_LIMIT = 12;
  const MAX_TURN_SECONDS = 100;
  let timerId = null;
  let turnDeadline = 0;
  let resolvingTimeout = false;

  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  window.getBaseGoldForTurn = turn => {
    const normalizedTurn = Math.max(1, Math.floor(num(turn, 1)));
    return TURN_GOLD[normalizedTurn] ?? 10;
  };

  window.getStartingGoldForTurn = (gameState, turn = gameState?.turn) => {
    return getBaseGoldForTurn(turn) + Math.max(0, num(gameState?.startingGoldBonus));
  };

  window.increaseStartingGold = (gameState, amount, grantImmediately = true) => {
    const gain = Math.max(0, num(amount));
    if (!gain) return 0;
    gameState.startingGoldBonus = Math.max(0, num(gameState.startingGoldBonus)) + gain;
    gameState.maxGold = getStartingGoldForTurn(gameState, gameState.turn);
    if (grantImmediately) gameState.gold = num(gameState.gold) + gain;
    return gain;
  };

  window.getTurnTimeLimit = turn => {
    const normalizedTurn = Math.max(1, Math.floor(num(turn, 1)));
    return Math.min(MAX_TURN_SECONDS, TURN_TIME[normalizedTurn] ?? MAX_TURN_SECONDS);
  };

  window.getCompletedTurnCount = gameState => {
    const completed = Math.max(0, Math.floor(num(gameState?.turn, 1)) - 1);
    if (gameState?.endlessMode) return completed;
    const limit = Math.max(DEFAULT_TURN_LIMIT, Math.floor(num(gameState?.maxTurns, DEFAULT_TURN_LIMIT)));
    return Math.min(limit, completed);
  };

  function ensureHud() {
    const stats = document.querySelector(".board-stats");
    if (!stats) return {};

    let turnValue = document.querySelector("#turnValue");
    if (!turnValue) {
      const chip = document.createElement("span");
      chip.className = "inline-stat turn-stat";
      chip.innerHTML = '<span class="icon">◷</span><span class="hud-label">ターン</span><strong id="turnValue">0/12</strong>';
      stats.appendChild(chip);
      turnValue = chip.querySelector("#turnValue");
    }

    let timerValue = document.querySelector("#turnTimerValue");
    if (!timerValue) {
      const chip = document.createElement("span");
      chip.className = "inline-stat timer-stat";
      chip.innerHTML = '<span class="icon">⏱️</span><span class="hud-label">残り</span><strong id="turnTimerValue">25</strong><span>秒</span>';
      stats.appendChild(chip);
      timerValue = chip.querySelector("#turnTimerValue");
    }

    return { turnValue, timerValue };
  }

  function paintClock() {
    const { turnValue, timerValue } = ensureHud();
    const finiteLimit = state.endlessMode
      ? "∞"
      : Math.max(DEFAULT_TURN_LIMIT, Math.floor(num(state.maxTurns, DEFAULT_TURN_LIMIT)));
    const completedTurns = getCompletedTurnCount(state);

    if (turnValue) {
      turnValue.textContent = `${completedTurns}/${finiteLimit}`;
      turnValue.closest(".turn-stat")?.setAttribute(
        "aria-label",
        state.endlessMode
          ? `終了済みターン ${completedTurns}`
          : `終了済みターン ${completedTurns} / ${finiteLimit}`
      );
    }

    if (timerValue) {
      timerValue.textContent = Math.max(0, Math.ceil(num(state.turnTimeRemaining)));
      timerValue.closest(".timer-stat")?.classList.toggle(
        "timer-warning",
        num(state.turnTimeRemaining) <= 10 && !state.gameOver && !state.isPaused
      );
    }
  }

  function captureRemainingTime() {
    if (turnDeadline > 0) {
      state.turnTimeRemaining = Math.max(0, (turnDeadline - Date.now()) / 1000);
    }
    return Math.max(0, num(state.turnTimeRemaining));
  }

  function stopTimer() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    turnDeadline = 0;
  }

  window.stopAcidTurnTimer = stopTimer;

  window.pauseAcidTurnTimer = function() {
    captureRemainingTime();
    stopTimer();
    paintClock();
    return true;
  };

  window.resumeAcidTurnTimer = function() {
    stopTimer();
    if (state.gameOver || !state.hasStarted || state.turnTransitioning) {
      paintClock();
      return false;
    }

    const remaining = Math.max(0, num(state.turnTimeRemaining));
    if (remaining <= 0) {
      paintClock();
      if (!resolvingTimeout) {
        resolvingTimeout = true;
        window.setTimeout(() => {
          try {
            endTurn();
          } finally {
            resolvingTimeout = false;
          }
        }, 0);
      }
      return true;
    }

    turnDeadline = Date.now() + remaining * 1000;
    paintClock();
    timerId = window.setInterval(updateTimerFromDeadline, 250);
    return true;
  };

  function updateTimerFromDeadline() {
    if (state.isPaused) {
      captureRemainingTime();
      stopTimer();
      paintClock();
      return;
    }

    if (state.gameOver || !state.hasStarted) {
      stopTimer();
      paintClock();
      return;
    }

    state.turnTimeRemaining = Math.max(0, (turnDeadline - Date.now()) / 1000);
    paintClock();

    if (state.turnTimeRemaining > 0 || resolvingTimeout) return;

    resolvingTimeout = true;
    stopTimer();
    log(`ターン${state.turn}は時間切れになった。`);
    window.setTimeout(() => {
      try {
        endTurn();
      } finally {
        resolvingTimeout = false;
      }
    }, 0);
  }

  function startTurnTimer() {
    stopTimer();
    if (state.gameOver || !state.hasStarted || state.isPaused) {
      paintClock();
      return;
    }

    state.turnTimeLimit = getTurnTimeLimit(state.turn);
    state.turnTimeRemaining = state.turnTimeLimit;
    turnDeadline = Date.now() + state.turnTimeLimit * 1000;
    paintClock();
    timerId = window.setInterval(updateTimerFromDeadline, 250);
  }

  function initializeRunProgression() {
    state.isPaused = false;
    state.startingGoldBonus = 0;
    state.baseTurnGold = getBaseGoldForTurn(1);
    state.maxGold = getStartingGoldForTurn(state, 1);
    state.gold = state.maxGold;
    state.maxTurns = state.endlessMode ? Number.MAX_SAFE_INTEGER : DEFAULT_TURN_LIMIT;
    state.turnTimeLimit = getTurnTimeLimit(1);
    state.turnTimeRemaining = state.turnTimeLimit;
  }

  const inheritedSetupRun = setupRun;
  setupRun = function() {
    const result = inheritedSetupRun();
    initializeRunProgression();
    if (state.hasStarted && !state.gameOver) startTurnTimer();
    else paintClock();
    render();
    return result;
  };

  const inheritedEndTurn = endTurn;
  endTurn = function() {
    if (state.gameOver || state.isPaused) return false;
    const beforeTurn = num(state.turn, 1);
    stopTimer();
    const result = inheritedEndTurn();
    if (!state.gameOver && num(state.turn, 1) > beforeTurn) startTurnTimer();
    else paintClock();
    return result;
  };

  const inheritedFinishRun = finishRun;
  finishRun = function() {
    state.isPaused = false;
    stopTimer();
    const result = inheritedFinishRun();
    paintClock();
    return result;
  };

  const inheritedRender = render;
  render = function() {
    const result = inheritedRender();
    paintClock();
    return result;
  };

  const style = document.createElement("style");
  style.textContent = `
    .timer-stat strong { min-width: 2.4ch; text-align: right; }
    .timer-stat.timer-warning { border-color: rgba(255, 116, 88, .72); }
    .timer-stat.timer-warning strong { color: #ff9d7d; }
    .hud-label { opacity: .76; font-size: .78rem; }
  `;
  document.head.appendChild(style);

  const modeSelect = document.querySelector("#gameModeSelect");
  const limitOption = modeSelect?.querySelector('option[value="limit"]');
  if (limitOption) limitOption.textContent = "12ターン";

  const startButton = document.querySelector("#gameStartBtn");
  startButton?.addEventListener("click", () => {
    state.isPaused = false;
    state.maxTurns = state.endlessMode ? Number.MAX_SAFE_INTEGER : DEFAULT_TURN_LIMIT;
    if (!state.endlessMode) log("12ターンのスコアアタックを開始しました。");
    startTurnTimer();
    render();
  });

  state.isPaused = false;
  state.startingGoldBonus = Math.max(0, num(state.startingGoldBonus));
  state.maxTurns = state.endlessMode ? Number.MAX_SAFE_INTEGER : DEFAULT_TURN_LIMIT;
  state.turnTimeLimit = getTurnTimeLimit(state.turn);
  state.turnTimeRemaining = state.turnTimeLimit;
  paintClock();
}, { once: true });
