/* Authoritative turn time/gold schedule. Card effects may add bonuses, but do not replace these base values. */
window.addEventListener("load", () => {
  const TURN_SCHEDULE = {
    1:  { time: 40,  gold: 3 },
    2:  { time: 40,  gold: 4 },
    3:  { time: 50,  gold: 5 },
    4:  { time: 50,  gold: 6 },
    5:  { time: 60,  gold: 7 },
    6:  { time: 60,  gold: 8 },
    7:  { time: 80,  gold: 9 },
    8:  { time: 80,  gold: 10 },
    9:  { time: 100, gold: 10 },
    10: { time: 100, gold: 10 },
    11: { time: 120, gold: 10 },
    12: { time: 120, gold: 10 },
    13: { time: 140, gold: 10 },
    14: { time: 140, gold: 10 },
    15: { time: 160, gold: 10 },
    16: { time: 160, gold: 10 }
  };

  function scheduleFor(turn) {
    return TURN_SCHEDULE[Math.max(1, Math.min(16, Number(turn || 1)))] || TURN_SCHEDULE[16];
  }

  function applyTurnStartSchedule(gameState, bonuses = {}) {
    const schedule = scheduleFor(gameState.turn);
    const goldBonus = Number(bonuses.goldBonus || 0);
    const goldPenalty = Number(bonuses.goldPenalty || 0);
    const timeBonus = Number(bonuses.timeBonus || 0);
    const cap = Math.max(10, Number(gameState.maxGold || 10));

    gameState.gold = Math.max(0, Math.min(cap, schedule.gold + goldBonus - goldPenalty));
    gameState.remainingSeconds = Math.max(0, schedule.time + timeBonus);
    gameState.baseTurnGold = schedule.gold;
    gameState.baseTurnSeconds = schedule.time;
  }

  const previousSetupRun = setupRun;
  setupRun = function() {
    const result = previousSetupRun();
    state.maxTurns = Math.max(16, Number(state.maxTurns || 0));
    state.maxGold = Math.max(10, Number(state.maxGold || 10));
    state.nextTurnGoldBonus = 0;
    state.nextTurnGoldPenalty = 0;
    state.nextTurnTimeBonus = 0;
    applyTurnStartSchedule(state);
    return result;
  };

  const previousEndTurn = endTurn;
  endTurn = function() {
    if (state.gameOver) return false;

    const beforeTurn = Number(state.turn || 1);
    const bonuses = {
      goldBonus: Number(state.nextTurnGoldBonus || 0),
      goldPenalty: Number(state.nextTurnGoldPenalty || 0),
      timeBonus: Number(state.nextTurnTimeBonus || 0)
    };

    const result = previousEndTurn();
    if (state.gameOver || Number(state.turn || 1) === beforeTurn) return result;

    applyTurnStartSchedule(state, bonuses);
    state.nextTurnGoldBonus = 0;
    state.nextTurnGoldPenalty = 0;
    state.nextTurnTimeBonus = 0;
    log(`ターン ${state.turn}：${state.baseTurnSeconds}秒、${state.baseTurnGold}ゴールドを基準に開始。`);
    render();
    return result;
  };

  endTurnBtn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    endTurn();
  }, true);

  window.TURN_SCHEDULE = TURN_SCHEDULE;
  state.maxTurns = Math.max(16, Number(state.maxTurns || 0));
  applyTurnStartSchedule(state);
  render();
}, { once: true });
