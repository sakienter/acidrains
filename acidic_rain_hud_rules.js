(() => {
  const style = document.createElement('style');
  style.textContent = `
    .board-stats .hud-label { color:#f7e9cd; font-size:.78rem; font-weight:700; white-space:nowrap; }
    .board-stats .coin-stat { background:rgba(70,44,22,.55); border-color:rgba(227,187,86,.35); }
    .board-stats .coin-stat strong { color:var(--gold); font-size:1.2rem; }
    .board-stats .free-reroll-stat strong { color:#9ee8ff; }
  `;
  document.head.appendChild(style);

  function updateHud() {
    const stats = document.querySelector('.board-stats');
    if (!stats) return;

    const oldGrowth = document.querySelector('#growthValue');
    if (oldGrowth) oldGrowth.closest('.inline-stat')?.remove();

    const gold = document.querySelector('#goldValue');
    const goldStat = gold?.closest('.inline-stat');
    if (goldStat && !goldStat.querySelector('.hud-label')) {
      goldStat.classList.add('coin-stat');
      gold.insertAdjacentHTML('beforebegin', '<span class="hud-label">残りコイン</span>');
    }

    const tier = document.querySelector('#tavernTierValue');
    const tierStat = tier?.closest('.inline-stat');
    if (tierStat && !tierStat.querySelector('.hud-label')) {
      tier.insertAdjacentHTML('beforebegin', '<span class="hud-label">酒場グレード</span>');
    }

    let freeValue = document.querySelector('#freeRerollValue');
    if (!freeValue && tierStat) {
      const freeStat = document.createElement('span');
      freeStat.className = 'inline-stat free-reroll-stat';
      freeStat.innerHTML = '<span class="icon">🔄</span><span class="hud-label">無料リロール</span><strong id="freeRerollValue">0</strong>';
      stats.insertBefore(freeStat, tierStat);
      freeValue = freeStat.querySelector('#freeRerollValue');
    }

    try {
      if (gold) gold.textContent = state.gold;
      if (tier) tier.textContent = state.tavernTier;
      if (freeValue) freeValue.textContent = (state.freeRerolls || 0) + (state.firstRerollFree ? 1 : 0);
    } catch (error) {
      return;
    }
  }

  document.addEventListener('DOMContentLoaded', updateHud);
  setInterval(updateHud, 150);
})();
