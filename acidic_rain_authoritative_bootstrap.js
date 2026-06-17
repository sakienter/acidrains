/* Wait until the asynchronous Excel card engine has replaced the pools, then apply final rules. */
(() => {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const excelReady = typeof MINIONS !== 'undefined' && Array.isArray(MINIONS) &&
      MINIONS.some(card => String(card?.id || '').startsWith('excel_'));
    if (!excelReady && attempts < 200) return;
    clearInterval(timer);

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
