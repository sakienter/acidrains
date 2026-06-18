/* Five-second preparation screen between completed turns. */
window.addEventListener('load', () => {
  if (window.__acidTurnTransitionInstalled) return;
  window.__acidTurnTransitionInstalled = true;

  const PREPARATION_MS = 5000;
  window.ACID_TURN_PREPARATION_MS = PREPARATION_MS;

  const style = document.createElement('style');
  style.textContent = `
    #turnPreparationOverlay {
      position: fixed;
      inset: 0;
      z-index: 15000;
      display: none;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(circle at 50% 42%, rgba(125, 211, 255, .2), transparent 34%),
        rgba(12, 12, 18, .9);
      backdrop-filter: blur(8px);
    }

    #turnPreparationOverlay.show {
      display: flex;
      animation: turn-preparation-in .22s ease-out both;
    }

    .turn-preparation-panel {
      width: min(520px, 82vw);
      padding: 34px 40px 30px;
      border: 1px solid rgba(142, 221, 255, .42);
      border-radius: 28px;
      text-align: center;
      background: linear-gradient(180deg, rgba(34, 43, 58, .98), rgba(19, 24, 34, .99));
      box-shadow: 0 30px 90px rgba(0, 0, 0, .66), 0 0 50px rgba(98, 198, 255, .16);
    }

    .turn-preparation-icon {
      display: block;
      margin-bottom: 10px;
      font-size: 3rem;
      animation: turn-preparation-pulse 1.2s ease-in-out infinite;
    }

    .turn-preparation-title {
      margin: 0;
      color: #eaf8ff;
      font-size: 2rem;
      font-weight: 950;
      letter-spacing: .08em;
    }

    .turn-preparation-next {
      margin: 9px 0 22px;
      color: rgba(220, 242, 255, .72);
      font-size: .95rem;
    }

    .turn-preparation-count {
      color: #9ee8ff;
      font-size: 3.4rem;
      font-weight: 1000;
      line-height: 1;
      text-shadow: 0 0 22px rgba(125, 211, 255, .44);
    }

    .turn-preparation-bar {
      height: 7px;
      margin-top: 22px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(255, 255, 255, .1);
    }

    .turn-preparation-progress {
      width: 100%;
      height: 100%;
      transform-origin: left center;
      background: linear-gradient(90deg, #69c8f1, #b9f3ff);
      box-shadow: 0 0 12px rgba(125, 211, 255, .44);
    }

    body.turn-transition-active :is(#upgradeBtn, #rerollBtn, #freezeBtn, #endTurnBtn) {
      pointer-events: none !important;
    }

    @keyframes turn-preparation-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes turn-preparation-pulse {
      0%, 100% { transform: translateY(0) scale(1); opacity: .82; }
      50% { transform: translateY(-5px) scale(1.08); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'turnPreparationOverlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <section class="turn-preparation-panel">
      <span class="turn-preparation-icon">⏳</span>
      <h2 class="turn-preparation-title">次のターンの準備中</h2>
      <p class="turn-preparation-next" id="turnPreparationNext">次の酒場を準備しています</p>
      <div class="turn-preparation-count" id="turnPreparationCount">5</div>
      <div class="turn-preparation-bar"><div class="turn-preparation-progress" id="turnPreparationProgress"></div></div>
    </section>
  `;
  document.body.appendChild(overlay);

  const countEl = overlay.querySelector('#turnPreparationCount');
  const nextEl = overlay.querySelector('#turnPreparationNext');
  const progressEl = overlay.querySelector('#turnPreparationProgress');
  const inheritedEndTurn = endTurn;
  let countdownTimer = null;
  let transitionTimer = null;
  let resumeStartedState = true;

  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function hasNextTurn() {
    return Boolean(state.endlessMode || number(state.turn, 1) < number(state.maxTurns, 16));
  }

  function clearTransitionTimers() {
    if (countdownTimer !== null) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
    if (transitionTimer !== null) {
      window.clearTimeout(transitionTimer);
      transitionTimer = null;
    }
  }

  function hidePreparation() {
    clearTransitionTimers();
    overlay.classList.remove('show');
    document.body.classList.remove('turn-transition-active');
  }

  function paintPreparation(deadline) {
    const remaining = Math.max(0, deadline - Date.now());
    countEl.textContent = String(Math.max(1, Math.ceil(remaining / 1000)));
    progressEl.style.transform = `scaleX(${remaining / PREPARATION_MS})`;
  }

  endTurn = function() {
    if (state.gameOver || state.turnTransitioning) return false;
    if (!hasNextTurn()) return inheritedEndTurn();

    state.turnTransitioning = true;
    resumeStartedState = state.hasStarted !== false;
    state.hasStarted = false;
    if (typeof window.stopAcidTurnTimer === 'function') window.stopAcidTurnTimer();

    const nextTurn = number(state.turn, 1) + 1;
    const deadline = Date.now() + PREPARATION_MS;
    nextEl.textContent = `ターン ${nextTurn} の酒場を準備しています`;
    paintPreparation(deadline);
    overlay.classList.add('show');
    document.body.classList.add('turn-transition-active');
    if (typeof log === 'function') log('次のターンの準備中。');

    countdownTimer = window.setInterval(() => paintPreparation(deadline), 100);
    transitionTimer = window.setTimeout(() => {
      clearTransitionTimers();
      state.turnTransitioning = false;
      state.hasStarted = resumeStartedState;
      try {
        inheritedEndTurn();
      } finally {
        hidePreparation();
      }
    }, PREPARATION_MS);

    return true;
  };
}, { once: true });
