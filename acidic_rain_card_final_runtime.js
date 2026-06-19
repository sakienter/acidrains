/* Final adaptive card layout. Inline important rules keep cards readable even
 * when older theme styles are appended later by runtime modules. */
(() => {
  if (window.__acidFinalCardRuntimeInstalled) {
    window.refreshAcidFinalCards?.();
    return;
  }
  window.__acidFinalCardRuntimeInstalled = true;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const px = value => `${Math.round(value)}px`;
  const set = (node, property, value) => {
    if (node) node.style.setProperty(property, String(value), 'important');
  };

  function nameFontSize(name, width, kind) {
    const length = [...String(name || '')].length;
    const base = kind === 'hand' ? 9 : width >= 205 ? 14 : width >= 180 ? 12.5 : 11;
    if (length <= 7) return base;
    if (length <= 10) return base * 0.9;
    if (length <= 14) return base * 0.8;
    return base * 0.72;
  }

  function cardMetrics(container, count, kind) {
    const available = Math.max(320, container.clientWidth || window.innerWidth);
    const gap = kind === 'hand' ? 2 : 12;
    const horizontalPadding = kind === 'hand' ? 52 : 44;
    const rawWidth = (available - horizontalPadding - gap * Math.max(0, count - 1)) / Math.max(1, count);

    if (kind === 'hand') {
      const width = clamp(rawWidth, 104, 132);
      return { width, height: clamp(width * 1.34, 140, 174), gap };
    }

    if (kind === 'board') {
      const width = clamp(rawWidth, 158, 208);
      return { width, height: clamp(width * 1.18, 200, 246), gap };
    }

    const width = clamp(rawWidth, 164, 220);
    return { width, height: clamp(width * 1.23, 212, 270), gap };
  }

  function fitCard(card, metrics, kind) {
    const { width, height } = metrics;
    const isHand = kind === 'hand';
    const isBoard = kind === 'board';
    const isSpell = card.classList.contains('spell');
    const padding = isHand ? 6 : 9;
    const gap = isHand ? 3 : 5;
    const artHeight = isHand
      ? clamp(height * 0.29, 40, 51)
      : clamp(height * 0.32, 65, 86);
    const nameHeight = isHand ? 23 : clamp(height * 0.12, 30, 34);
    const statHeight = isHand ? 23 : clamp(height * 0.115, 28, 32);
    const availableEffectHeight =
      height - padding * 2 - gap * (isSpell ? 2 : 3) - artHeight - nameHeight - (isSpell ? 0 : statHeight);
    const minimumEffectHeight = isHand ? 50 : isBoard ? 40 : 84;
    const effectHeight = Math.max(minimumEffectHeight, availableEffectHeight);
    const tribeWidth = isHand ? clamp(width * 0.36, 42, 48) : clamp(width * 0.3, 54, 68);

    card.dataset.finalCardKind = kind;
    set(card, 'display', 'grid');
    set(card, 'grid-template-columns', `minmax(0, 1fr) ${px(tribeWidth)}`);
    set(
      card,
      'grid-template-rows',
      isSpell
        ? `${px(artHeight)} ${px(nameHeight)} minmax(${px(effectHeight)}, 1fr)`
        : `${px(artHeight)} ${px(nameHeight)} minmax(${px(effectHeight)}, 1fr) ${px(statHeight)}`
    );
    set(card, 'column-gap', '0');
    set(card, 'row-gap', px(gap));
    set(card, 'width', px(width));
    set(card, 'min-width', px(width));
    set(card, 'max-width', px(width));
    set(card, 'height', px(height));
    set(card, 'min-height', px(height));
    set(card, 'max-height', px(height));
    set(card, 'padding', `${px(padding)} ${px(isHand ? 6 : 8)} ${px(isHand ? 6 : 8)}`);
    set(card, 'overflow', 'visible');
    set(card, 'flex', `0 0 ${px(width)}`);

    card.querySelectorAll('.card-effect-label').forEach(label => {
      set(label, 'display', 'none');
    });

    const art = card.querySelector(':scope > .card-emoji');
    if (art) {
      set(art, 'grid-column', '1 / -1');
      set(art, 'grid-row', '1');
      set(art, 'width', '100%');
      set(art, 'height', '100%');
      set(art, 'min-height', '0');
      set(art, 'align-self', 'stretch');
      set(art, 'justify-self', 'stretch');
      set(art, 'padding', isHand ? '2px 21px' : `3px ${px(clamp(width * 0.15, 25, 36))}`);
      set(art, 'font-size', px(isHand ? clamp(width * 0.27, 29, 35) : clamp(width * 0.23, 37, 49)));
      set(art, 'overflow', 'hidden');
      const image = art.querySelector('img');
      if (image) {
        set(image, 'height', px(artHeight - (isHand ? 5 : 7)));
        set(image, 'max-height', '94%');
        set(image, 'max-width', '92%');
        set(image, 'object-fit', 'contain');
      }
    }

    const name = card.querySelector(':scope > .card-name');
    if (name) {
      set(name, 'grid-column', '1');
      set(name, 'grid-row', '2');
      set(name, 'height', px(nameHeight));
      set(name, 'min-height', px(nameHeight));
      set(name, 'font-size', px(nameFontSize(name.textContent, width, kind)));
      set(name, 'line-height', '1');
      set(name, 'white-space', 'nowrap');
      set(name, 'text-overflow', 'ellipsis');
      set(name, 'overflow', 'hidden');
    }

    const tagline = card.querySelector(':scope > .tagline');
    if (tagline) {
      set(tagline, 'grid-column', '2');
      set(tagline, 'grid-row', '2');
      set(tagline, 'width', px(tribeWidth));
      set(tagline, 'max-width', px(tribeWidth));
      set(tagline, 'height', px(nameHeight));
      set(tagline, 'min-height', px(nameHeight));
      set(tagline, 'font-size', px(isHand ? 7.5 : clamp(width * 0.047, 8.5, 10.5)));
      set(tagline, 'line-height', '1');
      set(tagline, 'white-space', 'nowrap');
      set(tagline, 'text-overflow', 'ellipsis');
      set(tagline, 'overflow', 'hidden');
    }

    const effect = card.querySelector(':scope > .card-text');
    if (effect) {
      set(effect, 'grid-column', '1 / -1');
      set(effect, 'grid-row', '3');
      set(effect, 'width', '100%');
      set(effect, 'height', '100%');
      set(effect, 'min-height', px(effectHeight));
      set(effect, 'max-height', 'none');
      set(effect, 'align-self', 'stretch');
      set(effect, 'padding', isHand ? '5px' : isBoard ? '8px 9px 7px' : '10px 11px 9px');
      set(
        effect,
        'font-size',
        px(
          isHand
            ? clamp(width * 0.064, 7.5, 8.8)
            : isBoard
              ? clamp(width * 0.057, 9.5, 12.2)
              : clamp(width * 0.06, 10.5, 13.2)
        )
      );
      set(effect, 'line-height', isHand ? '1.2' : isBoard ? '1.28' : '1.34');
      set(effect, '-webkit-line-clamp', isHand ? '5' : isBoard ? (isSpell ? '8' : '6') : (isSpell ? '9' : '7'));
      set(effect, '-webkit-box-orient', 'vertical');
      set(effect, 'overflow', 'hidden');
    }

    const stats = card.querySelector(':scope > .stats');
    if (stats) {
      if (isSpell) {
        set(stats, 'display', 'none');
      } else {
        set(stats, 'display', 'flex');
        set(stats, 'grid-column', '1 / -1');
        set(stats, 'grid-row', '4');
        set(stats, 'width', isHand ? '74%' : isBoard ? '68%' : '70%');
        set(stats, 'height', px(statHeight));
        set(stats, 'min-height', px(statHeight));
        set(stats, 'justify-self', 'center');
        set(stats, 'align-self', 'center');
        set(stats, 'align-items', 'center');
        set(stats, 'justify-content', 'center');
        set(stats, 'gap', isHand ? '5px' : '8px');
        if (isBoard) set(stats, 'transform', 'translateY(-2px)');
        stats.querySelectorAll(':scope > .atk, :scope > .hp, :scope > .stat-orb').forEach(stat => {
          set(stat, 'min-width', '0');
          set(stat, 'width', 'auto');
          set(stat, 'height', 'auto');
          set(stat, 'padding', '0');
          set(stat, 'font-size', px(isHand ? 12 : clamp(width * 0.08, 14, 18)));
        });
      }
    }

    const tier = card.querySelector(':scope > .tier-number-badge');
    if (tier) {
      const tierWidth = isHand ? clamp(width * 0.36, 39, 45) : clamp(width * 0.27, 45, 56);
      set(tier, 'width', px(tierWidth));
      set(tier, 'min-width', px(tierWidth));
      set(tier, 'height', px(tierWidth * 1.2));
      set(tier, 'font-size', px(isHand ? 18 : clamp(width * 0.105, 19, 25)));
    }

    const cost = card.querySelector(':scope > .cost');
    if (cost) {
      const costSize = isHand ? clamp(width * 0.31, 34, 40) : clamp(width * 0.225, 38, 48);
      set(cost, 'width', px(costSize));
      set(cost, 'min-width', px(costSize));
      set(cost, 'max-width', px(costSize));
      set(cost, 'height', px(costSize));
      set(cost, 'min-height', px(costSize));
      set(cost, 'font-size', px(isHand ? 12 : clamp(width * 0.075, 13, 17)));
    }
  }

  function fitContainer(id, selector, kind) {
    const container = document.getElementById(id);
    if (!container) return;
    const cards = [...container.querySelectorAll(`:scope > ${selector}`)]
      .filter(card => !card.classList.contains('empty'));
    if (!cards.length) return;

    const metrics = cardMetrics(container, cards.length, kind);
    set(container, 'display', 'flex');
    set(container, 'align-items', kind === 'hand' ? 'flex-end' : 'flex-start');
    set(container, 'justify-content', 'center');
    set(container, 'gap', px(metrics.gap));
    set(container, 'overflow', 'visible');

    if (kind === 'shop') {
      set(container, 'min-height', px(metrics.height + 24));
      set(container, 'height', px(metrics.height + 24));
    } else if (kind === 'board') {
      set(container, 'min-height', px(metrics.height + 20));
      set(container, 'height', px(metrics.height + 20));
    } else {
      set(container, 'min-height', px(metrics.height + 10));
      set(container, 'height', px(metrics.height + 10));
    }

    cards.forEach(card => fitCard(card, metrics, kind));
  }

  let scheduled = false;
  function refresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fitContainer('shopGrid', '.shop-card', 'shop');
      fitContainer('boardSlots', '.board-card', 'board');
      fitContainer('handGrid', '.hand-card', 'hand');
    });
  }

  window.refreshAcidFinalCards = refresh;

  const observer = new MutationObserver(refresh);
  ['shopGrid', 'boardSlots', 'handGrid'].forEach(id => {
    const node = document.getElementById(id);
    if (node) observer.observe(node, { childList: true, subtree: true });
  });

  window.addEventListener('resize', refresh);
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(refresh);
    ['shopGrid', 'boardSlots', 'handGrid'].forEach(id => {
      const node = document.getElementById(id);
      if (node) resizeObserver.observe(node);
    });
  }

  refresh();
  setTimeout(refresh, 100);
  setTimeout(refresh, 500);
})();
