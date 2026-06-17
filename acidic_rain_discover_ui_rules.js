/* Unified card-style Discover UI for spells, minions, rewards, and replay tokens. */
window.addEventListener("load", () => {
  const discoverQueue = [];
  let activeDiscover = null;

  const style = document.createElement("style");
  style.textContent = `
    #discoverOverlay {
      position: fixed;
      inset: 0;
      z-index: 7000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 10, 5, .82);
      backdrop-filter: blur(5px);
    }
    #discoverOverlay.show { display: flex; }
    .discover-panel {
      width: min(1120px, 96vw);
      max-height: 92vh;
      overflow: auto;
      padding: 24px;
      border: 1px solid rgba(244, 202, 104, .42);
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(48, 31, 18, .98), rgba(25, 17, 10, .99));
      box-shadow: 0 24px 80px rgba(0, 0, 0, .62), 0 0 40px rgba(232, 173, 59, .14);
    }
    .discover-heading {
      margin: 0 0 6px;
      color: #fff2cf;
      text-align: center;
      font-size: clamp(1.2rem, 2.5vw, 1.8rem);
      font-weight: 900;
      letter-spacing: .04em;
    }
    .discover-subtitle {
      margin: 0 0 22px;
      color: rgba(255, 239, 203, .72);
      text-align: center;
      font-size: .9rem;
    }
    .discover-card-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }
    .discover-card-choice {
      position: relative;
      min-height: 300px;
      cursor: pointer;
      transform: translateY(0) scale(1);
      transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
    }
    .discover-card-choice:hover,
    .discover-card-choice:focus-visible {
      transform: translateY(-8px) scale(1.025);
      border-color: rgba(255, 220, 111, .95) !important;
      box-shadow: 0 22px 46px rgba(0,0,0,.5), 0 0 30px rgba(255, 190, 55, .45) !important;
      outline: none;
    }
    .discover-card-choice .discover-pick-label {
      position: absolute;
      right: 10px;
      bottom: 10px;
      padding: 5px 10px;
      border-radius: 999px;
      color: #2b1a08;
      background: #f4c968;
      font-size: .72rem;
      font-weight: 900;
      pointer-events: none;
    }
    @media (max-width: 760px) {
      .discover-panel { padding: 16px; }
      .discover-card-grid { grid-template-columns: 1fr; }
      .discover-card-choice { min-height: 210px; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "discoverOverlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `
    <section class="discover-panel">
      <h2 class="discover-heading" id="discoverHeading">カードを発見</h2>
      <p class="discover-subtitle">1枚選んでください</p>
      <div class="discover-card-grid" id="discoverCardGrid"></div>
    </section>
  `;
  document.body.appendChild(overlay);

  const heading = overlay.querySelector("#discoverHeading");
  const grid = overlay.querySelector("#discoverCardGrid");

  function sampleDistinct(pool, count = 3) {
    const source = [...new Map((pool || []).filter(Boolean).map(card => [card.id, card])).values()];
    const picks = [];
    while (source.length && picks.length < count) {
      const index = Math.floor(Math.random() * source.length);
      picks.push(source.splice(index, 1)[0]);
    }
    return picks;
  }

  function cardMarkup(card) {
    const isSpell = card.type === "spell";
    const stats = isSpell ? "" : `<div class="stats"><span class="atk">${card.atk || 0}</span>/<span class="hp">${card.hp || 0}</span></div>`;
    const tag = isSpell ? "スペル" : (card.tribe || "なし");
    return `
      <div class="cost">${isSpell ? `${card.cost ?? 0} gold` : `Tier ${card.tier ?? "-"}`}</div>
      <div class="card-emoji">${card.emoji || "🃏"}</div>
      <div class="card-name">${card.name || "名称未設定"}</div>
      <div class="tagline">Tier ${card.tier ?? "-"} / ${tag}</div>
      <div class="card-text">${card.text || "効果なし。"}</div>
      ${stats}
      <span class="discover-pick-label">選ぶ</span>
    `;
  }

  function closeDiscover() {
    overlay.classList.remove("show");
    grid.innerHTML = "";
    activeDiscover = null;
    queueMicrotask(openNextDiscover);
  }

  function chooseCard(card) {
    if (!activeDiscover) return;
    const { gameState, message } = activeDiscover;
    const gained = gainCardToHand(gameState, card, message || `${card.name} を獲得した。`);
    closeDiscover();
    if (gained) render();
  }

  function openNextDiscover() {
    if (activeDiscover || !discoverQueue.length) return;
    const request = discoverQueue.shift();
    const candidates = sampleDistinct(request.pool, 3);
    if (!candidates.length) {
      log(`${request.title || "発見"}：候補がありません。`);
      queueMicrotask(openNextDiscover);
      return;
    }

    activeDiscover = request;
    heading.textContent = request.title || "カードを発見";
    grid.innerHTML = "";

    candidates.forEach(card => {
      const node = document.createElement("button");
      node.type = "button";
      node.className = `shop-card discover-card-choice${card.type === "spell" ? " spell" : ""}`;
      node.innerHTML = cardMarkup(card);
      node.addEventListener("click", () => chooseCard(card));
      grid.appendChild(node);
    });

    overlay.classList.add("show");
    grid.querySelector("button")?.focus();
  }

  function enqueueDiscover(gameState, pool, count, title) {
    const amount = Math.max(0, Number(count || 0));
    for (let i = 0; i < amount; i += 1) {
      if (gameState.hand.length + discoverQueue.length >= HAND_LIMIT) {
        log("手札がいっぱいです。");
        break;
      }
      discoverQueue.push({
        gameState,
        pool: [...(pool || [])],
        title,
        message: null,
      });
    }
    openNextDiscover();
  }

  function currentTierPool(gameState, pool) {
    return (pool || []).filter(card => Number(card?.tier || 0) <= Number(gameState.tavernTier || 1));
  }

  // Replace both capped and explicitly uncapped Discover paths.
  window.discoverCards = function(gameState, pool, count, title) {
    enqueueDiscover(gameState, currentTierPool(gameState, pool), count, title);
  };

  window.discoverCardsBeyondTier = function(gameState, pool, count, title) {
    enqueueDiscover(gameState, pool, count, title);
  };

  // Keep direct callers of chooseFromCards out of the browser prompt path.
  window.chooseFromCards = function(cards, title) {
    enqueueDiscover(state, cards, 1, title);
    return null;
  };

  document.addEventListener("keydown", event => {
    if (!activeDiscover) return;
    const buttons = [...grid.querySelectorAll("button")];
    if (["1", "2", "3"].includes(event.key)) {
      const button = buttons[Number(event.key) - 1];
      if (button) button.click();
    }
  });
}, { once: true });
