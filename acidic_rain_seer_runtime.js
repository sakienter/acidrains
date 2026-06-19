(() => {
  if (window.__acidSeerRuntimeApplied) return;
  window.__acidSeerRuntimeApplied = true;

  const numberValue = value => Number(value || 0);
  const pending = () => Math.max(0, numberValue(state.nextFreeSpellPurchases)) > 0;

  if (typeof buyCard === 'function') {
    const previousBuyCard = buyCard;
    buyCard = function(index) {
      const card = state.shop?.[index] || null;
      if (card?.type !== 'spell' || !pending()) return previousBuyCard(index);
      const oldFlag = Boolean(state.spellDiscountCanReachZero);
      state.spellDiscountCanReachZero = true;
      try {
        return previousBuyCard(index);
      } finally {
        state.spellDiscountCanReachZero = oldFlag;
      }
    };
  }

  if (typeof renderShop === 'function') {
    const previousRenderShop = renderShop;
    renderShop = function() {
      if (!pending()) return previousRenderShop();
      const oldFlag = Boolean(state.spellDiscountCanReachZero);
      state.spellDiscountCanReachZero = true;
      try {
        return previousRenderShop();
      } finally {
        state.spellDiscountCanReachZero = oldFlag;
      }
    };
  }

  const normalize = value => String(value || '').trim();

  function duplicateGroups(kind, cards, property) {
    const groups = new Map();
    (cards || []).forEach(card => {
      const value = normalize(card?.[property]);
      if (!value) return;
      if (!groups.has(value)) groups.set(value, []);
      groups.get(value).push(card);
    });
    return [...groups.entries()]
      .filter(([, matches]) => matches.length > 1)
      .map(([value, matches]) => ({
        kind,
        property,
        value,
        count: matches.length,
        names: matches.map(card => normalize(card?.name)),
        ids: matches.map(card => normalize(card?.id)),
        tiers: matches.map(card => numberValue(card?.tier)),
      }));
  }

  function definitionDuplicates() {
    const duplicates = [];
    const modules = window.AcidCardModules;
    if (!modules?.registry) return duplicates;

    for (const kind of ['minion', 'spell']) {
      const names = new Map();
      const ids = new Map();
      for (let tier = 1; tier <= 6; tier += 1) {
        const moduleDefinition = modules.get(kind, tier);
        for (const definition of moduleDefinition?.definitions || []) {
          const name = normalize(definition?.name);
          const id = normalize(definition?.id);
          if (name) {
            if (!names.has(name)) names.set(name, []);
            names.get(name).push({ tier, id });
          }
          if (id) {
            if (!ids.has(id)) ids.set(id, []);
            ids.get(id).push({ tier, name });
          }
        }
      }
      names.forEach((matches, name) => {
        if (matches.length > 1) duplicates.push({ kind, property:'name', value:name, matches });
      });
      ids.forEach((matches, id) => {
        if (matches.length > 1) duplicates.push({ kind, property:'id', value:id, matches });
      });
    }
    return duplicates;
  }

  function runDuplicateAudit() {
    const minions = typeof MINIONS !== 'undefined' && Array.isArray(MINIONS) ? MINIONS : [];
    const spells = typeof SPELLS !== 'undefined' && Array.isArray(SPELLS) ? SPELLS : [];
    const poolDuplicates = [
      ...duplicateGroups('minion', minions, 'name'),
      ...duplicateGroups('minion', minions, 'id'),
      ...duplicateGroups('spell', spells, 'name'),
      ...duplicateGroups('spell', spells, 'id'),
    ];
    const definitions = definitionDuplicates();
    const report = {
      checkedAt: new Date().toISOString(),
      minionTemplates: minions.length,
      spellTemplates: spells.length,
      poolDuplicates,
      definitionDuplicates: definitions,
      passed: poolDuplicates.length === 0 && definitions.length === 0,
    };
    window.__acidDuplicateCardAudit = report;

    if (report.passed) {
      console.info('[AcidCardAudit] Duplicate card check passed.', report);
    } else {
      console.error('[AcidCardAudit] Duplicate card definitions remain.', report);
    }
    return report;
  }

  window.runAcidDuplicateCardAudit = runDuplicateAudit;

  const scheduleAudit = () => window.setTimeout(runDuplicateAudit, 0);
  if (window.AcidCardModules?.installed) scheduleAudit();
  else window.addEventListener('acid-card-modules-ready', scheduleAudit, { once:true });

  if (typeof setupRun === 'function') {
    const previousSetupRun = setupRun;
    setupRun = function() {
      state.nextFreeSpellPurchases = 0;
      const result = previousSetupRun();
      state.nextFreeSpellPurchases = 0;
      scheduleAudit();
      return result;
    };
  }

  state.nextFreeSpellPurchases = Math.max(0, numberValue(state.nextFreeSpellPurchases));

  if (!document.querySelector('script[data-acid-card-updates-20260619]')) {
    const script = document.createElement('script');
    script.src = './cards/card_updates_20260619.js';
    script.async = false;
    script.dataset.acidCardUpdates20260619 = 'true';
    document.body.appendChild(script);
  }

  if (!document.querySelector('script[data-acid-card-updates-20260619-finalize]')) {
    const script = document.createElement('script');
    script.src = './cards/card_updates_20260619_finalize.js';
    script.async = false;
    script.dataset.acidCardUpdates20260619Finalize = 'true';
    document.body.appendChild(script);
  }

  if (!document.querySelector('link[data-acid-card-motion-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './acidic_rain_card_motion.css';
    link.dataset.acidCardMotionStyle = 'true';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[data-acid-card-motion]')) {
    const script = document.createElement('script');
    script.src = './acidic_rain_card_motion.js';
    script.async = false;
    script.dataset.acidCardMotion = 'true';
    document.body.appendChild(script);
  }

  if (!document.querySelector('link[data-acid-card-readability-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './acidic_rain_card_readability.css';
    link.dataset.acidCardReadabilityStyle = 'true';
    document.head.appendChild(link);
  }

  if (!document.querySelector('link[data-acid-discover-card-readability-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './acidic_rain_discover_card_readability.css';
    link.dataset.acidDiscoverCardReadabilityStyle = 'true';
    document.head.appendChild(link);
  }

  if (!document.querySelector('link[data-acid-large-desktop-layout]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './acidic_rain_large_desktop_layout.css';
    link.dataset.acidLargeDesktopLayout = 'true';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[data-acid-card-readability]')) {
    const script = document.createElement('script');
    script.src = './acidic_rain_card_readability.js';
    script.async = false;
    script.dataset.acidCardReadability = 'true';
    document.body.appendChild(script);
  }

  if (!document.querySelector('script[data-acid-tauren-runtime]')) {
    const script = document.createElement('script');
    script.src = './acidic_rain_tauren_runtime.js';
    script.async = false;
    script.dataset.acidTaurenRuntime = 'true';
    document.body.appendChild(script);
  }

  if (typeof render === 'function') render();
})();