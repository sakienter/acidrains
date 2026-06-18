/* Pause the active turn without advancing time or accepting board input. */
window.addEventListener('load', () => {
  if (window.__acidPauseRulesInstalled) return;
  window.__acidPauseRulesInstalled = true;

  const board = document.querySelector('.table-board');
  const actions = document.querySelector('.board-actions');
  if (!board || !actions) return;

  const pauseButton = document.createElement('button');
  pauseButton.type = 'button';
  pauseButton.id = 'pauseBtn';
  pauseButton.className = 'reroll-chip pause-button';
  pauseButton.setAttribute('aria-pressed', 'false');
  pauseButton.setAttribute('aria-label', 'ゲームを一時停止する');
  actions.appendChild(pauseButton);

  const overlay = document.createElement('div');
  overlay.id = 'gamePauseOverlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <section class="pause-panel">
      <span class="pause-symbol" aria-hidden="true">Ⅱ</span>
      <h2>一時停止中</h2>
      <p>残り時間と盤面処理を停止しています。</p>
      <small>右上の「再開」を押すとゲームに戻ります。</small>
    </section>
  `;
  board.appendChild(overlay);

  const style = document.createElement('style');
  style.textContent = `
    #pauseBtn {
      position: absolute !important;
      top: 18px !important;
      right: 23px !important;
      z-index: 10020 !important;
      width: 130px !important;
      height: 57px !important;
      min-height: 57px !important;
      padding: 8px 12px !important;
      border: 1px solid rgba(139, 220, 235, .38) !important;
      border-radius: 14px !important;
      color: #eefcff !important;
      background: linear-gradient(180deg, rgba(30, 77, 91, .98), rgba(17, 50, 61, .99)) !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.09),
        0 8px 18px rgba(0,0,0,.27) !important;
      font-size: .9rem !important;
      font-weight: 900 !important;
      letter-spacing: .05em !important;
      transition: transform .14s ease, filter .14s ease, border-color .14s ease !important;
    }

    #pauseBtn::before {
      content: "Ⅱ";
      display: inline-block;
      margin-right: 7px;
      color: #9eeaf7;
      font-size: .8rem;
      letter-spacing: -.12em;
    }

    #pauseBtn:hover:not(:disabled) {
      transform: translateY(-2px) !important;
      filter: brightness(1.1) !important;
      border-color: rgba(190, 244, 253, .72) !important;
    }

    #pauseBtn:disabled {
      cursor: default !important;
      opacity: .38 !important;
      filter: grayscale(.35) !important;
    }

    body.game-paused #pauseBtn {
      border-color: rgba(255, 218, 128, .62) !important;
      color: #fff1c8 !important;
      background: linear-gradient(180deg, rgba(112, 79, 37, .99), rgba(70, 47, 23, .99)) !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.1),
        0 8px 20px rgba(0,0,0,.3),
        0 0 20px rgba(231, 189, 104, .12) !important;
    }

    body.game-paused #pauseBtn::before {
      content: "▶";
      margin-right: 8px;
      color: #ffe09a;
      font-size: .7rem;
      letter-spacing: 0;
    }

    #gamePauseOverlay {
      position: absolute;
      inset: 0;
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background:
        radial-gradient(circle at 50% 43%, rgba(118, 213, 232, .12), transparent 34%),
        rgba(9, 14, 17, .78);
      backdrop-filter: blur(5px) saturate(.72);
      cursor: default;
    }

    body.game-paused #gamePauseOverlay {
      display: flex;
      animation: pause-overlay-in .18s ease-out both;
    }

    .pause-panel {
      width: min(430px, 70vw);
      padding: 27px 34px 25px;
      border: 1px solid rgba(140, 221, 235, .3);
      border-radius: 24px;
      text-align: center;
      background: linear-gradient(180deg, rgba(20, 35, 41, .97), rgba(12, 23, 28, .99));
      box-shadow: 0 24px 65px rgba(0,0,0,.48), 0 0 34px rgba(118,213,232,.08);
    }

    .pause-symbol {
      display: inline-grid;
      width: 50px;
      height: 50px;
      place-items: center;
      margin-bottom: 12px;
      border: 1px solid rgba(143, 226, 240, .38);
      border-radius: 50%;
      color: #b9f1fb;
      background: rgba(28, 70, 81, .5);
      font-size: 1.42rem;
      font-weight: 950;
      letter-spacing: -.14em;
      text-indent: -.14em;
    }

    .pause-panel h2 {
      margin: 0;
      color: #f1fcff;
      font-size: 1.72rem;
      font-weight: 950;
      letter-spacing: .08em;
    }

    .pause-panel p {
      margin: 10px 0 4px;
      color: rgba(222, 246, 250, .7);
      font-size: .82rem;
      line-height: 1.6;
    }

    .pause-panel small {
      color: rgba(245, 225, 186, .52);
      font-size: .66rem;
    }

    body.game-paused .table-board > :not(#gamePauseOverlay):not(.board-tools),
    body.game-paused .table-board .board-tools > :not(.board-actions),
    body.game-paused .table-board .board-actions > :not(#pauseBtn) {
      pointer-events: none !important;
    }

    body.game-paused .table-board :not(#pauseBtn):not(#pauseBtn *) {
      animation-play-state: paused !important;
    }

    body.game-paused #upgradeBtn,
    body.game-paused #rerollBtn,
    body.game-paused #freezeBtn,
    body.game-paused #endTurnBtn {
      opacity: .42 !important;
      filter: grayscale(.45) !important;
    }

    body.game-paused .timer-stat {
      border-color: rgba(118, 213, 232, .18) !important;
      opacity: .76 !important;
    }

    body.game-paused .timer-stat::after {
      content: "停止中";
      position: absolute;
      right: 9px;
      bottom: 8px;
      padding: 2px 5px;
      border-radius: 999px;
      color: rgba(255, 228, 169, .78);
      background: rgba(88, 62, 28, .72);
      font-size: .48rem;
      font-weight: 900;
      letter-spacing: .08em;
    }

    @keyframes pause-overlay-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  function canPause() {
    return Boolean(
      state.hasStarted &&
      !state.gameOver &&
      !state.turnTransitioning
    );
  }

  function paintPauseUi() {
    const paused = Boolean(state.isPaused);
    document.body.classList.toggle('game-paused', paused);
    pauseButton.textContent = paused ? '再開' : '一時停止';
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'ゲームを再開する' : 'ゲームを一時停止する');
    pauseButton.disabled = !paused && !canPause();
  }

  function pauseGame() {
    if (state.isPaused || !canPause()) return false;
    state.isPaused = true;
    if (typeof window.pauseAcidTurnTimer === 'function') {
      window.pauseAcidTurnTimer();
    }
    paintPauseUi();
    if (typeof log === 'function') log('ゲームを一時停止した。');
    return true;
  }

  function resumeGame() {
    if (!state.isPaused) return false;
    state.isPaused = false;
    paintPauseUi();
    if (typeof window.resumeAcidTurnTimer === 'function') {
      window.resumeAcidTurnTimer();
    }
    if (typeof log === 'function') log('ゲームを再開した。');
    return true;
  }

  function togglePause() {
    return state.isPaused ? resumeGame() : pauseGame();
  }

  window.pauseAcidGame = pauseGame;
  window.resumeAcidGame = resumeGame;
  window.toggleAcidPause = togglePause;

  pauseButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    togglePause();
  });

  const blockedPointerEvents = [
    'pointerdown',
    'mousedown',
    'touchstart',
    'click',
    'dblclick',
    'contextmenu',
    'dragstart',
    'dragover',
    'drop',
  ];

  blockedPointerEvents.forEach(type => {
    document.addEventListener(type, event => {
      if (!state.isPaused || event.target.closest?.('#pauseBtn')) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, true);
  });

  document.addEventListener('keydown', event => {
    if (!state.isPaused) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  function guardAction(name) {
    const original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function(...args) {
      if (state.isPaused) return false;
      return original.apply(this, args);
    };
  }

  [
    'rerollShop',
    'upgradeTavern',
    'buyCard',
    'playHandCardToSlot',
    'sellBoardCard',
    'endTurn',
  ].forEach(guardAction);

  const inheritedSetupRun = setupRun;
  setupRun = function() {
    state.isPaused = false;
    const result = inheritedSetupRun();
    paintPauseUi();
    return result;
  };

  const inheritedFinishRun = finishRun;
  finishRun = function() {
    state.isPaused = false;
    const result = inheritedFinishRun();
    paintPauseUi();
    return result;
  };

  const inheritedRender = render;
  render = function() {
    const result = inheritedRender();
    paintPauseUi();
    return result;
  };

  paintPauseUi();
}, { once: true });
