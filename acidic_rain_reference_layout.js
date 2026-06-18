/* Final HUD wording and numeric formatting for the fixed battlefield layout. */
window.addEventListener('load', () => {
  if (window.__acidReferenceLayoutInstalled) return;
  window.__acidReferenceLayoutInstalled = true;

  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function labelFor(selector, text) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  }

  function buttonMarkup(title, detail = '') {
    return `<span class="hud-button-title">${title}</span>${detail ? `<span class="hud-button-detail">${detail}</span>` : ''}`;
  }

  function paintReferenceHud() {
    const scoreValue = document.querySelector('#scoreValue');
    if (scoreValue) {
      const score = Math.max(0, Math.floor(number(state.score)));
      scoreValue.textContent = String(score).padStart(6, '0');
      scoreValue.closest('.score-stat')?.setAttribute('aria-label', `スコア ${score}`);
    }

    labelFor('.score-stat .hud-label', 'スコア');
    labelFor('.turn-stat .hud-label', 'ターン');
    labelFor('.timer-stat .hud-label', '残り');
    labelFor('.coin-stat .hud-label', 'コイン');
    labelFor('.inline-stat:has(#tavernTierValue) .hud-label', '酒場グレード');

    const tier = Math.max(1, Math.min(6, number(state.tavernTier, 1)));
    if (upgradeBtn) {
      if (tier >= 6) {
        upgradeBtn.innerHTML = buttonMarkup('グレード最大');
      } else {
        const cost = typeof getTavernUpgradeCost === 'function'
          ? Math.max(0, number(getTavernUpgradeCost(state)))
          : 0;
        upgradeBtn.innerHTML = buttonMarkup('グレードUP', `${tier} → ${tier + 1}　${cost}コイン`);
        upgradeBtn.setAttribute('aria-label', `酒場をグレード${tier + 1}へ上げる。${cost}コイン`);
      }
    }

    if (rerollBtn) {
      const rerollCost = typeof getRerollCost === 'function' ? Math.max(0, number(getRerollCost(state))) : 1;
      rerollBtn.innerHTML = buttonMarkup('リロール', rerollCost === 0 ? '無料' : `${rerollCost}コイン`);
      rerollBtn.setAttribute('aria-label', rerollCost === 0 ? '無料でリロール' : `${rerollCost}コインでリロール`);
    }

    const freezeBtn = document.querySelector('#freezeBtn');
    if (freezeBtn) {
      freezeBtn.innerHTML = buttonMarkup(state.frozen ? '凍結解除' : '凍結', state.frozen ? '次ターンで更新' : '酒場を保持');
      freezeBtn.setAttribute('aria-label', state.frozen ? '酒場の凍結を解除' : '酒場を凍結');
    }

    if (endTurnBtn) {
      endTurnBtn.innerHTML = '<span class="hud-button-title">ターン</span><span class="hud-button-title">終了</span>';
      endTurnBtn.setAttribute('aria-label', 'ターンを終了する');
    }
  }

  const inheritedRender = render;
  render = function() {
    const result = inheritedRender();
    paintReferenceHud();
    return result;
  };

  paintReferenceHud();
}, { once: true });
