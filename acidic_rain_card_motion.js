/*
 * FLIP-based motion for cards. Cards keep a small instance id as they move from
 * the tavern to the hand and from the hand to the board, so full DOM re-renders
 * no longer look like abrupt teleportation.
 */
window.addEventListener('load', () => {
  if (window.__acidCardMotionInstalled) return;
  window.__acidCardMotionInstalled = true;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  let nextMotionId = 1;
  let rendering = false;

  function cardMotionId(card) {
    if (!card || typeof card !== 'object') return '';
    if (!card.__acidMotionId) {
      card.__acidMotionId = `acid-card-${nextMotionId++}`;
    }
    return card.__acidMotionId;
  }

  function ensureStateMotionIds() {
    if (typeof state === 'undefined' || !state) return;
    (state.shop || []).forEach(cardMotionId);
    (state.hand || []).forEach(cardMotionId);
    (state.board || []).forEach((card, index) => {
      if (index >= 2) cardMotionId(card);
    });
  }

  function zoneOf(node) {
    if (node.closest('#shopGrid')) return 'shop';
    if (node.closest('#boardSlots')) return 'board';
    return 'hand';
  }

  function motionNodes() {
    return [...document.querySelectorAll(
      '#shopGrid .shop-card[data-motion-id], #boardSlots .board-card[data-motion-id], #handGrid .hand-card[data-motion-id]'
    )];
  }

  function bindMotionIdsToNodes() {
    if (typeof state === 'undefined' || !state) return;

    [...(shopGridEl?.children || [])].forEach((node, index) => {
      const card = state.shop?.[index];
      if (!card || node.classList.contains('empty')) return;
      node.dataset.motionId = cardMotionId(card);
      node.dataset.motionAtk = String(Number(card.atk || 0));
      node.dataset.motionHp = String(Number(card.hp || 0));
    });

    [...(handGridEl?.children || [])].forEach((node, index) => {
      const card = state.hand?.[index];
      if (!card || node.classList.contains('empty')) return;
      node.dataset.motionId = cardMotionId(card);
      node.dataset.motionAtk = String(Number(card.atk || 0));
      node.dataset.motionHp = String(Number(card.hp || 0));
    });

    [...(boardSlotsEl?.children || [])].forEach(node => {
      const index = Number(node.dataset.boardSlot);
      const card = Number.isInteger(index) ? state.board?.[index] : null;
      if (!card || node.classList.contains('empty')) return;
      node.dataset.motionId = cardMotionId(card);
      node.dataset.motionAtk = String(Number(card.atk || 0));
      node.dataset.motionHp = String(Number(card.hp || 0));
    });
  }

  function snapshotNodes() {
    const snapshots = new Map();
    motionNodes().forEach(node => {
      const rect = node.getBoundingClientRect();
      snapshots.set(node.dataset.motionId, {
        rect,
        zone: zoneOf(node),
        atk: node.dataset.motionAtk,
        hp: node.dataset.motionHp,
        clone: node.cloneNode(true),
      });
    });
    return snapshots;
  }

  function animateMove(node, from, to, statChanged) {
    if (reduceMotion || typeof node.animate !== 'function') return;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const scaleX = to.width > 0 ? from.width / to.width : 1;
    const scaleY = to.height > 0 ? from.height / to.height : 1;
    const distance = Math.hypot(dx, dy);

    if (distance > .5 || Math.abs(scaleX - 1) > .01 || Math.abs(scaleY - 1) > .01) {
      node.animate([
        {
          translate: `${dx}px ${dy}px`,
          scale: `${scaleX} ${scaleY}`,
          opacity: .82,
          filter: 'brightness(1.08)',
        },
        {
          translate: '0px 0px',
          scale: '1 1',
          opacity: 1,
          filter: 'brightness(1)',
        },
      ], {
        duration: Math.min(340, Math.max(190, 180 + distance * .15)),
        easing: 'cubic-bezier(.2,.82,.25,1)',
      });
    }

    if (statChanged) {
      node.animate([
        { filter: 'brightness(1)', scale: '1' },
        { filter: 'brightness(1.42) saturate(1.18)', scale: '1.035', offset: .42 },
        { filter: 'brightness(1)', scale: '1' },
      ], {
        duration: 420,
        easing: 'cubic-bezier(.18,.9,.28,1.12)',
      });
    }
  }

  function animateEntry(node, zone) {
    if (reduceMotion) return;
    const className = `card-motion-enter-${zone}`;
    node.classList.add(className);
    const clear = () => node.classList.remove(className);
    node.addEventListener('animationend', clear, { once:true });
    window.setTimeout(clear, 500);
  }

  function animateExit(snapshot) {
    if (reduceMotion || !snapshot?.clone || typeof snapshot.clone.animate !== 'function') return;
    const ghost = snapshot.clone;
    const rect = snapshot.rect;
    ghost.classList.remove(
      'is-card-drag-source',
      'is-native-card-drag-source',
      'drop-target',
      'reorder-target',
      'targeting-valid',
      'targeting-hover',
    );
    ghost.classList.add('card-motion-ghost');
    ghost.removeAttribute('data-motion-id');
    Object.assign(ghost.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    document.body.appendChild(ghost);
    const animation = ghost.animate([
      { opacity: 1, translate: '0px 0px', scale: '1', filter: 'blur(0px)' },
      { opacity: 0, translate: `0px ${snapshot.zone === 'shop' ? '-10px' : '8px'}`, scale: '.94', filter: 'blur(2px)' },
    ], {
      duration: snapshot.zone === 'shop' ? 180 : 220,
      easing: 'cubic-bezier(.3,.1,.3,1)',
      fill: 'forwards',
    });
    animation.finished.finally(() => ghost.remove());
  }

  function animateAfterRender(before) {
    bindMotionIdsToNodes();
    const remaining = new Map(before);

    motionNodes().forEach(node => {
      const id = node.dataset.motionId;
      const previous = before.get(id);
      const rect = node.getBoundingClientRect();
      if (previous) {
        remaining.delete(id);
        const statChanged = previous.atk !== node.dataset.motionAtk || previous.hp !== node.dataset.motionHp;
        animateMove(node, previous.rect, rect, statChanged);
      } else {
        animateEntry(node, zoneOf(node));
      }
    });

    remaining.forEach(animateExit);
  }

  if (typeof render === 'function') {
    const previousRender = render;
    render = function(...args) {
      if (rendering) return previousRender.apply(this, args);
      rendering = true;
      ensureStateMotionIds();
      bindMotionIdsToNodes();
      const before = snapshotNodes();
      try {
        const result = previousRender.apply(this, args);
        ensureStateMotionIds();
        animateAfterRender(before);
        return result;
      } finally {
        rendering = false;
      }
    };
  }

  /* Smooth pointer-drag clone and dim its source card. */
  const dragObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const added of record.addedNodes) {
        if (!(added instanceof Element)) continue;
        const clone = added.matches('.dragging-card') ? added : added.querySelector?.('.dragging-card');
        if (!clone) continue;
        window.requestAnimationFrame(() => {
          state?.dragging?.sourceElement?.classList.add('is-card-drag-source');
        });
      }
      for (const removed of record.removedNodes) {
        if (!(removed instanceof Element)) continue;
        if (removed.matches('.dragging-card') || removed.querySelector?.('.dragging-card')) {
          document.querySelectorAll('.is-card-drag-source').forEach(node => node.classList.remove('is-card-drag-source'));
        }
      }
    }
  });
  dragObserver.observe(document.body, { childList:true, subtree:true });

  /* Use a clean drag preview for native hand dragging. */
  document.addEventListener('dragstart', event => {
    const source = event.target?.closest?.('.hand-card:not(.empty)');
    if (!source) return;
    source.classList.add('is-native-card-drag-source');
    const preview = source.cloneNode(true);
    preview.classList.add('card-native-drag-preview');
    preview.style.width = `${source.getBoundingClientRect().width}px`;
    preview.style.height = `${source.getBoundingClientRect().height}px`;
    document.body.appendChild(preview);
    event.dataTransfer?.setDragImage(preview, preview.offsetWidth / 2, preview.offsetHeight / 2);
    window.setTimeout(() => preview.remove(), 0);
  }, true);

  document.addEventListener('dragend', () => {
    document.querySelectorAll('.is-native-card-drag-source').forEach(node => node.classList.remove('is-native-card-drag-source'));
  }, true);

  ensureStateMotionIds();
  bindMotionIdsToNodes();
  window.__acidCardMotionReady = true;
}, { once:true });
