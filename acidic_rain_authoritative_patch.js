/* Authoritative final patch. Runs immediately; does not depend on a late window.load event. */
(() => {
  if (window.__acidAuthoritativePatchApplied) return;
  window.__acidAuthoritativePatchApplied = true;

  const CANONICAL_NAMES = [
    '未知の円盤の破片','ドッペルゲンガーの奇策','一時的な時間改竄','ゴールデンポメラニアン',
    '超越を夢見るナーガ','魔術をつかうトーレン','成長したケルベロス','先見性のある海賊',
    'ケルベロスの赤ちゃん','アウトランドの日光','ビーコンオブホープ','リロールブースター',
    '成長のスクロール','マリモの肖像画','時渡りの預言者','見習いマリモ使い',
    '海賊狩りの海賊','入れ替え異常体','物好きな海賊','投資家ナーガ','ゴニックスケイル',
    'リサイクルレイス','エアーレヴナント','弾けたコインポーチ','崖から遠ざかる',
    '燃えた海賊旗','シェフのおすすめ','でかいスペルボックス','スペルボックス',
    'ゴールデンポメラニアン','タイムキーパー','ランタンラーバ','スカイフォルム',
    '熱を愛す男','ゴールデンポメラニアン','ゴールデンポメラニアン','慎重な投資',
    'カタログパラパラ','第六感','ビートチェック','東からの風','隠し扉','望遠鏡','派遣作業',
    'ドラッカリ','万華鏡','リバウンド','陣太鼓','夢のエッセンス','時空の超越','超覚醒化',
    '野良猫','威嚇するわんこ','ショールフィン','船頭','大道芸人','甲板磨き','もりもり砂丘',
    '苔マン','ガチ預言者','不吉な預言者','癒されるねこ','物拾いする猿','ネタバラシフィン',
    '爆笑フィン','コインマン','よいごし','ウレメンタル','イーストサーキット','テキ屋ナーガ',
    '身代わり','斥候','スポアバット','トリックフィン','ミラージュフィン','本気の海賊',
    'チビアゼ','聖遺会の従者','悪銭ナーガ','貝笛師','建設業','COした占い師','サメ','ライラク',
    '指示フィン','ママコメフィン','夜型の海賊','エンジン','さかまき','友達のナーガ','磯の探検家',
    'ブランの卵','エリーズ','見張りフィン','冷笑フィン','金の亡者','風雲児','ダーククレスト',
    '贋作売り','ブラン','ロデオ名人','アカリ','マクスウェル','熱血フィン','マジックフィン',
    '酸性降雨','レノ','コイン','新芽','召集','石油','はずれくじ','ちょろまかし'
  ].sort((a,b) => b.length - a.length);

  const TRIBES = ['エレメンタル','マーロック','ドラゴン','アンデッド','キルボア','ナーガ','海賊','悪魔','メカ','獣','なし'];

  function canonicalName(value) {
    const raw = String(value || '').replace(/🛣️/g, '').trim();
    return CANONICAL_NAMES.find(name => raw.startsWith(name)) || raw;
  }

  function canonicalTribe(value) {
    const raw = String(value || '').trim();
    return TRIBES.find(tribe => raw.startsWith(tribe)) || raw || 'なし';
  }

  function cleanEffect(value) {
    let text = String(value || '').trim();
    text = text.replace(/_x[0-9A-Fa-f]{4}_/g, '');
    text = text.replace(/🆚/g, '');

    const lastPeriod = Math.max(text.lastIndexOf('。'), text.lastIndexOf('！'), text.lastIndexOf('？'));
    if (lastPeriod >= 0) {
      const suffix = text.slice(lastPeriod + 1).trim();
      if (/^[lァ-ヶーA-Za-z0-9０-９Ｇ・_=\s]+$/u.test(suffix)) {
        text = text.slice(0, lastPeriod + 1);
      }
    } else {
      const lastParen = Math.max(text.lastIndexOf('）'), text.lastIndexOf(')'));
      if (lastParen >= 0) {
        const suffix = text.slice(lastParen + 1).trim();
        if (/^[lァ-ヶーA-Za-z0-9０-９Ｇ・_=\s]+$/u.test(suffix)) text = text.slice(0, lastParen + 1);
      }
    }

    text = text.replace(/\s+(?:[ァ-ヶー]{2,}(?:\s+[ァ-ヶー]{1,})*|l[ァ-ヶーA-Za-z0-9\s]+)$/u, '');
    text = text.replace(/\s{2,}/g, ' ').trim();
    return text;
  }

  function normalizeCard(card) {
    if (!card) return;
    card.name = canonicalName(card.name);
    if (card.type !== 'spell') card.tribe = canonicalTribe(card.tribe);
    card.text = cleanEffect(card.text);
    if (card.awakenedText) card.awakenedText = cleanEffect(card.awakenedText);
    if (!card.onTurnEnd) {
      card.onTurnEnd = card.turnEnd || card.endTurnEffect || card.atTurnEnd || null;
    }
  }

  function normalizeAllCards() {
    if (typeof MINIONS !== 'undefined') MINIONS.forEach(normalizeCard);
    if (typeof SPELLS !== 'undefined') SPELLS.forEach(normalizeCard);
    if (typeof state !== 'undefined' && state) {
      (state.shop || []).forEach(normalizeCard);
      (state.hand || []).forEach(normalizeCard);
      (state.board || []).forEach(normalizeCard);
    }
  }

  normalizeAllCards();

  /* Never reroll the shop when upgrading. Tier-up listeners still resolve. */
  function upgradeWithoutReroll() {
    if (state.gameOver) return false;
    if (Number(state.tavernTier) >= 6) {
      log('酒場グレードは最大です。');
      render();
      return false;
    }
    const cost = typeof getTavernUpgradeCost === 'function'
      ? Number(getTavernUpgradeCost(state))
      : Math.max(0, Number({1:5,2:7,3:8,4:9,5:10}[state.tavernTier] || 0) - Number(state.tavernUpgradeDiscount || 0));
    if (Number(state.gold) < cost) {
      log(`酒場アップには${cost}コイン必要です。`);
      render();
      return false;
    }
    state.gold -= cost;
    state.tavernTier += 1;
    state.tavernUpgradeDiscount = 0;
    if (typeof notifyGoldSpent === 'function') notifyGoldSpent(cost);
    if (typeof notifyBoard === 'function') {
      notifyBoard('onTavernUpgrade', state);
      notifyBoard('onTierUp', state);
    }
    updateAuras();
    log(`酒場をグレード${state.tavernTier}に上げた。酒場のカードは入れ替わらない。`);
    render();
    return true;
  }
  window.upgradeTavern = upgradeWithoutReroll;
  upgradeBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    upgradeWithoutReroll();
  }, true);

  /* Freeze: preserve the exact current shop through turn transition. */
  let freezeBtn = document.querySelector('#freezeBtn');
  if (!freezeBtn) {
    freezeBtn = document.createElement('button');
    freezeBtn.id = 'freezeBtn';
    freezeBtn.className = 'reroll-chip';
    document.querySelector('.board-actions')?.insertBefore(freezeBtn, endTurnBtn || null);
  }

  function paintFreezeButton() {
    if (!freezeBtn) return;
    freezeBtn.textContent = state.frozen ? 'フリーズ解除' : 'フリーズ';
    freezeBtn.classList.toggle('active-freeze', Boolean(state.frozen));
  }

  freezeBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    state.frozen = !state.frozen;
    (state.shop || []).forEach(card => { if (card) card.frozen = state.frozen; });
    log(state.frozen ? '酒場をフリーズした。次のターンも同じ酒場を保持する。' : 'フリーズを解除した。');
    paintFreezeButton();
    render();
  }, true);

  const inheritedEndTurn = window.endTurn;
  function authoritativeEndTurn() {
    if (state.gameOver) return false;
    normalizeAllCards();
    const keepShop = Boolean(state.frozen);
    const frozenShop = keepShop ? (state.shop || []).map(card => card ? {...card, frozen:false} : null) : null;
    const result = inheritedEndTurn();
    if (keepShop && !state.gameOver) {
      state.shop = frozenShop;
      state.frozen = false;
      updateAuras();
      log(`ターン${state.turn}。フリーズした酒場を保持した。`);
      render();
    }
    paintFreezeButton();
    return result;
  }
  window.endTurn = authoritativeEndTurn;
  endTurnBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    authoritativeEndTurn();
  }, true);

  /* Tier-capped spell/card generation unless the effect explicitly opts out. */
  function capPool(gameState, pool) {
    if (gameState?.allowBeyondTierGeneration) return pool || [];
    const tier = Number(gameState?.tavernTier || 1);
    return (pool || []).filter(card => Number(card?.tier || 0) <= tier);
  }
  window.withBeyondTierGeneration = function(gameState, callback) {
    const old = Boolean(gameState.allowBeyondTierGeneration);
    gameState.allowBeyondTierGeneration = true;
    try { return callback(); } finally { gameState.allowBeyondTierGeneration = old; }
  };
  if (typeof discoverCards === 'function') {
    const inheritedDiscover = discoverCards;
    discoverCards = (gameState, pool, count, title) => inheritedDiscover(gameState, capPool(gameState, pool), count, title);
  }
  if (typeof gainMany === 'function') {
    const inheritedGainMany = gainMany;
    gainMany = (gameState, pool, count, message) => inheritedGainMany(gameState, capPool(gameState, pool), count, message);
  }

  const style = document.createElement('style');
  style.textContent = `
    .shop-grid { display:flex !important; justify-content:center !important; align-items:stretch !important; flex-wrap:nowrap !important; gap:10px !important; }
    .shop-grid .shop-card { flex:0 0 146px !important; width:146px !important; max-width:146px !important; }
    .card-tier { font-size:.82rem !important; font-weight:900 !important; padding:5px 10px !important; }
    .tagline { font-size:.72rem !important; font-weight:800 !important; }
    .card-name { font-size:.93rem !important; font-weight:900 !important; line-height:1.15 !important; }
    .card-text { font-size:.7rem !important; line-height:1.32 !important; font-weight:700 !important; min-height:44px !important; }
    .stats { font-size:1.3rem !important; font-weight:1000 !important; padding:2px 8px 0 !important; }
    .stats .atk,.stats .hp { display:inline-flex !important; align-items:center !important; justify-content:center !important; min-width:31px !important; height:31px !important; border-radius:50% !important; background:rgba(8,14,22,.82) !important; border:2px solid currentColor !important; }
    #freezeBtn.active-freeze { background:linear-gradient(180deg,#77d5f4,#315f80) !important; box-shadow:0 0 18px rgba(100,205,255,.48) !important; }
    [data-tribe="エレメンタル"]{--accent:#50cde8;--dark:#143c50}[data-tribe="獣"]{--accent:#83cf68;--dark:#243f20}
    [data-tribe="ナーガ"]{--accent:#9480e8;--dark:#2b2552}[data-tribe="ドラゴン"]{--accent:#e36961;--dark:#4b2020}
    [data-tribe="マーロック"]{--accent:#59d8bd;--dark:#15483f}[data-tribe="海賊"]{--accent:#d99a52;--dark:#4c3018}
    [data-tribe="悪魔"]{--accent:#dc5aa0;--dark:#4b1936}[data-tribe="アンデッド"]{--accent:#9b87ba;--dark:#312741}
    [data-tribe="メカ"]{--accent:#aab9c8;--dark:#303a43}[data-tribe="キルボア"]{--accent:#d78b72;--dark:#4d2b22}
    [data-tribe="なし"]{--accent:#dbc58f;--dark:#40351f}
    .shop-card:not(.spell)[data-tribe],.board-card[data-tribe],.hand-card:not(.spell)[data-tribe]{border:2px solid var(--accent)!important;background:radial-gradient(circle at 50% 24%,color-mix(in srgb,var(--accent) 74%,white),var(--dark) 55%,#111827 84%)!important;}
  `;
  document.head.appendChild(style);

  function decorate() {
    normalizeAllCards();
    [...document.querySelectorAll('#shopGrid .shop-card')].forEach((node,i) => { const card=state.shop?.[i]; if(card) node.dataset.tribe=card.type==='spell'?'spell':canonicalTribe(card.tribe); });
    let boardIndex=0;
    [...document.querySelectorAll('#boardSlots .board-card:not(.empty)')].forEach(node => {
      while (boardIndex < state.board.length && (!state.board[boardIndex] || boardIndex < 2)) boardIndex++;
      const card=state.board[boardIndex++]; if(card) node.dataset.tribe=canonicalTribe(card.tribe);
    });
    [...document.querySelectorAll('#handGrid .hand-card:not(.empty)')].forEach((node,i) => { const card=state.hand?.[i]; if(card) node.dataset.tribe=card.type==='spell'?'spell':canonicalTribe(card.tribe); });
    paintFreezeButton();
  }

  const inheritedRender = window.render;
  window.render = function() {
    normalizeAllCards();
    const result = inheritedRender();
    decorate();
    return result;
  };

  /* Keep arrow targeting enabled for every card whose text explicitly requires a target. */
  window.cardRequiresArrowTarget = function(card) {
    const text = String(card?.text || '');
    return /選ぶ|選んで|打てる|コピーになる|除去する|手札に戻す/.test(text);
  };

  decorate();
  render();
})();
