/* Clean Excel annotation tails and compact the game into a 660px-tall board. */
(() => {
  const annotationTail = /([。！？])(?:l?[ァ-ヶーA-Za-z0-9０-９１-９Ｇ・ー ]+)$/;

  function cleanText(value) {
    if (typeof value !== "string") return value;
    return value.replace(annotationTail, "$1").trim();
  }

  function cleanCard(card) {
    if (!card) return;
    card.text = cleanText(card.text || "");
    if (card.awakenedText) card.awakenedText = cleanText(card.awakenedText);
  }

  function cleanAllCards() {
    if (Array.isArray(window.MINIONS)) window.MINIONS.forEach(cleanCard);
    if (Array.isArray(window.SPELLS)) window.SPELLS.forEach(cleanCard);
    if (window.state) {
      (state.shop || []).forEach(cleanCard);
      (state.hand || []).forEach(cleanCard);
      (state.board || []).forEach(cleanCard);
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    html, body {
      min-height: 660px !important;
      height: 660px !important;
      overflow: hidden !important;
    }

    .shell {
      width: min(1280px, calc(100% - 12px)) !important;
      height: 660px !important;
      padding: 6px 0 !important;
    }

    .table-board {
      height: 648px !important;
      min-height: 648px !important;
      margin-top: 0 !important;
      padding: 10px 14px 12px !important;
      border-radius: 24px !important;
      overflow: hidden !important;
    }

    .board-tools { margin-bottom: 4px !important; }
    .board-status { margin: 2px 2px 6px !important; min-height: 18px !important; font-size: .78rem !important; }
    .board-meta { margin: 0 2px 4px !important; font-size: .7rem !important; }

    .shop-grid {
      gap: 7px !important;
      margin-top: 4px !important;
    }

    .shop-card,
    .board-card {
      min-height: 148px !important;
      height: 148px !important;
      padding: 13px 7px 7px !important;
      border-radius: 44% 44% 18% 18% / 20% 20% 10% 10% !important;
    }

    .shop-card .card-emoji,
    .board-card .card-emoji {
      font-size: 34px !important;
      margin-top: 2px !important;
    }

    .card-name { font-size: .78rem !important; line-height: 1.15 !important; }
    .card-text { font-size: .58rem !important; line-height: 1.22 !important; min-height: 31px !important; }
    .tagline { font-size: .58rem !important; }
    .stats { font-size: 1rem !important; }
    .cost, .card-tier { font-size: .62rem !important; }

    .market-gap { padding: 6px 0 2px !important; }
    .judge-line { margin: 7px 0 !important; height: 5px !important; }

    .board-slots {
      min-height: 164px !important;
      height: 164px !important;
      padding: 7px 8px 2px !important;
      gap: 7px !important;
      overflow-y: hidden !important;
    }

    .board-slots .board-card {
      flex-basis: 136px !important;
      width: min(136px, 12vw) !important;
      min-width: 96px !important;
      max-width: 136px !important;
    }

    .board-hand-divider {
      margin: 2px 8px 0 !important;
      font-size: .6rem !important;
    }

    .hand-grid {
      min-height: 146px !important;
      height: 146px !important;
      padding: 10px 22px 2px !important;
      overflow-y: hidden !important;
    }

    .hand-grid .hand-card {
      flex-basis: clamp(88px, 8vw, 112px) !important;
      width: clamp(88px, 8vw, 112px) !important;
      min-width: 88px !important;
      max-width: 112px !important;
      min-height: 132px !important;
      height: 132px !important;
      padding: 10px 6px 6px !important;
    }

    .hand-grid .card-emoji { font-size: 27px !important; margin-top: 1px !important; }
    .hand-grid .card-name { font-size: .68rem !important; }
    .hand-grid .card-text { font-size: .52rem !important; min-height: 27px !important; }
    .hand-grid .stats { font-size: .9rem !important; }

    .reroll-chip { padding: 7px 12px !important; font-size: .76rem !important; }
    .inline-stat { padding: 5px 8px !important; font-size: .76rem !important; }
  `;
  document.head.appendChild(style);

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    cleanAllCards();
    if (typeof window.render === "function") render();
    const ready = Array.isArray(window.MINIONS) && MINIONS.some(card => String(card.id || "").startsWith("excel_"));
    if (ready || attempts >= 80) clearInterval(timer);
  }, 50);

  window.addEventListener("load", cleanAllCards);
})();
