/* Decorate rendered cards with readable rules text and a full-effect preview. */
(() => {
  if (window.__acidCardReadabilityInstalled) return;
  window.__acidCardReadabilityInstalled = true;

  const KEYWORDS = [
    'ターン終了時',
    'ターン開始時',
    '戦闘開始時',
    'このカードを売った時',
    'このカードが破壊された時',
    '自分がゴールドを獲得した後',
    '自分がゴールドを使うたび',
    '雄叫び',
    '断末魔',
    '売却時',
    '仇討ち',
    '勝鬨',
    '呪文錬成',
    '超電磁',
    '蘇り',
    '聖なる盾',
    '挑発',
    '隠れ身',
    '覚醒効果',
    '覚醒',
    '発見',
  ];

  const TRIBE_CLASSES = {
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

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function formattedEffect(text) {
    let html = escapeHtml(text || '効果なし。');
    html = html.replace(
      /([+＋−-]?\d+(?:\.\d+)?(?:\/[+＋−-]?\d+(?:\.\d+)?)?(?:G|ゴールド|コイン|秒|枚|回|体|ターン)?|[XＸ](?:\/[XＸ])?)/g,
      '<span class="card-value">$1</span>',
    );
    for (const keyword of KEYWORDS) {
      html = html.replace(
        new RegExp(escapeRegExp(keyword), 'g'),
        `<span class="card-keyword">${keyword}</span>`,
      );
    }
    return html;
  }

  function tribeClass(tribe) {
    return TRIBE_CLASSES[String(tribe || '').trim()] || 'tribe-neutral';
  }

  function ensureTierBadge(node, card) {
    let badge = node.querySelector(':scope > .tier-number-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'tier-number-badge';
      node.prepend(badge);
    }
    badge.textContent = String(Math.max(0, Number(card?.tier || 0)));
  }

  function ensureTagline(node, card) {
    let tagline = node.querySelector(':scope > .tagline');
    if (!tagline) {
      tagline = document.createElement('div');
      tagline.className = 'tagline';
      const name = node.querySelector(':scope > .card-name');
      if (name) name.insertAdjacentElement('afterend', tagline);
      else node.appendChild(tagline);
    }
    const type = card?.type === 'spell' ? 'スペル' : (card?.tribe || 'なし');
    tagline.textContent = `グレード ${Number(card?.tier || 0)} / ${type}`;
  }

  function decorateCard(node, card) {
    if (!node || !card || node.classList.contains('empty')) return;
    node.classList.add('readability-card');
    node.classList.toggle('spell', card.type === 'spell');
    Object.values(TRIBE_CLASSES).forEach(className => node.classList.remove(className));
    node.classList.remove('tribe-neutral');
    node.classList.add(tribeClass(card.tribe));

    ensureTierBadge(node, card);
    ensureTagline(node, card);

    const effect = String(card.text || '効果なし。');
    const effectNode = node.querySelector(':scope > .card-text');
    if (effectNode && effectNode.dataset.readabilityText !== effect) {
      effectNode.dataset.readabilityText = effect;
      effectNode.innerHTML = `<span class="card-effect-label">効果</span>${formattedEffect(effect)}`;
    }

    node.dataset.cardPreviewName = String(card.name || '名称未設定');
    node.dataset.cardPreviewEffect = effect;
    node.dataset.cardPreviewMeta = card.type === 'spell'
      ? `G${Number(card.tier || 0)} スペル / コスト${Number(card.cost || 0)}`
      : `G${Number(card.tier || 0)} ${card.tribe || 'なし'}`;
    node.dataset.cardPreviewStats = card.type === 'spell'
      ? ''
      : `攻撃力 ${Number(card.atk || 0)}　体力 ${Number(card.hp || 0)}`;
    node.setAttribute(
      'aria-label',
      `${node.dataset.cardPreviewName}。${node.dataset.cardPreviewMeta}。${effect}`,
    );
  }

  function decorateAll() {
    if (typeof state === 'undefined' || !state) return;

    [...(document.querySelector('#shopGrid')?.children || [])].forEach((node, index) => {
      decorateCard(node, state.shop?.[index]);
    });

    [...(document.querySelector('#handGrid')?.children || [])].forEach((node, index) => {
      decorateCard(node, state.hand?.[index]);
    });

    [...(document.querySelector('#boardSlots')?.children || [])].forEach((node, childIndex) => {
      const slot = Number(node.dataset.boardSlot);
      const card = Number.isInteger(slot) ? state.board?.[slot] : state.board?.[childIndex + 2];
      decorateCard(node, card);
    });
  }

  function wrapRenderer(name) {
    const renderer = window[name];
    if (typeof renderer !== 'function' || renderer.__acidReadabilityWrapped) return;
    const wrapped = function(...args) {
      const result = renderer.apply(this, args);
      decorateAll();
      return result;
    };
    wrapped.__acidReadabilityWrapped = true;
    window[name] = wrapped;
  }

  let decorationScheduled = false;
  function scheduleDecoration() {
    if (decorationScheduled) return;
    decorationScheduled = true;
    window.requestAnimationFrame(() => {
      decorationScheduled = false;
      decorateAll();
    });
  }

  const preview = document.createElement('aside');
  preview.id = 'cardEffectPreview';
  preview.setAttribute('aria-hidden', 'true');
  preview.innerHTML = `
    <div class="card-effect-preview-head">
      <div class="card-effect-preview-name"></div>
      <div class="card-effect-preview-meta"></div>
    </div>
    <div class="card-effect-preview-rule"></div>
    <div class="card-effect-preview-stats"></div>
  `;
  document.body.appendChild(preview);

  const previewName = preview.querySelector('.card-effect-preview-name');
  const previewMeta = preview.querySelector('.card-effect-preview-meta');
  const previewRule = preview.querySelector('.card-effect-preview-rule');
  const previewStats = preview.querySelector('.card-effect-preview-stats');
  let previewTimer = null;
  let previewOwner = null;

  function positionPreview(node) {
    const rect = node.getBoundingClientRect();
    const gap = 12;
    const width = preview.offsetWidth || 330;
    const height = preview.offsetHeight || 160;
    let left = rect.right + gap;
    let top = rect.top + rect.height / 2 - height / 2;

    if (left + width > window.innerWidth - gap) {
      left = rect.left - width - gap;
    }
    if (left < gap) {
      left = Math.min(window.innerWidth - width - gap, Math.max(gap, rect.left + rect.width / 2 - width / 2));
      top = rect.top - height - gap;
      if (top < gap) top = rect.bottom + gap;
    }

    top = Math.min(window.innerHeight - height - gap, Math.max(gap, top));
    preview.style.left = `${Math.round(left)}px`;
    preview.style.top = `${Math.round(top)}px`;
  }

  function showPreview(node) {
    if (!node?.dataset.cardPreviewEffect) return;
    previewOwner = node;
    previewName.textContent = node.dataset.cardPreviewName || '';
    previewMeta.textContent = node.dataset.cardPreviewMeta || '';
    previewRule.innerHTML = formattedEffect(node.dataset.cardPreviewEffect);
    previewStats.textContent = node.dataset.cardPreviewStats || '';
    previewStats.hidden = !node.dataset.cardPreviewStats;
    preview.classList.add('show');
    preview.setAttribute('aria-hidden', 'false');
    positionPreview(node);
  }

  function queuePreview(node) {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => showPreview(node), 180);
  }

  function hidePreview() {
    window.clearTimeout(previewTimer);
    previewOwner = null;
    preview.classList.remove('show');
    preview.setAttribute('aria-hidden', 'true');
  }

  function previewCardFromEvent(event) {
    return event.target?.closest?.(
      '#shopGrid .shop-card.readability-card, #boardSlots .board-card.readability-card, #handGrid .hand-card.readability-card',
    ) || null;
  }

  document.addEventListener('pointerover', event => {
    const node = previewCardFromEvent(event);
    if (!node || node.contains(event.relatedTarget)) return;
    queuePreview(node);
  }, true);

  document.addEventListener('pointerout', event => {
    const node = previewCardFromEvent(event);
    if (!node || node.contains(event.relatedTarget)) return;
    if (previewOwner === node || !previewOwner) hidePreview();
  }, true);

  document.addEventListener('focusin', event => {
    const node = previewCardFromEvent(event);
    if (node) queuePreview(node);
  }, true);

  document.addEventListener('focusout', event => {
    const node = previewCardFromEvent(event);
    if (node && !node.contains(event.relatedTarget)) hidePreview();
  }, true);

  document.addEventListener('pointerdown', hidePreview, true);
  document.addEventListener('dragstart', hidePreview, true);
  window.addEventListener('scroll', hidePreview, true);
  window.addEventListener('resize', () => {
    if (previewOwner) positionPreview(previewOwner);
  });

  const observer = new MutationObserver(scheduleDecoration);
  ['shopGrid', 'boardSlots', 'handGrid'].forEach(id => {
    const container = document.getElementById(id);
    if (container) observer.observe(container, { childList:true, subtree:true });
  });

  ['renderShop', 'renderBoard', 'renderHand'].forEach(wrapRenderer);
  decorateAll();
  window.__acidCardReadabilityReady = true;
})();
