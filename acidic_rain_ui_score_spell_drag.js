/* Final UI, scoring, and spell-drag behavior. Applied after all card pools and rules are ready. */
(() => {
  if (window.__acidUiScoreSpellDragApplied) return;
  window.__acidUiScoreSpellDragApplied = true;

  const TRIBE_CLASS = {
    'エレメンタル': 'tribe-elemental',
    '獣': 'tribe-beast',
    'ナーガ': 'tribe-naga',
    'ドラゴン': 'tribe-dragon',
    'マーロック': 'tribe-murloc',
    '海賊': 'tribe-pirate',
    '悪魔': 'tribe-demon',
    'アンデッド': 'tribe-undead',
    'メカ': 'tribe-mech',
    'キルボア': 'tribe-quilboar',
    'なし': 'tribe-none'
  };

  const TARGETED_NAMES = new Set([
    'シェフのおすすめ',
    '夢のエッセンス',
    '超覚醒化',
    '覚醒化',
    'ドッペルゲンガーの奇策',
    'ゼレク'
  ]);

  function stat(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
  }

  function isRain(card, index) {
    return Boolean(card) && (card.name === '酸性降雨' || card.id === 'acidic_rain_copy' || index === 1);
  }

  function ensureScoreState() {
    state.score = Number(state.score || 0);
    state.acidRainScore = Number(state.acidRainScore || 0);
    state.boardEndTurnScore = Number(state.boardEndTurnScore || 0);
    state.scoreRainSnapshots ||= new Map();
    state.scoredEndTurns ||= new Set();
  }

  function rainKey(card, index) {
    if (!card.__scoreInstanceId) {
      Object.defineProperty(card, '__scoreInstanceId', {
        value: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        enumerable: false,
        configurable: true
      });
    }
    return `${index}:${card.__scoreInstanceId}`;
  }

  function captureRainGrowth() {
    ensureScoreState();
    (state.board || []).forEach((card, index) => {
      if (!isRain(card, index)) return;
      const key = rainKey(card, index);
      const current = { atk: stat(card.atk), hp: stat(card.hp) };
      const previous = state.scoreRainSnapshots.get(key);
      if (!previous) {
        state.scoreRainSnapshots.set(key, current);
        return;
      }
      const gained = Math.max(0, current.atk - previous.atk) + Math.max(0, current.hp - previous.hp);
      if (gained > 0) {
        state.score += gained;
        state.acidRainScore += gained;
        state.lastScoreGain = { type: 'acidic-rain', amount: gained };
      }
      state.scoreRainSnapshots.set(key, current);
    });
  }

  function boardStatTotal() {
    return (state.board || []).reduce((sum, card, index) => {
      if (!card || card.type === 'spell' || index < 1) return sum;
      return sum + stat(card.atk) + stat(card.hp);
    }, 0);
  }

  function addBoardScoreForTurn(turnNumber) {
    ensureScoreState();
    const key = Number(turnNumber || state.turn || 1);
    if (state.scoredEndTurns.has(key)) return 0;
    captureRainGrowth();
    const amount = boardStatTotal();
    state.score += amount;
    state.boardEndTurnScore += amount;
    state.scoredEndTurns.add(key);
    state.lastScoreGain = { type: 'board-end-turn', amount, turn: key };
    return amount;
  }

  function ensureScoreChip() {
    let chip = document.querySelector('#scoreChip');
    if (chip) return chip;
    const host = document.querySelector('.board-stats') || document.querySelector('.board-tools');
    if (!host) return null;
    chip = document.createElement('span');
    chip.id = 'scoreChip';
    chip.className = 'inline-stat score-chip';
    chip.innerHTML = '<span class="score-icon">🏆</span><strong id="scoreValue">0</strong>';
    host.appendChild(chip);
    return chip;
  }

  function renderScore() {
    ensureScoreState();
    const chip = ensureScoreChip();
    const value = chip?.querySelector('#scoreValue');
    if (value) value.textContent = String(Math.floor(state.score));
  }

  function cardForNode(node, zone, index) {
    if (zone === 'shop') return state.shop?.[index] || null;
    if (zone === 'hand') return state.hand?.[index] || null;
    if (zone === 'board') return state.board?.[index] || null;
    return null;
  }

  function clearTribeClasses(node) {
    Object.values(TRIBE_CLASS).forEach(name => node.classList.remove(name));
    node.classList.remove('tribe-spell');
  }

  function applyCardVisual(node, card) {
    if (!node || !card) return;
    clearTribeClasses(node);
    if (card.type === 'spell') {
      node.classList.add('tribe-spell');
    } else {
      node.classList.add(TRIBE_CLASS[card.tribe] || 'tribe-none');
    }

    let badge = node.querySelector('.tier-number-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'tier-number-badge';
      node.appendChild(badge);
    }
    badge.textContent = String(Number(card.tier || 0));

    const stats = node.querySelector('.stats');
    if (stats && card.type !== 'spell') {
      stats.innerHTML = `<span class="stat-orb atk-orb"><span class="stat-label">攻</span>${stat(card.atk)}</span><span class="stat-orb hp-orb"><span class="stat-label">体</span>${stat(card.hp)}</span>`;
    }
  }

  function decorateCards() {
    [...document.querySelectorAll('#shopGrid .shop-card')].forEach((node, index) => {
      node.dataset.shopIndex = String(index);
      applyCardVisual(node, cardForNode(node, 'shop', index));
    });

    [...document.querySelectorAll('#handGrid .hand-card:not(.empty)')].forEach((node, index) => {
      node.dataset.handIndex = String(index);
      applyCardVisual(node, cardForNode(node, 'hand', index));
    });

    [...document.querySelectorAll('#boardSlots .board-card:not(.empty)')].forEach(node => {
      const index = Number(node.dataset.boardSlot);
      applyCardVisual(node, cardForNode(node, 'board', index));
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .shop-grid {
      display:flex !important;
      justify-content:center !important;
      align-items:stretch !important;
      flex-wrap:nowrap !important;
      gap:12px !important;
      width:100% !important;
      margin-left:auto !important;
      margin-right:auto !important;
    }
    .shop-grid .shop-card {
      flex:0 0 148px !important;
      width:148px !important;
      max-width:148px !important;
      position:relative !important;
    }
    .shop-card,.hand-card,.board-card { position:relative !important; }
    .tier-number-badge {
      position:absolute !important;
      top:7px !important;
      left:7px !important;
      z-index:20 !important;
      width:35px !important;
      height:35px !important;
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      border-radius:50% !important;
      background:radial-gradient(circle at 35% 28%,#fff6a8,#d99a24 58%,#75450c) !important;
      border:3px solid #fce4a0 !important;
      color:#2b1703 !important;
      font-size:1.25rem !important;
      font-weight:1000 !important;
      line-height:1 !important;
      text-shadow:0 1px 0 rgba(255,255,255,.65) !important;
      box-shadow:0 3px 8px rgba(0,0,0,.55) !important;
    }
    .card-tier { display:none !important; }
    .card-name { font-size:.94rem !important; font-weight:950 !important; line-height:1.14 !important; }
    .card-text { font-size:.7rem !important; line-height:1.32 !important; font-weight:700 !important; min-height:44px !important; }
    .tagline { font-size:.7rem !important; font-weight:850 !important; }
    .stats {
      display:flex !important;
      justify-content:space-between !important;
      align-items:center !important;
      gap:10px !important;
      width:100% !important;
      margin-top:auto !important;
      padding:0 4px 2px !important;
    }
    .stat-orb {
      min-width:42px !important;
      height:34px !important;
      padding:0 7px !important;
      display:inline-flex !important;
      align-items:center !important;
      justify-content:center !important;
      gap:3px !important;
      border-radius:999px !important;
      color:#fff !important;
      font-size:1.12rem !important;
      font-weight:1000 !important;
      border:2px solid rgba(255,255,255,.72) !important;
      box-shadow:0 3px 8px rgba(0,0,0,.5) !important;
    }
    .stat-label { font-size:.56rem !important; opacity:.86 !important; }
    .atk-orb { background:linear-gradient(180deg,#ff8a45,#a62920) !important; }
    .hp-orb { background:linear-gradient(180deg,#69d77c,#176c38) !important; }
    .score-chip { border-color:rgba(255,221,91,.55)!important; box-shadow:0 0 14px rgba(255,213,66,.18)!important; }
    .score-chip strong { color:#ffe36a!important; font-size:1.08rem!important; }

    .tribe-elemental { --tc:#52d1ef; --td:#123d52; }
    .tribe-beast { --tc:#89d66b; --td:#25431d; }
    .tribe-naga { --tc:#9b83eb; --td:#2e2858; }
    .tribe-dragon { --tc:#e66f64; --td:#502321; }
    .tribe-murloc { --tc:#5edcc2; --td:#154b42; }
    .tribe-pirate { --tc:#dca05b; --td:#50331a; }
    .tribe-demon { --tc:#df5ea5; --td:#501b3b; }
    .tribe-undead { --tc:#a18cc2; --td:#332945; }
    .tribe-mech { --tc:#b5c3d0; --td:#34404a; }
    .tribe-quilboar { --tc:#dd9279; --td:#512f25; }
    .tribe-none { --tc:#dcc894; --td:#443821; }
    .tribe-spell { --tc:#d58dea; --td:#43204e; }
    .tribe-elemental,.tribe-beast,.tribe-naga,.tribe-dragon,.tribe-murloc,.tribe-pirate,.tribe-demon,.tribe-undead,.tribe-mech,.tribe-quilboar,.tribe-none,.tribe-spell {
      border:2px solid var(--tc) !important;
      background:radial-gradient(circle at 50% 22%,color-mix(in srgb,var(--tc) 72%,white),var(--td) 57%,#101722 84%) !important;
      box-shadow:0 0 0 2px color-mix(in srgb,var(--tc) 26%,transparent),0 12px 24px rgba(0,0,0,.36) !important;
    }
    .spell-dragging {
      z-index:1000 !important;
      filter:drop-shadow(0 0 18px rgba(216,137,255,.9)) !important;
      transition:none !important;
      cursor:grabbing !important;
    }
    .spell-cast-zone {
      position:fixed;
      left:50%;
      top:4%;
      transform:translateX(-50%);
      z-index:4500;
      padding:12px 28px;
      border-radius:999px;
      background:rgba(79,36,101,.92);
      border:2px solid #df9af1;
      color:#fff;
      font-size:.9rem;
      font-weight:900;
      pointer-events:none;
      opacity:0;
      transition:opacity .12s ease;
    }
    .spell-cast-zone.show { opacity:1; }
  `;
  document.head.appendChild(style);

  const castZone = document.createElement('div');
  castZone.className = 'spell-cast-zone';
  castZone.textContent = 'ここまで上へドラッグしてスペルを使用';
  document.body.appendChild(castZone);

  let drag = null;
  let suppressClickUntil = 0;

  function isTargetedSpell(card) {
    return Boolean(card && card.type === 'spell' && (TARGETED_NAMES.has(card.name) || window.cardRequiresArrowTarget?.(card)));
  }

  function beginSpellDrag(index, node, event) {
    const card = state.hand?.[index];
    if (!card || card.type !== 'spell' || isTargetedSpell(card) || state.gameOver) return false;
    const rect = node.getBoundingClientRect();
    drag = {
      index,
      card,
      node,
      startX: event.clientX,
      startY: event.clientY,
      originTransform: node.style.transform || '',
      width: rect.width,
      height: rect.height
    };
    node.classList.add('spell-dragging');
    castZone.classList.add('show');
    event.preventDefault();
    event.stopPropagation();
    node.setPointerCapture?.(event.pointerId);
    return true;
  }

  function moveSpellDrag(event) {
    if (!drag) return;
    event.preventDefault();
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.node.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
    castZone.textContent = dy <= -70 ? '離してスペルを使用' : 'ここまで上へドラッグしてスペルを使用';
  }

  function finishSpellDrag(event) {
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    const current = drag;
    const dy = event.clientY - current.startY;
    drag = null;
    current.node.classList.remove('spell-dragging');
    current.node.style.transform = current.originTransform;
    castZone.classList.remove('show');
    castZone.textContent = 'ここまで上へドラッグしてスペルを使用';
    suppressClickUntil = Date.now() + 500;

    if (dy <= -70) {
      playHandCardToSlot(current.index, -1);
    } else {
      render();
    }
  }

  document.addEventListener('pointerdown', event => {
    const node = event.target.closest?.('.hand-card[data-hand-index]');
    if (!node) return;
    beginSpellDrag(Number(node.dataset.handIndex), node, event);
  }, true);
  document.addEventListener('pointermove', moveSpellDrag, true);
  document.addEventListener('pointerup', finishSpellDrag, true);
  document.addEventListener('pointercancel', finishSpellDrag, true);
  document.addEventListener('click', event => {
    const node = event.target.closest?.('.hand-card[data-hand-index]');
    if (!node) return;
    const card = state.hand?.[Number(node.dataset.handIndex)];
    if ((card?.type === 'spell' && !isTargetedSpell(card)) || Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  const previousSetupRun = window.setupRun;
  window.setupRun = function() {
    const result = previousSetupRun();
    state.score = 0;
    state.acidRainScore = 0;
    state.boardEndTurnScore = 0;
    state.scoreRainSnapshots = new Map();
    state.scoredEndTurns = new Set();
    captureRainGrowth();
    renderScore();
    return result;
  };

  const previousEndTurn = window.endTurn;
  window.endTurn = function() {
    if (state.gameOver) return false;
    const endingTurn = Number(state.turn || 1);
    const added = addBoardScoreForTurn(endingTurn);
    const result = previousEndTurn();
    if (!state.gameOver) log(`ターン${endingTurn}終了：盤面スタッツ${added}点を加算。現在${state.score}点。`);
    renderScore();
    return result;
  };

  endTurnBtn?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.endTurn();
  }, true);

  const previousRender = window.render;
  window.render = function() {
    captureRainGrowth();
    const result = previousRender();
    decorateCards();
    renderScore();
    return result;
  };

  captureRainGrowth();
  decorateCards();
  renderScore();
  render();
})();
