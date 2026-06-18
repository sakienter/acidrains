/* Grant a zero-cost Discover spell whenever an awakened minion is played from hand. */
window.addEventListener('load', () => {
  if (window.__acidAwakeningRewardInstalled) return;
  window.__acidAwakeningRewardInstalled = true;

  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function rewardTier(gameState) {
    return Math.min(6, Math.max(1, number(gameState?.tavernTier, 1) + 1));
  }

  function createAwakeningRewardSpell() {
    return {
      id: 'awakening_reward',
      name: '覚醒報酬',
      emoji: '🌟',
      tier: 0,
      cost: 0,
      type: 'spell',
      text: '使用時：現在の酒場グレード+1のミニオンを1体発見する。（グレード6ではグレード6）',
      cast(gameState) {
        const tier = rewardTier(gameState);
        const pool = (MINIONS || []).filter(card => Number(card?.tier || 0) === tier);
        const title = `覚醒報酬：グレード${tier}のミニオンを発見`;
        if (typeof discoverCardsBeyondTier === 'function') {
          discoverCardsBeyondTier(gameState, pool, 1, title);
        } else if (typeof discoverCards === 'function') {
          discoverCards(gameState, pool, 1, title);
        }
      },
    };
  }

  function grantAwakeningReward(gameState, sourceCard = null) {
    const reward = createAwakeningRewardSpell();
    const gained = gainCardToHand(gameState, reward, '「覚醒報酬」を獲得した。');
    if (gained !== false && typeof log === 'function' && sourceCard?.name) {
      log(`✨ ${sourceCard.name} の覚醒報酬を獲得した。`);
    }
    return gained;
  }

  window.createAwakeningRewardSpell = createAwakeningRewardSpell;
  window.grantAwakeningReward = grantAwakeningReward;

  const inheritedPlayHandCardToSlot = playHandCardToSlot;
  playHandCardToSlot = function(index, targetIndex) {
    const sourceCard = state.hand?.[index] || null;
    const grantsReward = Boolean(sourceCard && sourceCard.type !== 'spell' && sourceCard.awakened);
    const result = inheritedPlayHandCardToSlot(index, targetIndex);
    if (result && grantsReward) {
      grantAwakeningReward(state, sourceCard);
      if (typeof render === 'function') render();
    }
    return result;
  };
}, { once: true });
