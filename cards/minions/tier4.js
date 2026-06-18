(() => {
  const moduleData = window.AcidTier4Minions;
  if (!moduleData) throw new Error('Tier 4 minion helpers are not loaded.');

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