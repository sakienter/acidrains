/* Clean Excel annotation tails, restore card icons, and fit the game into 720px. */
(() => {
  const annotationTail = /([。！？])(?:l?[ァ-ヶーA-Za-z0-9０-９１-９Ｇ・ー ]+)$/;
  const genericIcons = new Set(["", "🃏", "❔", "?", "undefined", "null"]);
  const tribeIcons = {
    "エレメンタル": ["🌪️", "🔥", "💧", "🌋", "❄️", "⚡", "🌬️", "☄️"],
    "獣": ["🐈", "🦌", "🦈", "🐍", "🦇", "🐺", "🦅", "🐗"],
    "ナーガ": ["🐚", "🐍", "🔱", "🌊", "🪸", "🧜", "💠", "🐉"],
    "ドラゴン": ["🐉", "🐲", "🔥", "🌌", "💎", "☄️", "🌠", "🪽"],
    "マーロック": ["🐟", "🐠", "🫧", "🌊", "🪸", "🐡", "🦎", "💧"],
    "海賊": ["🏴‍☠️", "⛵", "⚓", "🪙", "🗡️", "🦜", "🧭", "💰"],
    "悪魔": ["😈", "🔥", "👹", "🩸", "☠️", "🕯️", "🦇", "🌑"],
    "アンデッド": ["💀", "☠️", "🪦", "👻", "🦴", "🕯️", "🌑", "⚰️"],
    "メカ": ["⚙️", "🤖", "🔩", "🛠️", "🚀", "🧲", "🔧", "⚡"],
    "キルボア": ["🐗", "🩸", "💎", "🪓", "🔥", "🛡️", "⛏️", "🌵"],
    "なし": ["🔭", "🗿", "🎩", "🌿", "🎁", "🕰️", "🦁", "🧙"]
  };
  const spellIcons = ["✨", "📜", "🔮", "🧪", "🌬️", "⏳", "💰", "🎯", "🌙", "🪄", "📖", "⚡"];

  function cleanText(value) {
    if (typeof value !== "string") return value;
    return value.replace(annotationTail, "$1").trim();
  }

  function hashText(value) {
    return [...String(value || "")].reduce((sum, char) => (sum * 31 + char.codePointAt(0)) >>> 0, 7);
  }

  function iconFor(card) {
    const name = String(card?.name || "");
    const text = String(card?.text || "");
    if (/酸性降雨/.test(name)) return "🌧️";
    if (/風|竜巻|サイクロン/.test(name)) return "🌪️";
    if (/時間|時空|時計/.test(name + text)) return "⏳";
    if (/発見|望遠鏡/.test(name + text)) return "🔭";
    if (/コイン|投資|おつり/.test(name + text)) return "🪙";
    if (/覚醒/.test(name + text)) return "✨";
    if (/リロール|入れ替え/.test(name + text)) return "🔄";
    if (/雄叫び/.test(name + text)) return "📣";
    if (/断末魔/.test(name + text)) return "💀";
    if (/贈り物/.test(name + text)) return "🎁";
    if (card?.type === "spell") return spellIcons[hashText(name) % spellIcons.length];
    const pool = tribeIcons[card?.tribe] || tribeIcons["なし"];
    return pool[hashText(name) % pool.length];
  }

  function cleanCard(card) {
    if (!card) return;
    card.text = cleanText(card.text || "");
    if (card.awakenedText) card.awakenedText = cleanText(card.awakenedText);
    if (genericIcons.has(String(card.emoji ?? ""))) card.emoji = iconFor(card);
  }

  function cleanAllCards() {
    if (typeof MINIONS !== "undefined" && Array.isArray(MINIONS)) MINIONS.forEach(cleanCard);
    if (typeof SPELLS !== "undefined" && Array.isArray(SPELLS)) SPELLS.forEach(cleanCard);
    if (typeof state !== "undefined" && state) {
      (state.shop || []).forEach(cleanCard);
      (state.hand || []).forEach(cleanCard);
      (state.board || []).forEach(cleanCard);
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    html, body {
      min-height: 720px !important;
      height: 720px !important;
      overflow: hidden !important;
    }

    .shell {
      width: min(1280px, calc(100% - 12px)) !important;
      height: 720px !important;
      padding: 6px 0 !important;
    }

    .table-board {
      height: 708px !important;
      min-height: 708px !important;
      margin-top: 0 !important;
      padding: 11px 14px 13px !important;
      border-radius: 25px !important;
      overflow: hidden !important;
    }

    .board-tools { margin-bottom: 5px !important; }
    .board-status { margin: 3px 2px 7px !important; min-height: 19px !important; font-size: .8rem !important; }
    .board-meta { margin: 0 2px 5px !important; font-size: .72rem !important; }

    .shop-grid { gap: 8px !important; margin-top: 5px !important; }

    .shop-card,
    .board-card {
      min-height: 162px !important;
      height: 162px !important;
      padding: 14px 8px 8px !important;
      border-radius: 45% 45% 19% 19% / 21% 21% 11% 11% !important;
    }

    .shop-card .card-emoji,
    .board-card .card-emoji {
      font-size: 39px !important;
      margin-top: 2px !important;
      line-height: 1 !important;
      filter: drop-shadow(0 0 8px rgba(112, 249, 255, .42)) !important;
    }

    .card-name { font-size: .82rem !important; line-height: 1.16 !important; }
    .card-text { font-size: .61rem !important; line-height: 1.24 !important; min-height: 34px !important; }
    .tagline { font-size: .6rem !important; }
    .stats { font-size: 1.08rem !important; }
    .cost, .card-tier { font-size: .65rem !important; }

    .market-gap { padding: 7px 0 3px !important; }
    .judge-line { margin: 8px 0 !important; height: 5px !important; }

    .board-slots {
      min-height: 178px !important;
      height: 178px !important;
      padding: 8px 8px 3px !important;
      gap: 8px !important;
      overflow-y: hidden !important;
    }

    .board-slots .board-card {
      flex-basis: 146px !important;
      width: min(146px, 12.5vw) !important;
      min-width: 101px !important;
      max-width: 146px !important;
    }

    .board-hand-divider { margin: 3px 8px 0 !important; font-size: .62rem !important; }

    .hand-grid {
      min-height: 160px !important;
      height: 160px !important;
      padding: 12px 22px 3px !important;
      overflow-y: hidden !important;
    }

    .hand-grid .hand-card {
      flex-basis: clamp(94px, 8.4vw, 120px) !important;
      width: clamp(94px, 8.4vw, 120px) !important;
      min-width: 94px !important;
      max-width: 120px !important;
      min-height: 144px !important;
      height: 144px !important;
      padding: 11px 7px 7px !important;
    }

    .hand-grid .card-emoji { font-size: 31px !important; margin-top: 1px !important; line-height: 1 !important; }
    .hand-grid .card-name { font-size: .72rem !important; }
    .hand-grid .card-text { font-size: .55rem !important; min-height: 29px !important; }
    .hand-grid .stats { font-size: .96rem !important; }

    .reroll-chip { padding: 8px 13px !important; font-size: .78rem !important; }
    .inline-stat { padding: 6px 9px !important; font-size: .78rem !important; }
  `;
  document.head.appendChild(style);

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    cleanAllCards();
    if (typeof render === "function") render();
    const ready = typeof MINIONS !== "undefined" && Array.isArray(MINIONS) && MINIONS.some(card => String(card.id || "").startsWith("excel_"));
    if (ready || attempts >= 80) clearInterval(timer);
  }, 50);

  window.addEventListener("load", cleanAllCards);
})();
