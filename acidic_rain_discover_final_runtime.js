/* Final runtime pass for Discover choices. */
(() => {
  if (window.__acidDiscoverFinalRuntimeInstalled) {
    window.refreshAcidDiscoverCards?.();
    return;
  }
  window.__acidDiscoverFinalRuntimeInstalled = true;

  const set = (node, property, value) => {
    if (node) node.style.setProperty(property, String(value), 'important');
  };

  function normalizeCost(card) {
    const cost = card.querySelector(':scope > .cost');
    if (!cost) return;
    const raw = String(cost.textContent || '').trim();
    const number = raw.match(/\d+/)?.[0];
    if (number) cost.textContent = `${number}c`;
    set(cost, 'white-space', 'nowrap');
    set(cost, 'overflow', 'hidden');
  }

  function normalizeTagline(card) {
    const tagline = card.querySelector(':scope > .tagline');
    if (!tagline) return;
    const raw = String(tagline.textContent || '').trim();
    const cleaned = raw
      .replace(/^Tier\s*\d+\s*\/\s*/i, '')
      .replace(/^グレード\s*\d+\s*[\/／]\s*/, '')
      .replace(/^G\s*\d+\s*[\/／]\s*/i, '')
      .replace(/^ティア\s*\d+\s*[\/／]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned) tagline.textContent = cleaned;
  }

  function normalizeRules(card) {
    const text = card.querySelector(':scope > .card-text');
    if (!text) return;
    text.querySelectorAll('.card-effect-label').forEach(label => label.remove());
    set(text, 'overflow', 'hidden');
    set(text, 'text-align', 'left');
  }

  function normalizeStats(card) {
    const stats = card.querySelector(':scope > .stats');
    if (!stats) return;
    if (card.classList.contains('spell')) {
      set(stats, 'display', 'none');
      return;
    }
    set(stats, 'position', 'relative');
    set(stats, 'left', 'auto');
    set(stats, 'right', 'auto');
    set(stats, 'bottom', 'auto');
    set(stats, 'inset', 'auto');
    set(stats, 'justify-self', 'center');
    set(stats, 'align-self', 'center');
    set(stats, 'display', 'flex');
    set(stats, 'justify-content', 'center');
    set(stats, 'align-items', 'center');
    stats.querySelectorAll(':scope > .hp, :scope > .hp-orb').forEach(hp => {
      set(hp, 'min-width', '0');
    });
  }

  function normalizeChoice(card) {
    if (!card || card.classList.contains('empty')) return;
    card.classList.add('discover-final-card');
    normalizeCost(card);
    normalizeTagline(card);
    normalizeRules(card);
    normalizeStats(card);
  }

  let scheduled = false;
  function refresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      document.querySelectorAll('#discoverOverlay .discover-card-choice').forEach(normalizeChoice);
    });
  }

  window.refreshAcidDiscoverCards = refresh;

  const overlay = document.getElementById('discoverOverlay') || document.body;
  const observer = new MutationObserver(refresh);
  observer.observe(overlay, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

  window.addEventListener('resize', refresh);
  refresh();
  setTimeout(refresh, 120);
  setTimeout(refresh, 600);
})();
