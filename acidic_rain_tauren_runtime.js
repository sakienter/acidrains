/* Ensure Magic-Using Tauren only repeats Tier 3 or lower spells. */
(() => {
  if (window.__acidTaurenRuntimeScheduled) return;
  window.__acidTaurenRuntimeScheduled = true;

  const num = value => Number(value || 0);
  const limitOf = card => card?.awakened ? 2 : 1;

  function install() {
    if (window.__acidTaurenRuntimeApplied || typeof playHandCardToSlot !== 'function') return;
    window.__acidTaurenRuntimeApplied = true;

    const previousPlayHandCardToSlot = playHandCardToSlot;
    playHandCardToSlot = function(index, targetIndex) {
      const spell = state.hand?.[index] || null;
      if (spell?.type !== 'spell' || num(spell.tier) <= 3) {
        return previousPlayHandCardToSlot(index, targetIndex);
      }

      const taurens = (state.board || []).filter((card, boardIndex) =>
        boardIndex >= 2 && card?.name === '魔術をつかうトーレン'
      );
      const saved = taurens.map(card => ({ card, turnTriggers: num(card.turnTriggers) }));
      taurens.forEach(card => { card.turnTriggers = limitOf(card); });

      try {
        return previousPlayHandCardToSlot(index, targetIndex);
      } finally {
        saved.forEach(entry => { entry.card.turnTriggers = entry.turnTriggers; });
      }
    };
  }

  const schedule = () => window.setTimeout(install, 100);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  window.addEventListener('acid-card-modules-ready', schedule, { once: true });
})();
