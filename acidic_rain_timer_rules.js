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

  function getRopeStage() {
    return document.querySelector(".table-board")
      || document.querySelector(".shell")
      || document.body;
  }

  function getRopeLayoutTarget() {
    return {
      divider: document.querySelector("#tradeLine"),
      shop: document.querySelector(".shop-grid"),
      board: document.querySelector(".board-slots"),
    };
  }

  function ensureRope() {
    let rope = document.querySelector("#turnRopeOverlay");
    if (rope) return rope;

    const stage = getRopeStage();
    if (!stage) return null;

    if (window.getComputedStyle(stage).position === "static") {
      stage.style.position = "relative";
    }

    rope = document.createElement("div");
    rope.id = "turnRopeOverlay";
    rope.setAttribute("aria-hidden", "true");
    rope.innerHTML = `
      <div class="turn-rope-track"></div>
      <div class="turn-rope-line"></div>
      <div class="turn-rope-burn"></div>
    `;
    stage.appendChild(rope);
    return rope;
  }

  function layoutRope() {
    const rope = ensureRope();
    const stage = getRopeStage();
    const { divider, shop, board } = getRopeLayoutTarget();
    if (!rope || !stage) return false;

    const stageRect = stage.getBoundingClientRect();
    let left;
    let right;
    let centerY;

    if (divider) {
      const dividerRect = divider.getBoundingClientRect();
      left = dividerRect.left;
      right = dividerRect.right;
      centerY = dividerRect.top + dividerRect.height / 2;
    } else if (shop && board) {
      const shopRect = shop.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      left = Math.max(shopRect.left, boardRect.left);
      right = Math.min(shopRect.right, boardRect.right);
      centerY = (shopRect.bottom + boardRect.top) / 2;
    } else {
      return false;
    }

    rope.style.left = `${left - stageRect.left}px`;
    rope.style.top = `${centerY - stageRect.top - 12}px`;
    rope.style.width = `${Math.max(0, right - left)}px`;
    return right > left;
  }

  function paintRope() {
    const rope = ensureRope();
    if (!rope) return;

    const remaining = Math.max(0, num(state.turnTimeRemaining));
    const visible =
      state.hasStarted &&
      !state.gameOver &&
      remaining > 0 &&
      remaining <= 20;

    rope.classList.toggle("show", visible);
    rope.classList.toggle("paused", Boolean(state.isPaused));

    if (!visible) {
      rope.style.setProperty("--rope-progress", "0");
      rope.style.setProperty("--rope-burn-progress", "0");
      return;
    }

    if (!layoutRope()) {
      rope.classList.remove("show");
      return;
    }

    const progress = Math.max(0, Math.min(1, remaining / 20));
    const burnProgress = 1 - progress;

    rope.style.setProperty("--rope-progress", String(progress));
    rope.style.setProperty("--rope-burn-progress", String(burnProgress));

    const ropeLine = rope.querySelector(".turn-rope-line");
    const burn = rope.querySelector(".turn-rope-burn");

    if (ropeLine) ropeLine.style.width = `${progress * 100}%`;
    if (burn) burn.style.left = `calc(${burnProgress * 100}% - 14px)`;
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

    paintRope();
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

    #turnRopeOverlay {
      --rope-progress: 0;
      --rope-burn-progress: 0;
      position: absolute;
      height: 24px;
      pointer-events: none;
      opacity: 0;
      transition: opacity .18s ease;
      z-index: 60;
      overflow: visible;
    }

    #turnRopeOverlay.show { opacity: 1; }

    #turnRopeOverlay .turn-rope-track {
      position: absolute;
      inset: 10px 0 auto 0;
      height: 4px;
      border-radius: 999px;
      background: rgba(255, 232, 180, .14);
      box-shadow: 0 0 0 1px rgba(80, 48, 18, .15) inset;
    }

    #turnRopeOverlay .turn-rope-line {
      position: absolute;
      right: 0;
      top: 10px;
      height: 4px;
      width: 0%;
      border-radius: 999px;
      background: linear-gradient(180deg, #d9b071 0%, #a56c35 45%, #704119 100%);
      box-shadow:
        0 0 6px rgba(255, 196, 110, .22),
        0 0 1px rgba(0, 0, 0, .45) inset;
      transition: width .22s linear;
    }

    #turnRopeOverlay .turn-rope-burn {
      position: absolute;
      top: 1px;
      width: 28px;
      height: 20px;
      border-radius: 50%;
      filter: drop-shadow(0 0 6px rgba(255, 149, 64, .55));
      transition: left .22s linear;
      background:
        radial-gradient(circle at 50% 62%, rgba(255, 241, 195, .98) 0 12%, rgba(255, 209, 95, .95) 13% 30%, rgba(255, 118, 40, .88) 31% 54%, rgba(255, 72, 24, .50) 55% 68%, transparent 69%),
        radial-gradient(circle at 36% 34%, rgba(255, 235, 156, .9) 0 10%, transparent 11%),
        radial-gradient(circle at 66% 26%, rgba(255, 170, 73, .7) 0 10%, transparent 11%);
      transform: rotate(-8deg);
      animation: ropeFlameFlicker .22s infinite alternate ease-in-out;
    }

    #turnRopeOverlay.paused .turn-rope-line,
    #turnRopeOverlay.paused .turn-rope-burn {
      transition: none;
    }

    #turnRopeOverlay.paused .turn-rope-burn {
      animation-play-state: paused;
    }

    @keyframes ropeFlameFlicker {
      from { transform: translateY(0) rotate(-8deg) scale(1); }
      to { transform: translateY(-1px) rotate(-5deg) scale(1.06); }
    }
  `;
  document.head.appendChild(style);

  window.addEventListener("resize", () => {
    window.requestAnimationFrame(() => {
      layoutRope();
      paintRope();
    });
  });

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
