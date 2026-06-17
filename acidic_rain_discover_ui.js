/* Hearthstone-style three-card discover overlay. */
(() => {
  const discoverState = {
    queue: [],
    active: null,
    hidden: false,
  };

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .discover-overlay {
        position: fixed;
        inset: 0;
        z-index: 5000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 90px 24px 110px;
        background: rgba(11, 8, 6, 0.36);
        backdrop-filter: blur(2px);
      }

      .discover-overlay.show {
        display: flex;
      }

      .discover-overlay.hidden-view {
        pointer-events: none;
        background: transparent;
        backdrop-filter: none;
      }

      .discover-overlay.hidden-view .discover-panel {
        display: none;
      }

      .discover-panel {
        width: min(1120px, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 22px;
      }

      .discover-title {
        min-width: min(620px, calc(100vw - 40px));
        padding: 14px 30px;
        border: 2px solid rgba(255, 226, 143, 0.72);
        border-radius: 14px;
        color: #fff6d6;
        text-align: center;
        font-size: clamp(1.25rem, 2.8vw, 2rem);
        font-weight: 900;
        letter-spacing: .08em;
        background: linear-gradient(180deg, rgba(128, 91, 43, .96), rgba(70, 43, 22, .97));
        box-shadow: 0 0 18px rgba(120, 177, 255, .7), 0 14px 34px rgba(0, 0, 0, .45);
      }

      .discover-options {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(14px, 3vw, 34px);
        align-items: stretch;
      }

      .discover-card {
        position: relative;
        min-height: 410px;
        padding: 28px 18px 18px;
        border: 3px solid rgba(95, 255, 91, .88);
        border-radius: 48% 48% 22% 22% / 20% 20% 12% 12%;
        color: #fff8dc;
        cursor: pointer;
        background:
          radial-gradient(circle at 50% 26%, rgba(106, 229, 255, .96), rgba(31, 83, 113, .96) 48%, rgba(22, 28, 39, .99) 74%),
          linear-gradient(180deg, #63513d, #2f251c);
        box-shadow: 0 0 20px rgba(74, 255, 88, .88), 0 18px 42px rgba(0, 0, 0, .5);
        transition: transform 150ms ease, filter 150ms ease, box-shadow 150ms ease;
      }

      .discover-card:hover,
      .discover-card:focus-visible {
        transform: translateY(-12px) scale(1.025);
        filter: brightness(1.13);
        box-shadow: 0 0 30px rgba(116, 255, 102, 1), 0 24px 52px rgba(0, 0, 0, .56);
        outline: none;
      }

      .discover-card-tier {
        position: absolute;
        top: -13px;
        left: 50%;
        transform: translateX(-50%);
        padding: 5px 12px;
        border-radius: 999px;
        background: #882c7e;
        color: #ffe273;
        font-weight: 900;
        font-size: .8rem;
      }

      .discover-card-emoji {
        margin-top: 14px;
        text-align: center;
        font-size: 82px;
        filter: drop-shadow(0 0 14px rgba(140, 247, 255, .65));
      }

      .discover-card-name {
        margin: 12px 0 8px;
        text-align: center;
        font-size: clamp(1rem, 2vw, 1.35rem);
        font-weight: 900;
      }

      .discover-card-tribe {
        text-align: center;
        color: #e6d7b8;
        font-size: .84rem;
      }

      .discover-card-text {
        min-height: 92px;
        margin-top: 16px;
        padding: 12px;
        border-radius: 12px;
        color: #eee7df;
        background: rgba(8, 10, 12, .46);
        text-align: center;
        line-height: 1.55;
        font-size: .9rem;
      }

      .discover-card-stats {
        position: absolute;
        left: 18px;
        right: 18px;
        bottom: 13px;
        display: flex;
        justify-content: space-between;
        font-size: 1.7rem;
        font-weight: 900;
      }

      .discover-card-stats .atk { color: #8edaff; }
      .discover-card-stats .hp { color: #92f4a4; }

      .discover-toggle {
        position: fixed;
        left: 22px;
        bottom: 22px;
        z-index: 5100;
        display: none;
        min-width: 150px;
        padding: 13px 22px;
        border: 2px solid rgba(157, 242, 255, .9);
        border-radius: 14px;
        color: #173144;
        background: linear-gradient(180deg, #efffff, #9eefff);
        box-shadow: 0 0 18px rgba(94, 225, 255, .7), 0 8px 24px rgba(0, 0, 0, .35);
        font-weight: 900;
        font-size: 1rem;
        cursor: pointer;
      }

      .discover-toggle.show { display: block; }

      @media (max-width: 800px) {
        .discover-overlay {
          align-items: flex-start;
          overflow-y: auto;
          padding-top: 76px;
        }

        .discover-options {
          grid-template-columns: 1fr;
          max-width: 430px;
        }

        .discover-card {
          min-height: 330px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    const overlay = document.createElement("div");
    overlay.className = "discover-overlay";
    overlay.innerHTML = `
      <section class="discover-panel" role="dialog" aria-modal="true" aria-labelledby="discoverTitle">
        <div class="discover-title" id="discoverTitle">1枚選んでください</div>
        <div class="discover-options" id="discoverOptions"></div>
      </section>
    `;

    const toggle = document.createElement("button");
    toggle.className = "discover-toggle";
    toggle.type = "button";
    toggle.textContent = "非表示";
    toggle.addEventListener("click", () => {
      discoverState.hidden = !discoverState.hidden;
      overlay.classList.toggle("hidden-view", discoverState.hidden);
      toggle.textContent = discoverState.hidden ? "表示" : "非表示";
    });

    document.body.append(overlay, toggle);

    return {
      overlay,
      toggle,
      options: overlay.querySelector("#discoverOptions"),
      title: overlay.querySelector("#discoverTitle"),
    };
  }

  function randomCandidates(pool) {
    const source = [...pool];
    const result = [];
    while (source.length && result.length < 3) {
      const index = Math.floor(Math.random() * source.length);
      result.push(source.splice(index, 1)[0]);
    }
    return result;
  }

  function renderCard(card, onSelect) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "discover-card";
    const isSpell = card.type === "spell";
    button.innerHTML = `
      <span class="discover-card-tier">Tier ${card.tier ?? "-"}</span>
      <div class="discover-card-emoji">${card.emoji || "❔"}</div>
      <div class="discover-card-name">${card.name}</div>
      <div class="discover-card-tribe">${isSpell ? "スペル" : (card.tribe || "なし")}</div>
      <div class="discover-card-text">${card.text || ""}</div>
      ${isSpell ? "" : `<div class="discover-card-stats"><span class="atk">${card.atk || 0}</span><span class="hp">${card.hp || 0}</span></div>`}
    `;
    button.addEventListener("click", onSelect);
    return button;
  }

  let ui;

  function closeCurrent() {
    discoverState.active = null;
    discoverState.hidden = false;
    ui.overlay.classList.remove("show", "hidden-view");
    ui.toggle.classList.remove("show");
    ui.toggle.textContent = "非表示";
    ui.options.innerHTML = "";
  }

  function openNext() {
    if (discoverState.active || !discoverState.queue.length) return;

    const request = discoverState.queue.shift();
    const candidates = randomCandidates(request.pool);
    if (!candidates.length) {
      openNext();
      return;
    }

    discoverState.active = request;
    ui.title.textContent = request.title || "1枚選んでください";
    ui.options.innerHTML = "";

    candidates.forEach((card) => {
      ui.options.appendChild(renderCard(card, () => {
        gainCardToHand(request.gameState, card, `${card.name} を獲得した。`);
        closeCurrent();
        render();
        window.setTimeout(openNext, 100);
      }));
    });

    ui.overlay.classList.add("show");
    ui.toggle.classList.add("show");
  }

  function enqueueDiscover(gameState, pool, count, title) {
    const validPool = (pool || []).filter(Boolean);
    for (let i = 0; i < count; i += 1) {
      discoverState.queue.push({ gameState, pool: validPool, title });
    }
    openNext();
  }

  window.addEventListener("load", () => {
    addStyles();
    ui = createUI();

    // Replace the temporary prompt implementation with a mouse-driven queue.
    window.discoverCards = enqueueDiscover;
  }, { once: true });
})();
