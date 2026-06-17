/* Fixed, name-specific card icons with card-name normalization. */
(() => {
  const ICONS = {
    'コイン': '🪙', '新芽': '🌱', '召集': '📯', '未知の円盤の破片': '🛸', '石油': '🛢️',
    'シェフのおすすめ': '🍽️', 'はずれくじ': '🎟️', '慎重な投資': '💼', '弾けたコインポーチ': '👛',
    'カタログパラパラ': '📖', '第六感': '👁️', '燃えた海賊旗': '🏴‍☠️', '崖から遠ざかる': '🧗',
    'ちょろまかし': '🫳', 'ビートチェック': '🎧', '東からの風': '🌬️', 'スペルボックス': '🎁',
    '隠し扉': '🚪', '望遠鏡': '🔭', '派遣作業': '🧰', 'ドラッカリ': '🌙',
    '成長のスクロール': '📜', '万華鏡': '🔮', 'マリモの肖像画': '🖼️', 'リバウンド': '↩️',
    '陣太鼓': '🥁', '夢のエッセンス': '💭', '時空の超越': '⏳', '一時的な時間改竄': '🕰️',
    'ドッペルゲンガーの奇策': '🎭', '超覚醒化': '✨', 'でかいスペルボックス': '🎁',
    '野良猫': '🐈', '威嚇するわんこ': '🐕', 'ショールフィン': '🐟', '船頭': '⛵',
    '大道芸人': '🎪', '甲板磨き': '🧹', 'もりもり砂丘': '🏜️', '苔マン': '🟢',
    'ガチ預言者': '🔮', '不吉な預言者': '🌑', '癒されるねこ': '😺', '物拾いする猿': '🐒',
    'ネタバラシフィン': '🤫', '爆笑フィン': '🤣', 'コインマン': '🪙', 'よいごし': '🌙',
    'ウレメンタル': '💧', 'イーストサーキット': '⚡', '投資家ナーガ': '📈', 'テキ屋ナーガ': '🎯',
    '身代わり': '🪆', 'ビーコンオブホープ': '🕯️', '斥候': '🧭', 'ケルベロスの赤ちゃん': '🐶',
    'スポアバット': '🦇', 'トリックフィン': '🎩', 'ミラージュフィン': '🪞', '海賊狩りの海賊': '⚔️',
    '本気の海賊': '🏴‍☠️', 'チビアゼ': '🔥', 'リロールブースター': '🔄', '聖遺会の従者': '🙏',
    '悪銭ナーガ': '💸', '貝笛師': '🐚', '建設業': '🏗️', 'COした占い師': '🔮',
    '見習いマリモ使い': '🟢', 'サメ': '🦈', 'ライラク': '🦌', '指示フィン': '👉',
    'ママコメフィン': '👩‍🍳', '夜型の海賊': '🌙', '物好きな海賊': '🧐', 'エンジン': '⚙️',
    'さかまき': '🌀', '入れ替え異常体': '🔀', '超越を夢見るナーガ': '🌌', '友達のナーガ': '🤝',
    '磯の探検家': '🧭', 'ブランの卵': '🥚', '魔術をつかうトーレン': '🐮', 'エリーズ': '🌿',
    '成長したケルベロス': '🐕‍🦺', 'ゴールデンポメラニアン': '🐕', '見張りフィン': '👀',
    '冷笑フィン': '😏', '先見性のある海賊': '🔭', '金の亡者': '🤑', '風雲児': '🍃',
    'エアーレヴナント': '🌬️', 'リサイクルレイス': '♻️', 'ダーククレスト': '🌑',
    'ゴニックスケイル': '🐉', '贋作売り': '🖌️', 'ブラン': '🦁', 'ロデオ名人': '🤠',
    'アカリ': '🔥', 'マクスウェル': '🎁', '熱血フィン': '🥊', 'マジックフィン': '🪄',
    '熱を愛す男': '🌡️', 'タイムキーパー': '⏱️', '時渡りの預言者': '⏳', '酸性降雨': '🌧️',
    'アウトランドの日光': '☀️', 'ランタンラーバ': '🏮', 'レノ': '🎩', 'スカイフォルム': '☁️'
  };

  const canonicalNames = Object.keys(ICONS).sort((a, b) => b.length - a.length);

  function normalizeName(rawName) {
    const raw = String(rawName || '').trim();
    const exact = canonicalNames.find(name => raw === name);
    if (exact) return exact;
    const prefix = canonicalNames.find(name => raw.startsWith(name));
    return prefix || raw.replace(/[ァ-ヶー]+(?:\s+[ァ-ヶー]+)*\s*$/u, '').trim();
  }

  function applyNamedIcons() {
    const apply = card => {
      if (!card) return;
      card.name = normalizeName(card.name);
      if (ICONS[card.name]) card.emoji = ICONS[card.name];
    };
    if (typeof MINIONS !== "undefined") MINIONS.forEach(apply);
    if (typeof SPELLS !== "undefined") SPELLS.forEach(apply);
    if (typeof state !== "undefined" && state) {
      (state.shop || []).forEach(apply);
      (state.hand || []).forEach(apply);
      (state.board || []).forEach(apply);
    }
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    applyNamedIcons();
    if (typeof render === "function") render();
    if (tries >= 80 || (typeof MINIONS !== "undefined" && MINIONS.some(card => ICONS[normalizeName(card.name)]))) {
      clearInterval(timer);
    }
  }, 50);
  window.addEventListener("load", applyNamedIcons);
})();
