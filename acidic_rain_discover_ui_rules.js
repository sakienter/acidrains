/* Restored card-style Discover presentation for every Discover effect. */
window.addEventListener('load', () => {
  if (window.__acidDiscoverUiInstalled) return;
  window.__acidDiscoverUiInstalled = true;

  const discoverQueue = [];
  let activeDiscover = null;

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const tribeClass = tribe => {
    const classes = {
      'エレメンタル': 'tribe-elemental',
      '獣': 'tribe-beast',
      'ナーガ': 'tribe-naga',
      'ドラゴン': 'tribe-dragon',
      'マーロック': 'tribe-murloc',
      '海賊': 'tribe-pirate',
      '悪魔': 'tribe-demon',
      'アンデッド': 'tribe-undead',
      'メカ': 'tribe-mech',
      'キルボア': 'tribe-quillboar',
    };
    return classes[tribe] || 'tribe-neutral';
  };

  const style = document.createElement('style');
  style.textContent = `
    #discoverOverlay {
      position: fixed;
      inset: 0;
      z-index: 12000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      background:
        radial-gradient(circle at 50% 42%, rgba(255, 211, 94, .19), transparent 34%),
        rgba(11, 8, 6, .88);
      backdrop-filter: blur(7px);
    }

    #discoverOverlay.show {
      display: flex;
      animation: discover-overlay-in .2s ease-out both;
    }

    #discoverOverlay::before,
    #discoverOverlay::after {
      content: '';
      position: absolute;
      width: 560px;
      height: 560px;
      border: 1px solid rgba(255, 218, 112, .17);
      border-radius: 50%;
      pointer-events: none;
      animation: discover-ring 4.8s linear infinite;
    }

    #discoverOverlay::after {
      width: 410px;
      height: 410px;
      animation-direction: reverse;
      animation-duration: 3.8s;
    }

    .discover-panel {
      position: relative;
      z-index: 1;
      width: min(1080px, 95vw);
      padding: 24px 28px 30px;
      border: 1px solid rgba(244, 202, 104, .46);
      border-radius: 26px;
      background: linear-gradient(180deg, rgba(49, 32, 19, .97), rgba(23, 16, 10, .99));
      box-shadow: 0 26px 90px rgba(0, 0, 0, .68), 0 0 48px rgba(232, 173, 59, .16);
    }

    .discover-heading {
      margin: 0;
      color: #fff2c7;
      text-align: center;
      font-size: 1.8rem;
      font-weight: 950;
      letter-spacing: .06em;
      text-shadow: 0 0 18px rgba(255, 202, 85, .35);
    }

    .discover-subtitle {
      margin: 7px 0 24px;
      color: rgba(255, 239, 203, .7);
      text-align: center;
      font-size: .9rem;
      letter-spacing: .04em;
    }

    .discover-card-grid {
      display: flex;
      align-items: stretch;
      justify-content: center;
      gap: 26px;
      min-height: 310px;
      perspective: 1000px;
    }

    .discover-card-choice {
      position: relative;
      flex: 0 1 270px;
      width: min(270px, 28vw);
      min-width: 210px;
      min-height: 300px !important;
      cursor: pointer;
      opacity: 0;
      transform: translateY(54px) rotateY(12deg) scale(.86);
      animation: discover-card-arrive .48s cubic-bezier(.16, .84, .28, 1.15) forwards;
      transition: transform .16s ease, box-shadow .16s ease, filter .16s ease !important;
    }

    .discover-card-choice:nth-child(2) {
      animation-delay: .09s;
      transform: translateY(54px) scale(.86);
    }

    .discover-card-choice:nth-child(3) {
      animation-delay: .18s;
      transform: translateY(54px) rotateY(-12deg) scale(.86);
    }

    .discover-card-choice:hover,
    .discover-card-choice:focus-visible {
      z-index: 3;
      transform: translateY(-12px) scale(1.055) !important;
      filter: brightness(1.1) saturate(1.08);
      border-color: rgba(255, 226, 126, .98) !important;
      box-shadow: 0 28px 54px rgba(0, 0, 0, .58), 0 0 34px rgba(255, 195, 61, .48) !important;
      outline: none;
    }

    .discover-card-choice .discover-pick-label {
      position: absolute;
      right: 12px;
      bottom: 10px;
      z-index: 40;
      padding: 5px 11px;
      border-radius: 999px;
      color: #281807;
      background: linear-gradient(180deg, #ffe08a, #d99b2c);
      font-size: .7rem;
      font-weight: 950;
      pointer-events: none;
      box-shadow: 0 4px 10px rgba(0,0,0,.34);
    }

    @keyframes discover-overlay-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes discover-card-arrive {
      0% { opacity: 0; transform: translateY(54px) scale(.86); }
      72% { opacity: 1; transform: translateY(-7px) scale(1.025); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes discover-ring {
      from { transform: rotate(0deg) scale(.98); }
      50% { transform: rotate(180deg) scale(1.04); }
      to { transform: rotate(360deg) scale(.98); }
    }

    @media (max-width: 800px) {
      .discover-panel { padding: 18px; }
      .discover-card-grid { gap: 12px; }
      .discover-card-choice { min-width: 0; width: 30vw; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'discoverOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'discoverHeading');
  overlay.innerHTML = `
    <section class="discover-panel">
      <h2 class="discover-heading" id="discoverHeading">カードを発見</h2>
      <p class="discover-subtitle">1枚選んでください　（数字キー 1〜3 でも選択できます）</p>
      <div class="discover-card-grid" id="discoverCardGrid"></div>
    </section>
  `;
  document.body.appendChild(overlay);

  const heading = overlay.querySelector('#discoverHeading');
  const grid = overlay.querySelector('#discoverCardGrid');

  function sampleDistinct(pool, count = 3) {
    const unique = new Map();
    (pool || []).filter(Boolean).forEach((card, index) => {
      const key = card.id || `${card.name || 'card'}:${card.tier || 0}:${index}`;
      if (!unique.has(key)) unique.set(key, card);
    });
    const source = [...unique.values()];
    const picks = [];
    while (source.length && picks.length < count) {
      const index = Math.floor(Math.random() * source.length);
      picks.push(source.splice(index, 1)[0]);
    }
    return picks;
  }

  function cardMarkup(card) {
    const isSpell = card.type === 'spell';
    const tier = Number(card.tier || 0);
    const tag = isSpell ? 'スペル' : (card.tribe || 'なし');
    const cost = isSpell ? `${Number(card.cost || 0)} コイン` : `グレード ${tier}`;
    const stats = isSpell ? '' : `
      <div class="stats">
        <span class="stat-orb atk-orb"><span class="stat-label">攻</span>${Number(card.atk || 0)}</span>
        <span class="stat-orb hp-orb"><span class="stat-label">体</span>${Number(card.hp || 0)}</span>
      </div>`;

    return `
      <div class="tier-number-badge">${isSpell ? 'S' : tier}</div>
      <div class="cost">${escapeHtml(cost)}</div>
      <div class="card-emoji">${escapeHtml(card.emoji || '🃏')}</div>
      <div class="card-name">${escapeHtml(card.name || '名称未設定')}</div>
      <div class="tagline">グレード ${tier} / ${escapeHtml(tag)}</div>
      <div class="card-text">${escapeHtml(card.text || '効果なし。')}</div>
      ${stats}
      <span class="discover-pick-label">選ぶ</span>
    `;
  }

  function closeDiscover() {
    overlay.classList.remove('show');
    grid.innerHTML = '';
    activeDiscover = null;
    queueMicrotask(openNextDiscover);
  }

  function chooseCard(card) {
    if (!activeDiscover) return;
    const { gameState, message } = activeDiscover;
    const gained = gainCardToHand(gameState, card, message || `${card.name} を獲得した。`);
    closeDiscover();
    if (gained !== false && typeof render === 'function') render();
  }

  function openNextDiscover() {
    if (activeDiscover) return;
    const request = discoverQueue.shift();
    if (!request) return;

    if ((request.gameState.hand || []).length >= HAND_LIMIT) {
      if (typeof log === 'function') log('手札がいっぱいです。');
      queueMicrotask(openNextDiscover);
      return;
    }

    const candidates = sampleDistinct(request.pool, 3);
    if (!candidates.length) {
      if (typeof log === 'function') log(`${request.title || '発見'}：候補がありません。`);
      queueMicrotask(openNextDiscover);
      return;
    }

    activeDiscover = request;
    heading.textContent = request.title || 'カードを発見';
    grid.innerHTML = '';

    candidates.forEach(card => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `shop-card discover-card-choice${card.type === 'spell' ? ' spell' : ''} ${tribeClass(card.tribe)}`;
      node.innerHTML = cardMarkup(card);
      node.addEventListener('click', () => chooseCard(card));
      grid.appendChild(node);
    });

    overlay.classList.add('show');
    window.setTimeout(() => grid.querySelector('button')?.focus(), 220);
  }

  function enqueueDiscover(gameState, pool, count, title, message = null) {
    const amount = Math.max(0, Math.floor(Number(count || 0)));
    for (let index = 0; index < amount; index += 1) {
      discoverQueue.push({
        gameState,
        pool: [...(pool || [])],
        title,
        message,
      });
    }
    queueMicrotask(openNextDiscover);
  }

  function currentTierPool(gameState, pool) {
    const tier = Math.max(1, Number(gameState?.tavernTier || 1));
    return (pool || []).filter(card => Number(card?.tier || 0) <= tier);
  }

  window.discoverCards = function(gameState, pool, count, title) {
    enqueueDiscover(gameState, currentTierPool(gameState, pool), count, title);
  };

  window.discoverCardsBeyondTier = function(gameState, pool, count, title) {
    enqueueDiscover(gameState, pool, count, title);
  };

  window.__acidDiscoverQueue = discoverQueue;

  document.addEventListener('keydown', event => {
    if (!activeDiscover || !['1', '2', '3'].includes(event.key)) return;
    const button = grid.querySelectorAll('button')[Number(event.key) - 1];
    if (button) {
      event.preventDefault();
      button.click();
    }
  });
}, { once: true });
