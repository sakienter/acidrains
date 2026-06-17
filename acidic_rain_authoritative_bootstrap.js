/* Wait until the asynchronous Excel card engine has replaced the pools, then apply final rules. */
(() => {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const excelReady = typeof MINIONS !== 'undefined' && Array.isArray(MINIONS) &&
      MINIONS.some(card => String(card?.id || '').startsWith('excel_'));
    if (!excelReady && attempts < 200) return;
    clearInterval(timer);
    const script = document.createElement('script');
    script.src = `./acidic_rain_authoritative_patch.js?v=${Date.now()}`;
    script.async = false;
    document.head.appendChild(script);
  }, 25);
})();
