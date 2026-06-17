(() => {
  const LIMIT_TURNS = 8;
  let selectedMode = localStorage.getItem('acidRainGameMode') || 'limit';

  function applyMode() {
    if (typeof state === 'undefined') return;
    state.gameMode = selectedMode;
    state.maxTurns = selectedMode === 'endless' ? Number.POSITIVE_INFINITY : LIMIT_TURNS;
  }

  function ensureModeUi() {
    const stats = document.querySelector('.board-stats');
    if (!stats || document.querySelector('#gameModeSelect')) return;

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
      applyMode();
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
    `;
    document.head.appendChild(style);
  }

  const originalSetupRun = setupRun;
  setupRun = function() {
    originalSetupRun();
    applyMode();
  };

  const originalRenderHud = renderHud;
  renderHud = function() {
    applyMode();
    originalRenderHud();
    ensureModeUi();

    const modeSelect = document.querySelector('#gameModeSelect');
    if (modeSelect && modeSelect.value !== selectedMode) modeSelect.value = selectedMode;

    if (selectedMode === 'limit' && !state.gameOver) {
      const remaining = Math.max(0, LIMIT_TURNS - state.turn + 1);
      modeSelect?.setAttribute('title', `残り${remaining}ターン`);
    } else {
      modeSelect?.setAttribute('title', 'ターン上限なし');
    }
  };

  applyMode();
  ensureModeUi();
  render();
})();
