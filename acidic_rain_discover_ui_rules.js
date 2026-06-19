/* Cinematic card-style Discover presentation for every Discover effect. */
window.addEventListener('load', () => {
  if (window.__acidDiscoverUiInstalled) return;
  window.__acidDiscoverUiInstalled = true;

  const discoverQueue = [];
  let activeDiscover = null;
  let resolving = false;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

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
    body.discover-active {
      overflow: hidden !important;
    }

    #discoverOverlay {
      position: fixed;
      inset: 0;
      z-index: 12000;
      display: none;
      place-items: center;
      padding: 20px;
      overflow: hidden;
      color: #fff4cf;
      background:
        radial-gradient(circle at 50% 44%, rgba(255, 214, 99, .18), transparent 29%),
        radial-gradient(circle at 50% 50%, rgba(77, 173, 196, .13), transparent 49%),
        rgba(7, 8, 10, .91);
      backdrop-filter: blur(10px) saturate(.78);
      -webkit-backdrop-filter: blur(10px) saturate(.78);
      opacity: 0;
    }

    #discoverOverlay.show {
      display: grid;
      animation: discover-overlay-in 240ms ease-out both;
    }

    #discoverOverlay.closing {
      display: grid;
      pointer-events: none;
      animation: discover-overlay-out 190ms ease-in both;
    }

    #discoverOverlay::before {
      content: '';
      position: absolute;
      inset: -25%;
      pointer-events: none;
      background:
        repeating-conic-gradient(
          from 0deg,
          transparent 0deg 8deg,
          rgba(255, 220, 127, .035) 8deg 10deg,
          transparent 10deg 20deg
        );
      mask-image: radial-gradient(circle, #000 0 35%, transparent 67%);
      animation: discover-rays-spin 22s linear infinite;
    }

    #discoverOverlay::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, rgba(0,0,0,.5), transparent 17% 83%, rgba(0,0,0,.5)),
        linear-gradient(180deg, rgba(0,0,0,.36), transparent 22% 78%, rgba(0,0,0,.5));
    }

    .discover-aura {
      position: absolute;
      left: 50%;
      top: 50%;
      width: min(760px, 76vw);
      aspect-ratio: 1;
      translate: -50% -50%;
      border: 1px solid rgba(255, 222, 132, .18);
      border-radius: 50%;
      pointer-events: none;
      box-shadow:
        0 0 0 34px rgba(255, 222, 132, .025),
        0 0 0 86px rgba(108, 215, 235, .018),
        inset 0 0 90px rgba(255, 206, 83, .055),
        0 0 120px rgba(255, 184, 46, .09);
      animation: discover-aura-breathe 3.6s ease-in-out infinite;
    }

    .discover-aura::before,
    .discover-aura::after {
      content: '';
      position: absolute;
      inset: 11%;
      border: 1px dashed rgba(255, 224, 140, .22);
      border-radius: 50%;
      animation: discover-ring-spin 13s linear infinite;
    }

    .discover-aura::after {
      inset: 24%;
      border-style: solid;
      border-color: rgba(120, 223, 241, .2);
      animation-direction: reverse;
      animation-duration: 9s;
    }

    .discover-particles {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .discover-particle {
      --particle-x: 50vw;
      --particle-delay: 0s;
      --particle-duration: 5s;
      position: absolute;
      left: var(--particle-x);
      bottom: -18px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #ffe49a;
      box-shadow: 0 0 10px rgba(255, 218, 109, .9);
      opacity: 0;
      animation: discover-particle-rise var(--particle-duration) linear var(--particle-delay) infinite;
    }

    .discover-panel {
      position: relative;
      z-index: 2;
      width: min(1120px, 96vw);
      min-height: 440px;
      padding: 24px 30px 30px;
      overflow: visible;
      border: 1px solid rgba(246, 208, 115, .36);
      border-radius: 30px;
      background:
        linear-gradient(180deg, rgba(52, 38, 25, .83), rgba(18, 18, 19, .93)),
        radial-gradient(circle at 50% 0%, rgba(255, 220, 139, .14), transparent 48%);
      box-shadow:
        0 32px 100px rgba(0, 0, 0, .7),
        0 0 0 1px rgba(255, 255, 255, .025),
        inset 0 1px 0 rgba(255, 239, 201, .1),
        0 0 64px rgba(229, 169, 55, .11);
      transform-origin: center;
      animation: discover-panel-in 330ms cubic-bezier(.16,.84,.28,1.08) both;
    }

    .discover-panel::before {
      content: '';
      position: absolute;
      inset: 10px;
      border: 1px solid rgba(255, 231, 176, .065);
      border-radius: 22px;
      pointer-events: none;
    }

    .discover-panel.resolving {
      pointer-events: none;
    }

    .discover-kicker {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 3px;
      color: rgba(129, 224, 242, .76);
      font-size: .66rem;
      font-weight: 900;
      letter-spacing: .32em;
      text-transform: uppercase;
    }

    .discover-kicker::before,
    .discover-kicker::after {
      content: '';
      width: 54px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(132, 225, 242, .55));
    }

    .discover-kicker::after {
      transform: scaleX(-1);
    }

    .discover-heading {
      margin: 0;
      color: #fff1bd;
      text-align: center;
      font-size: clamp(1.5rem, 2.5vw, 2.05rem);
      font-weight: 1000;
      letter-spacing: .065em;
      line-height: 1.15;
      text-shadow:
        0 2px 2px rgba(0,0,0,.72),
        0 0 23px rgba(255, 198, 67, .31);
    }

    .discover-subtitle {
      min-height: 20px;
      margin: 8px 0 20px;
      color: rgba(255, 241, 211, .62);
      text-align: center;
      font-size: .8rem;
      font-weight: 700;
      letter-spacing: .045em;
    }

    .discover-card-grid {
      position: relative;
      display: flex;
      align-items: stretch;
      justify-content: center;
      gap: clamp(14px, 2.2vw, 28px);
      min-height: 318px;
      perspective: 1300px;
      transform-style: preserve-3d;
    }

    .discover-card-choice {
      --discover-tilt: 0deg;
      --discover-delay: 0ms;
      position: relative;
      flex: 0 1 272px;
      width: min(272px, 28vw);
      min-width: 210px;
      min-height: 304px !important;
      padding-top: 24px !important;
      cursor: pointer;
      opacity: 0;
      transform: translateY(58px) rotateY(var(--discover-tilt)) scale(.84);
      transform-style: preserve-3d;
      animation: discover-card-arrive 520ms cubic-bezier(.16,.84,.28,1.13) var(--discover-delay) forwards;
      transition:
        translate 170ms cubic-bezier(.2,.82,.25,1),
        scale 170ms cubic-bezier(.18,.9,.28,1.14),
        rotate 170ms ease,
        box-shadow 170ms ease,
        filter 170ms ease,
        border-color 170ms ease,
        opacity 180ms ease !important;
      will-change: transform, translate, scale, opacity, filter;
    }

    .discover-card-choice:nth-child(1) {
      --discover-tilt: 8deg;
      --discover-delay: 35ms;
    }

    .discover-card-choice:nth-child(2) {
      --discover-delay: 105ms;
    }

    .discover-card-choice:nth-child(3) {
      --discover-tilt: -8deg;
      --discover-delay: 175ms;
    }

    .discover-card-choice::before {
      content: '';
      position: absolute;
      inset: -5px;
      z-index: -1;
      border: 1px solid rgba(255, 224, 139, .08);
      border-radius: inherit;
      opacity: 0;
      box-shadow: 0 0 26px rgba(255, 200, 74, .42);
      transition: opacity 170ms ease;
    }

    .discover-card-choice:hover,
    .discover-card-choice:focus-visible,
    .discover-card-choice.keyboard-focus {
      z-index: 8;
      translate: 0 -13px;
      scale: 1.055;
      rotate: 0deg;
      filter: brightness(1.11) saturate(1.08);
      border-color: rgba(255, 228, 145, .98) !important;
      box-shadow:
        0 30px 60px rgba(0, 0, 0, .62),
        0 0 38px rgba(255, 198, 63, .44),
        inset 0 1px 0 rgba(255,255,255,.2) !important;
      outline: none;
    }

    .discover-card-choice:hover::before,
    .discover-card-choice:focus-visible::before,
    .discover-card-choice.keyboard-focus::before {
      opacity: 1;
    }

    .discover-card-choice.selected {
      z-index: 12;
      translate: 0 -14px;
      scale: 1.075;
      filter: brightness(1.2) saturate(1.14);
      border-color: #ffe39a !important;
      box-shadow:
        0 34px 72px rgba(0,0,0,.68),
        0 0 54px rgba(255, 205, 82, .68) !important;
      animation: discover-selected-pulse 430ms ease-out both !important;
    }

    .discover-card-choice.rejected {
      pointer-events: none;
      opacity: .12 !important;
      translate: 0 18px;
      scale: .9;
      filter: grayscale(.72) blur(1px) brightness(.55);
      animation: none !important;
    }

    .discover-card-choice .discover-index {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 50;
      width: 27px;
      height: 27px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 225, 142, .58);
      border-radius: 9px;
      color: #fff0bb;
      background: rgba(33, 23, 14, .9);
      font-size: .72rem;
      font-weight: 950;
      box-shadow: 0 4px 12px rgba(0,0,0,.38);
      pointer-events: none;
    }

    .discover-card-choice .discover-pick-label {
      position: absolute;
      right: 12px;
      bottom: 10px;
      z-index: 50;
      min-width: 62px;
      padding: 6px 12px;
      border: 1px solid rgba(255, 232, 168, .55);
      border-radius: 999px;
      color: #2b1908;
      background: linear-gradient(180deg, #ffe59c, #d89a2c);
      font-size: .68rem;
      font-weight: 1000;
      letter-spacing: .08em;
      pointer-events: none;
      box-shadow: 0 5px 12px rgba(0,0,0,.38);
      transition: transform 160ms ease, filter 160ms ease;
    }

    .discover-card-choice:hover .discover-pick-label,
    .discover-card-choice:focus-visible .discover-pick-label,
    .discover-card-choice.keyboard-focus .discover-pick-label {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }

    .discover-selection-ghost {
      position: fixed !important;
      z-index: 13000 !important;
      margin: 0 !important;
      pointer-events: none !important;
      transform: none !important;
      translate: 0 0 !important;
      scale: 1 !important;
      animation: none !important;
      contain: layout paint style;
      box-shadow:
        0 34px 80px rgba(0,0,0,.7),
        0 0 54px rgba(255, 208, 93, .6) !important;
    }

    .discover-queue-status {
      position: absolute;
      right: 24px;
      top: 22px;
      z-index: 4;
      min-width: 62px;
      padding: 5px 10px;
      border: 1px solid rgba(126, 220, 240, .2);
      border-radius: 999px;
      color: rgba(206, 246, 252, .72);
      background: rgba(15, 31, 36, .68);
      text-align: center;
      font-size: .62rem;
      font-weight: 850;
      letter-spacing: .06em;
    }

    @keyframes discover-overlay-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes discover-overlay-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes discover-panel-in {
      0% { opacity: 0; transform: translateY(14px) scale(.965); filter: blur(3px); }
      100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }

    @keyframes discover-card-arrive {
      0% { opacity: 0; transform: translateY(58px) rotateY(var(--discover-tilt)) scale(.84); filter: blur(4px); }
      68% { opacity: 1; transform: translateY(-8px) rotateY(0deg) scale(1.025); filter: blur(0) brightness(1.1); }
      100% { opacity: 1; transform: translateY(0) rotateY(0deg) scale(1); filter: none; }
    }

    @keyframes discover-selected-pulse {
      0% { filter: brightness(1.05); }
      42% { filter: brightness(1.42) saturate(1.2); }
      100% { filter: brightness(1.16) saturate(1.1); }
    }

    @keyframes discover-rays-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes discover-ring-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes discover-aura-breathe {
      0%, 100% { scale: .98; opacity: .68; }
      50% { scale: 1.035; opacity: 1; }
    }

    @keyframes discover-particle-rise {
      0% { opacity: 0; translate: 0 0; scale: .7; }
      12% { opacity: .72; }
      82% { opacity: .25; }
      100% { opacity: 0; translate: 0 -105vh; scale: 1.4; }
    }

    @media (max-width: 820px) {
      #discoverOverlay { padding: 10px; }
      .discover-panel { min-height: 0; padding: 18px 12px 22px; }
      .discover-card-grid { gap: 8px; min-height: 270px; }
      .discover-card-choice { min-width: 0; width: 31%; min-height: 260px !important; }
      .discover-queue-status { position: static; width: max-content; margin: 8px auto 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      #discoverOverlay,
      .discover-panel,
      .discover-card-choice,
      .discover-aura,
      .discover-aura::before,
      .discover-aura::after,
      .discover-particle {
        animation: none !important;
        transition-duration: 1ms !important;
      }
      .discover-card-choice { opacity: 1 !important; transform: none !important; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'discoverOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'discoverHeading');
  overlay.setAttribute('aria-describedby', 'discoverSubtitle');
  overlay.innerHTML = `
    <div class="discover-aura" aria-hidden="true"></div>
    <div class="discover-particles" aria-hidden="true"></div>
    <section class="discover-panel">
      <div class="discover-kicker">DISCOVER</div>
      <h2 class="discover-heading" id="discoverHeading">カードを発見</h2>
      <p class="discover-subtitle" id="discoverSubtitle">1枚選んでください</p>
      <div class="discover-queue-status" id="discoverQueueStatus">1 / 1</div>
      <div class="discover-card-grid" id="discoverCardGrid"></div>
    </section>
  `;
  document.body.appendChild(overlay);

  const panel = overlay.querySelector('.discover-panel');
  const heading = overlay.querySelector('#discoverHeading');
  const subtitle = overlay.querySelector('#discoverSubtitle');
  const queueStatus = overlay.querySelector('#discoverQueueStatus');
  const grid = overlay.querySelector('#discoverCardGrid');
  const particles = overlay.querySelector('.discover-particles');

  for (let index = 0; index < 24; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'discover-particle';
    particle.style.setProperty('--particle-x', `${4 + Math.random() * 92}vw`);
    particle.style.setProperty('--particle-delay', `${-Math.random() * 6}s`);
    particle.style.setProperty('--particle-duration', `${4.2 + Math.random() * 4}s`);
    particles.appendChild(particle);
  }

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

  function cardMarkup(card, index) {
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
      <span class="discover-index">${index + 1}</span>
      <div class="tier-number-badge">${isSpell ? 'S' : tier}</div>
      <div class="cost">${escapeHtml(cost)}</div>
      <div class="card-emoji">${escapeHtml(card.emoji || '🃏')}</div>
      <div class="card-name">${escapeHtml(card.name || '名称未設定')}</div>
      <div class="tagline">グレード ${tier} / ${escapeHtml(tag)}</div>
      <div class="card-text">${escapeHtml(card.text || '効果なし。')}</div>
      ${stats}
      <span class="discover-pick-label">選択</span>
    `;
  }

  function nextHandTarget() {
    const cards = [...document.querySelectorAll('#handGrid .hand-card:not(.empty)')];
    const target = cards.at(-1) || document.querySelector('#handGrid');
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return {
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
      width: Math.max(20, rect.width),
      height: Math.max(20, rect.height),
    };
  }

  function finishClose() {
    overlay.classList.remove('show', 'closing');
    panel.classList.remove('resolving');
    grid.innerHTML = '';
    activeDiscover = null;
    resolving = false;
    document.body.classList.remove('discover-active');
    queueMicrotask(openNextDiscover);
  }

  function closeDiscover(animated = true) {
    if (!overlay.classList.contains('show')) {
      finishClose();
      return;
    }
    overlay.classList.remove('show');
    if (!animated || reduceMotion) {
      finishClose();
      return;
    }
    overlay.classList.add('closing');
    window.setTimeout(finishClose, 190);
  }

  function animateSelection(button, gained) {
    const others = [...grid.querySelectorAll('.discover-card-choice')].filter(node => node !== button);
    button.classList.add('selected');
    others.forEach(node => node.classList.add('rejected'));
    panel.classList.add('resolving');

    if (!gained || reduceMotion || typeof button.animate !== 'function') {
      window.setTimeout(() => closeDiscover(!reduceMotion), reduceMotion ? 30 : 310);
      return;
    }

    const start = button.getBoundingClientRect();
    const ghost = button.cloneNode(true);
    ghost.classList.remove('selected', 'keyboard-focus');
    ghost.classList.add('discover-selection-ghost');
    Object.assign(ghost.style, {
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
    });
    document.body.appendChild(ghost);
    button.style.visibility = 'hidden';

    if (typeof render === 'function') render();
    const target = nextHandTarget() || {
      left: window.innerWidth / 2,
      top: window.innerHeight + 60,
      width: start.width * .55,
      height: start.height * .55,
    };
    const targetLeft = target.left - start.width / 2;
    const targetTop = target.top - start.height / 2;
    const dx = targetLeft - start.left;
    const dy = targetTop - start.top;
    const scaleX = Math.min(1, target.width / start.width);
    const scaleY = Math.min(1, target.height / start.height);

    const animation = ghost.animate([
      {
        translate: '0px 0px',
        scale: '1',
        opacity: 1,
        filter: 'brightness(1.18) saturate(1.1)',
      },
      {
        translate: `${dx * .12}px ${-26 + dy * .08}px`,
        scale: '1.07',
        opacity: 1,
        filter: 'brightness(1.42) saturate(1.18)',
        offset: .26,
      },
      {
        translate: `${dx}px ${dy}px`,
        scale: `${scaleX} ${scaleY}`,
        opacity: .08,
        filter: 'brightness(1.15) blur(1px)',
      },
    ], {
      duration: 520,
      easing: 'cubic-bezier(.22,.8,.22,1)',
      fill: 'forwards',
    });

    animation.finished.finally(() => {
      ghost.remove();
      closeDiscover(true);
    });
  }

  function chooseCard(card, button) {
    if (!activeDiscover || resolving) return;
    resolving = true;
    const { gameState, message } = activeDiscover;
    const gained = gainCardToHand(gameState, card, message || `${card.name}を獲得した。`);
    animateSelection(button, gained !== false);
  }

  function updateKeyboardFocus(nextIndex) {
    const buttons = [...grid.querySelectorAll('.discover-card-choice')];
    if (!buttons.length) return;
    const current = Math.max(0, buttons.findIndex(button => button === document.activeElement));
    const index = (nextIndex ?? current) % buttons.length;
    buttons.forEach(button => button.classList.remove('keyboard-focus'));
    const target = buttons[(index + buttons.length) % buttons.length];
    target.classList.add('keyboard-focus');
    target.focus({ preventScroll:true });
  }

  function openNextDiscover() {
    if (activeDiscover || resolving) return;
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
    resolving = false;
    heading.textContent = request.title || 'カードを発見';
    subtitle.textContent = `候補から1枚選択　・　数字キー 1〜${candidates.length} / ← → / Enter`;
    queueStatus.textContent = discoverQueue.length ? `残り ${discoverQueue.length + 1}回` : '1回';
    grid.innerHTML = '';
    grid.dataset.choiceCount = String(candidates.length);

    candidates.forEach((card, index) => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `shop-card discover-card-choice${card.type === 'spell' ? ' spell' : ''} ${tribeClass(card.tribe)}`;
      node.setAttribute('aria-label', `${index + 1}. ${card.name}を選択`);
      node.innerHTML = cardMarkup(card, index);
      node.addEventListener('click', () => chooseCard(card, node));
      node.addEventListener('mouseenter', () => {
        grid.querySelectorAll('.keyboard-focus').forEach(item => item.classList.remove('keyboard-focus'));
      });
      grid.appendChild(node);
    });

    document.body.classList.add('discover-active');
    overlay.classList.remove('closing');
    overlay.classList.add('show');
    window.setTimeout(() => updateKeyboardFocus(0), reduceMotion ? 0 : 260);
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
  window.__acidDiscoverUiState = () => ({
    active: Boolean(activeDiscover),
    resolving,
    queued: discoverQueue.length,
  });

  document.addEventListener('keydown', event => {
    if (!activeDiscover || resolving) return;
    const buttons = [...grid.querySelectorAll('.discover-card-choice')];
    if (!buttons.length) return;

    if (/^[1-3]$/.test(event.key)) {
      const button = buttons[Number(event.key) - 1];
      if (button) {
        event.preventDefault();
        button.click();
      }
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const current = Math.max(0, buttons.indexOf(document.activeElement));
      updateKeyboardFocus(current + (event.key === 'ArrowRight' ? 1 : -1));
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement?.classList.contains('discover-card-choice')) {
      event.preventDefault();
      document.activeElement.click();
    }
  }, true);
}, { once:true });