/* Wait until the Excel pool and all 12 tier modules are ready, then apply final rules. */
(() => {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const excelReady = typeof MINIONS !== 'undefined' && Array.isArray(MINIONS) &&
      MINIONS.some(card => String(card?.id || '').startsWith('excel_'));
    const tierModulesReady = window.__acidTierModulesReady === true;

    if ((!excelReady || !tierModulesReady) && attempts < 400) return;
    clearInterval(timer);

    if (!tierModulesReady) {
      console.error('[AcidCardModules] Final rules started before tier modules were ready.');
    }

    const rules = document.createElement('script');
    rules.src = './acidic_rain_authoritative_patch.js';
    rules.async = false;
    rules.onload = () => {
      const ui = document.createElement('script');
      ui.src = './acidic_rain_ui_score_spell_drag.js';
      ui.async = false;
      document.head.appendChild(ui);
    };
    document.head.appendChild(rules);
  }, 25);
})();