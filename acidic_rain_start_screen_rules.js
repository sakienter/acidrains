/* Explicit game start screen. No game state advances before Start is pressed. */
window.addEventListener("load", () => {
  // Remove legacy gift-related cards from the active pool.
  for (let i = MINIONS.length - 1; i >= 0; i -= 1) {
    if (MINIONS[i]?.id === "maxwell" || MINIONS[i]?.gift || MINIONS[i]?.tribe === "贈り物") {
      MINIONS.splice(i, 1);
    }
  }
  for (let i = SPELLS.length - 1; i >= 0; i -= 1) {
    if (SPELLS[i]?.id === "remember_the_beginning" || SPELLS[i]?.gift) {
      SPELLS.splice(i, 1);
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    #gameStartOverlay {
      position: fixed;
      inset: 0;
      z-index: 9000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background:
        radial-gradient(circle at 50% 20%, rgba(102, 77, 29, .28), transparent 42%),
        rgba(15, 10, 6, .92);
      backdrop-filter: blur(8px);
    }
    #gameStartOverlay.hidden { display: none; }
    .game-start-panel {
      width: min(560px, 94vw);
      padding: 34px 28px;
      border: 1px solid rgba(244, 203, 102, .42);
      border-radius: 28px;
      text-align: center;
      background: linear-gradient(180deg, rgba(52, 35, 20, .98), rgba(27, 18, 10, .99));
      box-shadow: 0 28px 90px rgba(0,0,0,.68), 0 0 48px rgba(238, 177, 55, .16);
    }
    .game-start-title {
      margin: 0;
      color: #fff2cf;
      font-size: clamp(2rem, 6vw, 3.4rem);
      font-weight: 950;
      letter-spacing: .03em;
    }
    .game-start-copy {
      margin: 14px auto 26px;
      max-width: 420px;
      color: rgba(255, 239, 205, .75);
      line-height: 1.75;
    }
    #gameStartBtn {
      min-width: 240px;
      padding: 15px 30px;
      border: 1px solid rgba(255, 235, 170, .62);
      border-radius: 999px;
      color: #2a1907;
      background: linear-gradient(180deg, #ffd77a, #e3a735);
      box-shadow: 0 12px 30px rgba(225, 158, 40, .28);
      font: inherit;
      font-size: 1.08rem;
      font-weight: 950;
      cursor: pointer;
      transition: transform .15s ease, filter .15s ease;
    }
    #gameStartBtn:hover { transform: translateY(-2px); filter: brightness(1.06); }
    #gameStartBtn:active { transform: translateY(0); }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "gameStartOverlay";
  overlay.innerHTML = `
    <section class="game-start-panel" role="dialog" aria-modal="true" aria-labelledby="gameStartTitle">
      <h1 class="game-start-title" id="gameStartTitle">酸性降雨</h1>
      <p class="game-start-copy">ゲームスタートを押すと、ターン1・3ゴールドから開始します。制限時間もこの時点から進みます。</p>
      <button type="button" id="gameStartBtn">ゲームスタート</button>
    </section>
  `;
  document.body.appendChild(overlay);

  state.hasStarted = false;
  state.gameOver = true;
  state.statusMessage = "ゲームスタートを押してください。";
  log("ゲームスタートを押してください。");
  render();

  const startBtn = overlay.querySelector("#gameStartBtn");
  startBtn.addEventListener("click", () => {
    state.hasStarted = true;
    overlay.classList.add("hidden");
    setupRun();
    state.hasStarted = true;
    state.gameOver = false;
    log("ゲームを開始しました。");
    render();
  });

  // Guard every board interaction until the start button is pressed.
  document.addEventListener("pointerdown", event => {
    if (state.hasStarted) return;
    if (event.target.closest?.("#gameStartOverlay")) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);
}, { once: true });
