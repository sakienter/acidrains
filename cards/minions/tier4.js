(() => {
  const moduleData = window.AcidTier4Minions;
  if (!moduleData) throw new Error('Tier 4 minion helpers are not loaded.');

  const fragmentNames = new Set(['円盤の破片']);
  function combineFragments(gameState) {
    if (!Array.isArray(gameState?.hand)) return false;
    let changed = false;
    while (true) {
      const indexes = gameState.hand
        .map((card, index) => fragmentNames.has(card?.name) || card?.fragmentMaterial ? index : -1)
        .filter(index => index >= 0);
      if (indexes.length < 2) break;
      gameState.hand.splice(indexes[1], 1);
      gameState.hand.splice(indexes[0], 1);
      const reward = typeof window.createAwakeningRewardSpell === 'function'
        ? window.createAwakeningRewardSpell()
        : { id:'awakening_reward', name:'覚醒報酬', emoji:'🌟', tier:0, cost:0, type:'spell', token:true, shopEligible:false, text:'現在の酒場グレード+1のミニオンを発見する。' };
      gameState.hand.push(reward);
      changed = true;
      if (typeof log === 'function') log('円盤の破片2枚が「覚醒報酬」になった。');
    }
    return changed;
  }

  if (!window.__tier4FragmentGainPatched && typeof gainCardToHand === 'function') {
    window.__tier4FragmentGainPatched = true;
    const previousGain = gainCardToHand;
    gainCardToHand = function(gameState, card, message) {
      const result = previousGain(gameState, card, message);
      if (result !== false) combineFragments(gameState);
      return result;
    };
  }

  const allowedNames = new Set(moduleData.definitions.map(card => String(card.name || '').trim()));
  const removedNames = [];
  for (let index = MINIONS.length - 1; index >= 0; index -= 1) {
    const card = MINIONS[index];
    if (Number(card?.tier) !== 4) continue;
    const name = String(card?.name || '').trim();
    if (allowedNames.has(name)) continue;
    removedNames.push(name || String(card?.id || '(名称なし)'));
    MINIONS.splice(index, 1);
  }
  window.__tier4RemovedLegacyMinionNames = removedNames.reverse();

  window.AcidCardModules.register({
    kind: 'minion',
    tier: 4,
    label: 'ティア4・ミニオン',
    definitions: moduleData.definitions,
    effects: moduleData.effects,
    apply: moduleData.apply,
  });
})();